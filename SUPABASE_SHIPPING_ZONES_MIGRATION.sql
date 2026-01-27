-- ================================================================
-- MIGRACIÓN: Tabla de Zonas de Envío para Gummy Bloom
-- ================================================================
-- Instrucciones:
-- 1. Abre tu proyecto en Supabase Dashboard
-- 2. Ve a SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script
-- ================================================================

-- Crear tabla de zonas de envío
CREATE TABLE IF NOT EXISTS shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Nombre de la zona (ej: "México", "USA - Costa Oeste")
  description TEXT, -- Descripción opcional
  countries TEXT[] NOT NULL DEFAULT '{}', -- Array de códigos de país ISO (ej: ['MX', 'US'])
  states TEXT[] DEFAULT '{}', -- Array opcional de estados/regiones
  cities TEXT[] DEFAULT '{}', -- Array opcional de ciudades específicas
  postal_codes TEXT[] DEFAULT '{}', -- Array opcional de códigos postales
  shipping_cost INTEGER NOT NULL DEFAULT 0, -- Costo de envío en centavos
  free_shipping_threshold INTEGER, -- Monto mínimo para envío gratis (en centavos)
  estimated_days_min INTEGER NOT NULL DEFAULT 3, -- Días mínimos de entrega
  estimated_days_max INTEGER NOT NULL DEFAULT 7, -- Días máximos de entrega
  is_active BOOLEAN NOT NULL DEFAULT true, -- Si la zona está activa
  priority INTEGER NOT NULL DEFAULT 0, -- Prioridad (mayor número = mayor prioridad)
  store_id UUID NOT NULL, -- Relación con la tienda
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_shipping_zones_store ON shipping_zones(store_id);
CREATE INDEX IF NOT EXISTS idx_shipping_zones_active ON shipping_zones(is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_zones_countries ON shipping_zones USING GIN(countries);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_shipping_zones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_shipping_zones_updated_at ON shipping_zones;
CREATE TRIGGER trigger_update_shipping_zones_updated_at
  BEFORE UPDATE ON shipping_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_shipping_zones_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE shipping_zones IS 'Zonas de envío configurables por tienda con costos y tiempos de entrega';
COMMENT ON COLUMN shipping_zones.shipping_cost IS 'Costo en centavos (ej: 999 = $9.99)';
COMMENT ON COLUMN shipping_zones.free_shipping_threshold IS 'Compra mínima para envío gratis en centavos';
COMMENT ON COLUMN shipping_zones.priority IS 'Mayor número = mayor prioridad al calcular envío';

-- Insertar datos de ejemplo para Gummy Bloom
-- IMPORTANTE: Reemplaza 'tu-store-id-aqui' con el UUID real de tu tienda

-- México
INSERT INTO shipping_zones (name, description, countries, states, shipping_cost, free_shipping_threshold, estimated_days_min, estimated_days_max, is_active, priority, store_id)
VALUES 
  ('México - Nacional', 'Envíos a todo México', ARRAY['MX'], ARRAY[]::TEXT[], 15000, 99900, 3, 7, true, 10, 'tu-store-id-aqui'),
  ('Ciudad de México', 'Envío express en CDMX', ARRAY['MX'], ARRAY['Ciudad de México', 'CDMX'], 8000, 50000, 1, 3, true, 20, 'tu-store-id-aqui'),
  ('Zona Metropolitana', 'Estado de México, Querétaro, Puebla, Morelos', ARRAY['MX'], ARRAY['Estado de México', 'Querétaro', 'Puebla', 'Morelos'], 10000, 75000, 2, 5, true, 15, 'tu-store-id-aqui');

-- Estados Unidos  
INSERT INTO shipping_zones (name, description, countries, states, shipping_cost, free_shipping_threshold, estimated_days_min, estimated_days_max, is_active, priority, store_id)
VALUES 
  ('USA - Nacional', 'Envíos a todo Estados Unidos', ARRAY['US'], ARRAY[]::TEXT[], 999, 7500, 5, 10, true, 10, 'tu-store-id-aqui'),
  ('California', 'Envío rápido en California', ARRAY['US'], ARRAY['CA', 'California'], 599, 5000, 2, 4, true, 20, 'tu-store-id-aqui'),
  ('Costa Oeste', 'Washington, Oregón, Nevada', ARRAY['US'], ARRAY['WA', 'Washington', 'OR', 'Oregon', 'NV', 'Nevada'], 699, 6000, 3, 6, true, 15, 'tu-store-id-aqui');

-- Canadá
INSERT INTO shipping_zones (name, description, countries, shipping_cost, free_shipping_threshold, estimated_days_min, estimated_days_max, is_active, priority, store_id)
VALUES 
  ('Canadá - Nacional', 'Envíos a todo Canadá', ARRAY['CA'], 1499, 10000, 7, 14, true, 10, 'tu-store-id-aqui');

-- ================================================================
-- VERIFICACIÓN
-- ================================================================
-- Ejecuta esta consulta para verificar que todo se creó correctamente:

SELECT 
  name,
  countries,
  states,
  shipping_cost / 100.0 as shipping_price,
  free_shipping_threshold / 100.0 as free_shipping_at,
  estimated_days_min || '-' || estimated_days_max || ' días' as delivery_time,
  is_active,
  priority
FROM shipping_zones
ORDER BY priority DESC, name;

-- ================================================================
-- POLÍTICAS RLS (Row Level Security) - OPCIONAL
-- ================================================================
-- Si quieres que los usuarios solo vean las zonas de su tienda:

ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer zonas activas
CREATE POLICY "Public can read active shipping zones"
  ON shipping_zones
  FOR SELECT
  USING (is_active = true);

-- Política: Solo admins pueden insertar/actualizar
CREATE POLICY "Store owners can manage their zones"
  ON shipping_zones
  FOR ALL
  USING (store_id = current_setting('app.current_store_id', true)::UUID);