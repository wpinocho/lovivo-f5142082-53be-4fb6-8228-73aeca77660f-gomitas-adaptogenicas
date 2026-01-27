/**
 * Configuración de zonas de envío para Gummy Bloom
 * 
 * Este archivo define las zonas de envío disponibles para la tienda.
 * Cuando Supabase esté completamente configurado, estos datos se migrarán a la BD.
 */

export interface ShippingZone {
  id: string
  name: string
  description?: string
  countries: string[] // Códigos ISO de países (ej: ['MX', 'US'])
  states?: string[] // Estados o regiones específicas
  cities?: string[] // Ciudades específicas
  postalCodes?: string[] // Códigos postales específicos
  shippingCost: number // Costo en centavos
  freeShippingThreshold?: number // Monto mínimo para envío gratis (en centavos)
  estimatedDaysMin: number
  estimatedDaysMax: number
  isActive: boolean
  priority: number // Mayor número = mayor prioridad
}

export const shippingZones: ShippingZone[] = [
  // México
  {
    id: 'mx-national',
    name: 'México - Nacional',
    description: 'Envíos a todo México',
    countries: ['MX'],
    shippingCost: 15000, // $150 MXN
    freeShippingThreshold: 99900, // $999 MXN
    estimatedDaysMin: 3,
    estimatedDaysMax: 7,
    isActive: true,
    priority: 10
  },
  {
    id: 'mx-cdmx',
    name: 'Ciudad de México',
    description: 'Envío express en CDMX',
    countries: ['MX'],
    states: ['Ciudad de México', 'CDMX'],
    shippingCost: 8000, // $80 MXN
    freeShippingThreshold: 50000, // $500 MXN
    estimatedDaysMin: 1,
    estimatedDaysMax: 3,
    isActive: true,
    priority: 20
  },
  {
    id: 'mx-zona-metropolitana',
    name: 'Zona Metropolitana',
    description: 'Estado de México, Querétaro, Puebla, Morelos',
    countries: ['MX'],
    states: ['Estado de México', 'Querétaro', 'Puebla', 'Morelos'],
    shippingCost: 10000, // $100 MXN
    freeShippingThreshold: 75000, // $750 MXN
    estimatedDaysMin: 2,
    estimatedDaysMax: 5,
    isActive: true,
    priority: 15
  },
  
  // Estados Unidos
  {
    id: 'us-national',
    name: 'USA - Nacional',
    description: 'Envíos a todo Estados Unidos',
    countries: ['US'],
    shippingCost: 999, // $9.99 USD
    freeShippingThreshold: 7500, // $75 USD
    estimatedDaysMin: 5,
    estimatedDaysMax: 10,
    isActive: true,
    priority: 10
  },
  {
    id: 'us-california',
    name: 'California',
    description: 'Envío rápido en California',
    countries: ['US'],
    states: ['CA', 'California'],
    shippingCost: 599, // $5.99 USD
    freeShippingThreshold: 5000, // $50 USD
    estimatedDaysMin: 2,
    estimatedDaysMax: 4,
    isActive: true,
    priority: 20
  },
  {
    id: 'us-west-coast',
    name: 'Costa Oeste',
    description: 'Washington, Oregón, Nevada',
    countries: ['US'],
    states: ['WA', 'Washington', 'OR', 'Oregon', 'NV', 'Nevada'],
    shippingCost: 699, // $6.99 USD
    freeShippingThreshold: 6000, // $60 USD
    estimatedDaysMin: 3,
    estimatedDaysMax: 6,
    isActive: true,
    priority: 15
  },
  
  // Canadá
  {
    id: 'ca-national',
    name: 'Canadá - Nacional',
    description: 'Envíos a todo Canadá',
    countries: ['CA'],
    shippingCost: 1499, // $14.99 CAD
    freeShippingThreshold: 10000, // $100 CAD
    estimatedDaysMin: 7,
    estimatedDaysMax: 14,
    isActive: true,
    priority: 10
  }
]

/**
 * Encuentra la zona de envío más adecuada según el destino
 * @param country Código ISO del país
 * @param state Estado o región (opcional)
 * @param city Ciudad (opcional)
 * @param postalCode Código postal (opcional)
 * @returns Zona de envío encontrada o null
 */
export const findShippingZone = (
  country: string,
  state?: string,
  city?: string,
  postalCode?: string
): ShippingZone | null => {
  const activeZones = shippingZones
    .filter(zone => zone.isActive)
    .filter(zone => zone.countries.includes(country))
  
  if (activeZones.length === 0) return null
  
  // Buscar zona más específica primero (mayor prioridad)
  const sortedZones = activeZones.sort((a, b) => b.priority - a.priority)
  
  for (const zone of sortedZones) {
    // Si tiene códigos postales específicos
    if (zone.postalCodes && zone.postalCodes.length > 0 && postalCode) {
      if (zone.postalCodes.includes(postalCode)) return zone
    }
    
    // Si tiene ciudades específicas
    if (zone.cities && zone.cities.length > 0 && city) {
      if (zone.cities.some(c => c.toLowerCase() === city.toLowerCase())) return zone
    }
    
    // Si tiene estados específicos
    if (zone.states && zone.states.length > 0 && state) {
      if (zone.states.some(s => s.toLowerCase() === state.toLowerCase())) return zone
    }
    
    // Si solo tiene país (zona nacional)
    if (!zone.states && !zone.cities && !zone.postalCodes) {
      return zone
    }
  }
  
  // Fallback: zona nacional del país
  return sortedZones.find(zone => !zone.states && !zone.cities && !zone.postalCodes) || null
}

/**
 * Calcula el costo de envío para un destino
 * @param country Código ISO del país
 * @param orderTotal Total de la orden en centavos
 * @param state Estado o región (opcional)
 * @param city Ciudad (opcional)
 * @param postalCode Código postal (opcional)
 * @returns { cost: number, zone: ShippingZone | null, isFree: boolean }
 */
export const calculateShipping = (
  country: string,
  orderTotal: number,
  state?: string,
  city?: string,
  postalCode?: string
): { cost: number; zone: ShippingZone | null; isFree: boolean } => {
  const zone = findShippingZone(country, state, city, postalCode)
  
  if (!zone) {
    return { cost: 0, zone: null, isFree: false }
  }
  
  // Verificar si califica para envío gratis
  const isFree = zone.freeShippingThreshold 
    ? orderTotal >= zone.freeShippingThreshold
    : false
  
  return {
    cost: isFree ? 0 : zone.shippingCost,
    zone,
    isFree
  }
}

/**
 * Obtiene todas las zonas activas
 */
export const getActiveShippingZones = (): ShippingZone[] => {
  return shippingZones.filter(zone => zone.isActive)
}

/**
 * Obtiene zonas por país
 */
export const getZonesByCountry = (country: string): ShippingZone[] => {
  return shippingZones
    .filter(zone => zone.isActive && zone.countries.includes(country))
    .sort((a, b) => b.priority - a.priority)
}