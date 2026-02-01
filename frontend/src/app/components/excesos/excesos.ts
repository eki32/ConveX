import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IaService } from '../../services/ia';
import { CalendarioComponent } from "../calendario/calendario";


@Component({
  selector: 'app-excesos',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarioComponent],
  templateUrl: './excesos.html'
})
export class ExcesosComponent implements OnInit {

  private iaService = inject(IaService);
  private cdr = inject(ChangeDetectorRef);

  // Configuración de fechas
  anioActual = new Date().getFullYear();
  anioCalculo = this.anioActual - 1; // 2025

  // Datos oficiales VI Convenio DIA (Bizkaia Alimentación)
  jornadasMaximas: any = {
    2024: 1714,
    2025: 1710
  };

  // Variables vinculadas al HTML
  usuarioLogueado: any = {
    nombre: '',
    email: '',
    jornada: 40 
  };

  // Inputs de vacaciones y ausencias
  fechaInicioVacaciones: string = '';
  fechaFinVacaciones: string = '';
  diasVacaciones: number = 0;
  diasBaja: number = 0;

  // 1. Definimos los dos periodos
  periodoInvierno = { inicio: '', fin: '' };
  periodoVerano = { inicio: '', fin: '' };
  
  // Resultados del cálculo
  totalHorasRealizadas: number = 0;
  excesoHoras: number = 0;
  diasCompensacion: number = 0;
  cargando: boolean = false;

  // Festivos fijos Bizkaia
  readonly FESTIVOS_BIZKAIA = 14;

  constructor() {}

  ngOnInit() {
    this.cargarDatosUsuario();
  }

  /**
 * Calcula la suma de días de ambos periodos
 */
calcularDiasTotales() {
  const diasP1 = this.obtenerDiferencia(this.periodoInvierno.inicio, this.periodoInvierno.fin);
  const diasP2 = this.obtenerDiferencia(this.periodoVerano.inicio, this.periodoVerano.fin);
  
  // Sumamos ambos periodos
  this.diasVacaciones = diasP1 + diasP2;
  
  // Lanzamos el cálculo general del exceso [cite: 2026-02-01]
  this.ejecutarCalculo();
}

/**
 * Función auxiliar para calcular días naturales
 */
private obtenerDiferencia(inicio: string, fin: string): number {
  if (!inicio || !fin) return 0;
  
  const start = new Date(inicio);
  const end = new Date(fin);
  const diff = end.getTime() - start.getTime();
  
  if (diff < 0) return 0;
  
  // Calculamos días y sumamos 1 para incluir el día de inicio
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

  cargarDatosUsuario() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('usuarioLogueado');
      if (saved) {
        const d = JSON.parse(saved);
        
        // CARGAR TODOS LOS DATOS DEL USUARIO LOGUEADO
        this.usuarioLogueado = {
          nombre: d.nombre || '',
          email: d.email || '',
          jornadaContrato: d.jornadaContrato || 40
        };
        
        console.log('Usuario cargado:', this.usuarioLogueado); // Para debug
      } else {
        console.warn('No hay usuario logueado en localStorage');
        // Opcional: redirigir al login si no hay usuario
      }
    }
    this.ejecutarCalculo();
  }
  /**
   * Calcula los días entre las dos fechas seleccionadas
   */
  calcularDiasVacaciones() {
    if (this.fechaInicioVacaciones && this.fechaFinVacaciones) {
      const inicio = new Date(this.fechaInicioVacaciones);
      const fin = new Date(this.fechaFinVacaciones);
      const diffMs = fin.getTime() - inicio.getTime();
      
      if (diffMs >= 0) {
        this.diasVacaciones = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
      } else {
        this.diasVacaciones = 0;
      }
    } else {
      this.diasVacaciones = 0;
    }
    this.ejecutarCalculo();
  }

  /**
   * Lógica ajustada a semana laboral de LUNES A SÁBADO
   */
  ejecutarCalculo() {
    const horasSemana = this.usuarioLogueado.jornadaContrato || 0;
    
    // --- CAMBIO CLAVE: Al trabajar de L a S, la jornada diaria media es / 6 ---
    const horasDia = horasSemana / 6; 

    // --- CAMBIO CLAVE: Días laborables anuales (L-S) son aprox 306 ---
    const diasLaborablesTeoricosLS = 306 - this.FESTIVOS_BIZKAIA;
    
    // Horas que deberías hacer por calendario si no faltaras nunca
    const horasBaseAnuales = diasLaborablesTeoricosLS * horasDia;

    // Días de ausencia (Vacaciones + Bajas)
    const diasAusencia = (this.diasVacaciones || 0) + (this.diasBaja || 0);
    const horasNoRealizadas = diasAusencia * horasDia;

    // Total horas realmente trabajadas
    if (diasAusencia === 0) {
      // Si no hay datos de faltas, usamos el promedio anual de semanas
      this.totalHorasRealizadas = Math.round(horasSemana * 52.14);
    } else {
      this.totalHorasRealizadas = Math.round(horasBaseAnuales - horasNoRealizadas);
    }

    // Cálculo del exceso contra el convenio (1710h para 2025)
    const maximoConvenio = this.jornadasMaximas[this.anioCalculo] || 1710;
    this.excesoHoras = this.totalHorasRealizadas - maximoConvenio;

    if (this.excesoHoras < 0) this.excesoHoras = 0;

    // Días de descanso: Ahora se divide por la jornada diaria de 6 días
    this.diasCompensacion = this.excesoHoras > 0 
      ? Math.round((this.excesoHoras / horasDia) * 10) / 10 
      : 0;

    this.cdr.detectChanges();
  }

  async guardarJornada() {
    // VALIDACIÓN: Verificar que tenemos el email
    if (!this.usuarioLogueado.email) {
      alert('Error: No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.');
      return;
    }

    this.cargando = true;
    const email = this.usuarioLogueado.email;
    const jornada = this.usuarioLogueado.jornadaContrato;

    console.log('Guardando jornada:', { email, jornada }); // Para debug

    this.iaService.actualizarJornada(email, jornada).subscribe({
      next: (res: any) => {
        // Sincronizamos LocalStorage
        const localData = JSON.parse(localStorage.getItem('usuarioLogueado') || '{}');
        localData.jornadaContrato = jornada;
        localStorage.setItem('usuarioLogueado', JSON.stringify(localData));
        
        this.cargando = false;
        alert('¡Jornada guardada en la base de datos!');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al guardar:', err);
        this.cargando = false;
        alert('Error al guardar en el servidor: ' + (err.error?.message || err.message));
        this.cdr.detectChanges();
      }
    });
  }
}