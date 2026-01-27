-- Migration: create_shipping_zones_table
-- Created: 2026-01-27T14:47:54.004391

-- Create shipping_zones table
CREATE TABLE IF NOT EXISTS shipping_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  countries JSONB DEFAULT '[]'::jsonb,
  states JSONB DEFAULT '[]'::jsonb,
  cities JSONB DEFAULT '[]'::jsonb,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  free_shipping_threshold DECIMAL(10,2),
  currency_code VARCHAR(3) DEFAULT 'USD',
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_shipping_zones_store_id ON shipping_zones(store_id);
CREATE INDEX idx_shipping_zones_active ON shipping_zones(is_active);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shipping_zones_updated_at
    BEFORE UPDATE ON shipping_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE shipping_zones IS 'Zonas de envío configurables para la tienda';
COMMENT ON COLUMN shipping_zones.priority IS 'Mayor prioridad = más específico (ej: CDMX=10, México Nacional=1)';
COMMENT ON COLUMN shipping_zones.free_shipping_threshold IS 'Monto mínimo para envío gratis en esta zona';