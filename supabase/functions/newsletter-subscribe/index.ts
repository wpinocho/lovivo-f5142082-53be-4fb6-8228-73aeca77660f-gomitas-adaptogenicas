import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, first_name, last_name, phone, store_id } = await req.json()

    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Mailchimp credentials from environment
    const MAILCHIMP_API_KEY = Deno.env.get('MAILCHIMP_API_KEY')
    const MAILCHIMP_SERVER_PREFIX = Deno.env.get('MAILCHIMP_SERVER_PREFIX')
    const MAILCHIMP_AUDIENCE_ID = Deno.env.get('MAILCHIMP_AUDIENCE_ID')

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_SERVER_PREFIX || !MAILCHIMP_AUDIENCE_ID) {
      console.error('Missing Mailchimp configuration')
      return new Response(
        JSON.stringify({ error: 'Newsletter service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare member data for Mailchimp
    const memberData: any = {
      email_address: email,
      status: 'subscribed',
      merge_fields: {},
    }

    // Add optional fields
    if (first_name) {
      memberData.merge_fields.FNAME = first_name
    }
    if (last_name) {
      memberData.merge_fields.LNAME = last_name
    }
    if (phone) {
      memberData.merge_fields.PHONE = phone
    }

    // Subscribe to Mailchimp
    const mailchimpUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`
    
    const mailchimpResponse = await fetch(mailchimpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`anystring:${MAILCHIMP_API_KEY}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(memberData),
    })

    const mailchimpData = await mailchimpResponse.json()

    if (!mailchimpResponse.ok) {
      // Handle "already subscribed" as success
      if (mailchimpData.title === 'Member Exists') {
        console.log('User already subscribed:', email)
        return new Response(
          JSON.stringify({ success: true, message: 'Already subscribed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.error('Mailchimp API error:', mailchimpData)
      return new Response(
        JSON.stringify({ error: 'Failed to subscribe to newsletter' }),
        { status: mailchimpResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Also save to Supabase customers table for record keeping
    if (store_id) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Check if customer already exists
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', email)
          .eq('store_id', store_id)
          .single()

        if (!existingCustomer) {
          // Create new customer
          await supabase.from('customers').insert({
            email,
            first_name: first_name || null,
            last_name: last_name || null,
            phone: phone || null,
            allow_mkt: true,
            store_id,
          })
        } else {
          // Update existing customer
          await supabase
            .from('customers')
            .update({ allow_mkt: true })
            .eq('id', existingCustomer.id)
        }
      } catch (dbError) {
        console.error('Error saving to database:', dbError)
        // Don't fail the request if DB save fails, Mailchimp subscription is primary
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Successfully subscribed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Newsletter subscribe error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})