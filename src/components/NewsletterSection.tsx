import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HeadlessNewsletter } from '@/components/headless/HeadlessNewsletter';
import { Mail } from 'lucide-react';

/**
 * EDITABLE UI COMPONENT - NewsletterSection
 * 
 * Componente UI completamente editable para suscripción a newsletter.
 * El agente IA puede modificar colores, textos, layout, etc.
 * 
 * Consume lógica de HeadlessNewsletter (solo muestra email input).
 */

export const NewsletterSection = () => {
  return (
    <HeadlessNewsletter>
      {(logic) => (
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5"></div>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              {logic.success ? (
                <div className="space-y-6 py-8">
                  <div className="flex justify-center">
                    <div className="bg-primary/20 rounded-full p-4">
                      <Mail className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-foreground">
                    ¡Gracias por unirte! 🎉
                  </h3>
                  <p className="text-lg text-muted-foreground">
                    Recibirás nuestras mejores ofertas, consejos de bienestar y novedades de productos.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-2">
                      <span className="text-sm font-semibold text-primary">Newsletter</span>
                    </div>
                    <h3 className="text-4xl font-bold text-foreground">
                      Únete a la comunidad Bloom 🌸
                    </h3>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                      Recibe tips de bienestar, ofertas exclusivas y sé el primero en conocer nuestros nuevos productos
                    </p>
                  </div>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    logic.handleSubscribe();
                  }}
                  className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                >
                  <Input 
                    type="email"
                    placeholder="tu@correo.com"
                    value={logic.email}
                    onChange={(e) => logic.setEmail(e.target.value)}
                    disabled={logic.isSubmitting}
                    className="flex-1"
                    required
                  />
                  <Button 
                    type="submit"
                    disabled={logic.isSubmitting}
                    className="sm:w-auto"
                  >
                    {logic.isSubmitting ? 'Suscribiendo...' : 'Suscribirse'}
                  </Button>
                </form>
                
                {logic.error && (
                  <p className="text-sm text-destructive">
                    {logic.error}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </HeadlessNewsletter>
  );
};