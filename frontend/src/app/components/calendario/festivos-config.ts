/**
 * CONFIGURACIÓN DE FESTIVOS - BIZKAIA SECTOR ALIMENTACIÓN
 * 
 * Este archivo contiene los festivos oficiales de Bizkaia por año.
 * Actualizar cada año con los festivos correspondientes.
 * 
 * NOTA IMPORTANTE: Viernes Santo y Lunes de Pascua cambian cada año.
 * Consultar el calendario oficial de Bizkaia cada año.
 */

export const FESTIVOS_BIZKAIA: { [key: number]: FestivoOficial[] } = {
  2025: [
    { fecha: '2025-01-01', descripcion: 'Año Nuevo', tipo: 'Nacional' },
    { fecha: '2025-01-06', descripcion: 'Reyes Magos', tipo: 'Nacional' },
    { fecha: '2025-04-18', descripcion: 'Viernes Santo', tipo: 'Nacional' },
    { fecha: '2025-04-21', descripcion: 'Lunes de Pascua', tipo: 'Autonómico' },
    { fecha: '2025-05-01', descripcion: 'Día del Trabajo', tipo: 'Nacional' },
    { fecha: '2025-07-25', descripcion: 'Santiago Apóstol', tipo: 'Autonómico' },
    { fecha: '2025-08-15', descripcion: 'Asunción de la Virgen', tipo: 'Nacional' },
    { fecha: '2025-10-12', descripcion: 'Fiesta Nacional de España', tipo: 'Nacional' },
    { fecha: '2025-11-01', descripcion: 'Todos los Santos', tipo: 'Nacional' },
    { fecha: '2025-12-06', descripcion: 'Día de la Constitución', tipo: 'Nacional' },
    { fecha: '2025-12-08', descripcion: 'Inmaculada Concepción', tipo: 'Nacional' },
    { fecha: '2025-12-25', descripcion: 'Navidad', tipo: 'Nacional' }
  ],
  
  2026: [
    { fecha: '2026-01-01', descripcion: 'Año Nuevo', tipo: 'Nacional' },
    { fecha: '2026-01-06', descripcion: 'Reyes Magos', tipo: 'Nacional' },
    { fecha: '2026-04-03', descripcion: 'Viernes Santo', tipo: 'Nacional' },
    { fecha: '2026-04-06', descripcion: 'Lunes de Pascua', tipo: 'Autonómico' },
    { fecha: '2026-05-01', descripcion: 'Día del Trabajo', tipo: 'Nacional' },
    { fecha: '2026-07-25', descripcion: 'Santiago Apóstol', tipo: 'Autonómico' },
    { fecha: '2026-08-15', descripcion: 'Asunción de la Virgen', tipo: 'Nacional' },
    { fecha: '2026-10-12', descripcion: 'Fiesta Nacional de España', tipo: 'Nacional' },
    { fecha: '2026-11-01', descripcion: 'Todos los Santos', tipo: 'Nacional' },
    { fecha: '2026-12-06', descripcion: 'Día de la Constitución', tipo: 'Nacional' },
    { fecha: '2026-12-08', descripcion: 'Inmaculada Concepción', tipo: 'Nacional' },
    { fecha: '2026-12-25', descripcion: 'Navidad', tipo: 'Nacional' }
  ],
  
  2027: [
    { fecha: '2027-01-01', descripcion: 'Año Nuevo', tipo: 'Nacional' },
    { fecha: '2027-01-06', descripcion: 'Reyes Magos', tipo: 'Nacional' },
    { fecha: '2027-03-26', descripcion: 'Viernes Santo', tipo: 'Nacional' },
    { fecha: '2027-03-29', descripcion: 'Lunes de Pascua', tipo: 'Autonómico' },
    { fecha: '2027-05-01', descripcion: 'Día del Trabajo', tipo: 'Nacional' },
    { fecha: '2027-07-25', descripcion: 'Santiago Apóstol', tipo: 'Autonómico' },
    { fecha: '2027-08-15', descripcion: 'Asunción de la Virgen', tipo: 'Nacional' },
    { fecha: '2027-10-12', descripcion: 'Fiesta Nacional de España', tipo: 'Nacional' },
    { fecha: '2027-11-01', descripcion: 'Todos los Santos', tipo: 'Nacional' },
    { fecha: '2027-12-06', descripcion: 'Día de la Constitución', tipo: 'Nacional' },
    { fecha: '2027-12-08', descripcion: 'Inmaculada Concepción', tipo: 'Nacional' },
    { fecha: '2027-12-25', descripcion: 'Navidad', tipo: 'Nacional' }
  ],
  
  2028: [
    { fecha: '2028-01-01', descripcion: 'Año Nuevo', tipo: 'Nacional' },
    { fecha: '2028-01-06', descripcion: 'Reyes Magos', tipo: 'Nacional' },
    { fecha: '2028-04-14', descripcion: 'Viernes Santo', tipo: 'Nacional' },
    { fecha: '2028-04-17', descripcion: 'Lunes de Pascua', tipo: 'Autonómico' },
    { fecha: '2028-05-01', descripcion: 'Día del Trabajo', tipo: 'Nacional' },
    { fecha: '2028-07-25', descripcion: 'Santiago Apóstol', tipo: 'Autonómico' },
    { fecha: '2028-08-15', descripcion: 'Asunción de la Virgen', tipo: 'Nacional' },
    { fecha: '2028-10-12', descripcion: 'Fiesta Nacional de España', tipo: 'Nacional' },
    { fecha: '2028-11-01', descripcion: 'Todos los Santos', tipo: 'Nacional' },
    { fecha: '2028-12-06', descripcion: 'Día de la Constitución', tipo: 'Nacional' },
    { fecha: '2028-12-08', descripcion: 'Inmaculada Concepción', tipo: 'Nacional' },
    { fecha: '2028-12-25', descripcion: 'Navidad', tipo: 'Nacional' }
  ]
};

/**
 * FESTIVOS FIJOS - Se repiten cada año en la misma fecha
 * Úsalos como base si no tienes datos del año específico
 */
export const FESTIVOS_FIJOS = [
  { mes: 1, dia: 1, descripcion: 'Año Nuevo', tipo: 'Nacional' },
  { mes: 1, dia: 6, descripcion: 'Reyes Magos', tipo: 'Nacional' },
  { mes: 5, dia: 1, descripcion: 'Día del Trabajo', tipo: 'Nacional' },
  { mes: 7, dia: 25, descripcion: 'Santiago Apóstol', tipo: 'Autonómico' },
  { mes: 8, dia: 15, descripcion: 'Asunción de la Virgen', tipo: 'Nacional' },
  { mes: 10, dia: 12, descripcion: 'Fiesta Nacional de España', tipo: 'Nacional' },
  { mes: 11, dia: 1, descripcion: 'Todos los Santos', tipo: 'Nacional' },
  { mes: 12, dia: 6, descripcion: 'Día de la Constitución', tipo: 'Nacional' },
  { mes: 12, dia: 8, descripcion: 'Inmaculada Concepción', tipo: 'Nacional' },
  { mes: 12, dia: 25, descripcion: 'Navidad', tipo: 'Nacional' }
];

/**
 * FESTIVOS VARIABLES - Semana Santa (cambian cada año)
 * Estos deben actualizarse manualmente cada año
 */
export const SEMANA_SANTA: { [key: number]: { viernesSanto: string; lunesPascua: string } } = {
  2025: { viernesSanto: '2025-04-18', lunesPascua: '2025-04-21' },
  2026: { viernesSanto: '2026-04-03', lunesPascua: '2026-04-06' },
  2027: { viernesSanto: '2027-03-26', lunesPascua: '2027-03-29' },
  2028: { viernesSanto: '2028-04-14', lunesPascua: '2028-04-17' },
  2029: { viernesSanto: '2029-03-30', lunesPascua: '2029-04-02' },
  2030: { viernesSanto: '2030-04-19', lunesPascua: '2030-04-22' }
};

// Interfaces
export interface FestivoOficial {
  fecha: string;
  descripcion: string;
  tipo: 'Nacional' | 'Autonómico' | 'Local';
}

/**
 * INSTRUCCIONES PARA ACTUALIZAR CADA AÑO:
 * 
 * 1. Consultar el calendario laboral oficial de Bizkaia en:
 *    https://www.euskadi.eus/calendario-laboral/
 * 
 * 2. Añadir un nuevo objeto al array FESTIVOS_BIZKAIA con el año correspondiente
 * 
 * 3. Actualizar las fechas de Semana Santa en SEMANA_SANTA
 * 
 * 4. Verificar que no haya cambios en los festivos locales o autonómicos
 * 
 * 5. El componente de calendario automáticamente usará los datos del año anterior
 *    (porque se usa para calcular excesos del año que acaba de terminar)
 */