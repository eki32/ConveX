export interface Usuario {
  id?: number;            // El ID que genera MySQL automáticamente
  nombre: string;
  email: string;
  fechaAlta: string;      // Usamos string porque el input tipo date de HTML devuelve 'YYYY-MM-DD'
  categoria: 'G1' | 'G2' | 'G3' | 'G4'; // Limitamos a los grupos reales del convenio
  jornada?: number;       // Por defecto será 100, pero lo dejamos opcional
}