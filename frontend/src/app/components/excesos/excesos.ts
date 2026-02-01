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

  // ==================== CONFIGURACIÓN ====================
  anioActual = new Date().getFullYear();
  anioCalculo = this.anioActual - 1; // 2025

  // Jornadas máximas según Artículo 24 del VI Convenio DIA
  jornadasMaximas: any = {
    2025: 1780,
    2026: 1776,
    2027: 1772,
    2028: 1768
  };

  // Salarios base Grupo IV (Cajero/a) - Módulo B según Anexo I
  salariosBase: any = {
    2025: 16576.00,
    2026: 17040.13,
    2027: 17380.93,
    2028: 17728.55
  };

  // ==================== DATOS DEL USUARIO ====================
  usuarioLogueado: any = {
    nombre: '',
    email: '',
    jornadaContrato: 40  // Jornada semanal en horas
  };

  // ==================== INPUTS DE VACACIONES Y BAJAS ====================
  periodoInvierno = { inicio: '', fin: '' };
  periodoVerano = { inicio: '', fin: '' };
  diasVacaciones: number = 0;
  diasBaja: number = 0;

  // ==================== DATOS DEL CALENDARIO ====================
  diasLaborables: number = 0;
  festivosOficiales: number = 0;
  festivosConvenio: number = 0;

  // ==================== RESULTADOS DEL CÁLCULO ====================
  jornadaMaximaProporcional: number = 0;
  diasLaborablesEfectivos: number = 0;
  diasTrabajados: number = 0;
  totalHorasRealizadas: number = 0;
  excesoHoras: number = 0;
  diasCompensacion: number = 0;
  importeMonetario: number = 0;
  valorHoraExtra: number = 0;

  // ==================== CONSTANTES DEL CONVENIO ====================
  readonly RECARGO_HORA_EXTRA = 0.50; // 50% según Artículo 31
  readonly DIAS_SEMANA_LABORAL = 6; // Lunes a Sábado

  cargando: boolean = false;

  constructor() {}

  ngOnInit() {
    this.cargarDatosUsuario();
  }

  // ==================== CÁLCULO DE DÍAS DE VACACIONES ====================
  calcularDiasTotales() {
    const diasP1 = this.obtenerDiferencia(this.periodoInvierno.inicio, this.periodoInvierno.fin);
    const diasP2 = this.obtenerDiferencia(this.periodoVerano.inicio, this.periodoVerano.fin);
    
    this.diasVacaciones = diasP1 + diasP2;
    
    console.log('📅 Vacaciones calculadas:', {
      periodoInvierno: diasP1,
      periodoVerano: diasP2,
      total: this.diasVacaciones
    });
    
    this.ejecutarCalculo();
  }

  private obtenerDiferencia(inicio: string, fin: string): number {
    if (!inicio || !fin) return 0;
    
    const start = new Date(inicio);
    const end = new Date(fin);
    const diff = end.getTime() - start.getTime();
    
    if (diff < 0) return 0;
    
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  // ==================== CARGAR DATOS DEL USUARIO ====================
  cargarDatosUsuario() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('usuarioLogueado');
      if (saved) {
        const d = JSON.parse(saved);
        
        this.usuarioLogueado = {
          nombre: d.nombre || '',
          email: d.email || '',
          jornadaContrato: d.jornadaContrato || 40
        };
        
        console.log('👤 Usuario cargado:', this.usuarioLogueado);
      } else {
        console.warn('⚠️ No hay usuario logueado en localStorage');
      }
    }
    this.ejecutarCalculo();
  }

  // ==================== RECIBIR DATOS DEL CALENDARIO ====================
  /**
   * Este método será llamado desde el componente calendario
   * cuando se emitan los datos del calendario
   */
  recibirDatosCalendario(datos: {
    laborables: number,
    festivosOficiales: number,
    festivosConvenio: number
  }) {
    this.diasLaborables = datos.laborables;
    this.festivosOficiales = datos.festivosOficiales;
    this.festivosConvenio = datos.festivosConvenio;
    
    console.log('📊 Datos recibidos del calendario:', datos);
    this.ejecutarCalculo();
  }

  // ==================== CÁLCULO PRINCIPAL ====================
  ejecutarCalculo() {
    console.log('🔄 ==================== INICIANDO CÁLCULO ====================');
    
    // PASO 1: Jornada semanal del trabajador
    const horasSemana = this.usuarioLogueado.jornadaContrato || 40;
    console.log('PASO 1 - Jornada semanal:', horasSemana, 'horas');

    // PASO 2: Jornada máxima proporcional
    const jornadaMaximaBase = this.jornadasMaximas[this.anioCalculo] || 1780;
    this.jornadaMaximaProporcional = (jornadaMaximaBase * horasSemana) / 40;
    console.log('PASO 2 - Jornada máxima proporcional:', {
      base: jornadaMaximaBase,
      proporcional: this.jornadaMaximaProporcional.toFixed(2) + 'h'
    });

    // PASO 3: Horas diarias (jornada semanal / 6 días L-S)
    const horasDia = horasSemana / this.DIAS_SEMANA_LABORAL;
    console.log('PASO 3 - Horas por día:', horasDia.toFixed(2) + 'h');

    // PASO 4: Días laborables efectivos
// El calendario ya envía los días laborables NETOS (sin festivos)
    this.diasLaborablesEfectivos = this.diasLaborables;

      console.log('PASO 4 - Días laborables efectivos:', {
        laborablesNetos: this.diasLaborables,
        festivosOficiales: this.festivosOficiales,
        festivosConvenio: this.festivosConvenio,
        efectivos: this.diasLaborablesEfectivos
      });

        // PASO 5: Días trabajados (laborables - vacaciones - bajas)
      const diasAusencia = (this.diasVacaciones || 0) + (this.diasBaja || 0);
      this.diasTrabajados = this.diasLaborablesEfectivos - diasAusencia;

      console.log('PASO 5 - Días trabajados:', {
        laborablesEfectivos: this.diasLaborablesEfectivos,
        vacaciones: this.diasVacaciones,
        bajas: this.diasBaja,
        ausenciaTotal: diasAusencia,
        trabajados: this.diasTrabajados
      });

    // PASO 6: Total horas realizadas
    this.totalHorasRealizadas = Math.round(this.diasTrabajados * horasDia);
    console.log('PASO 6 - Total horas realizadas:', this.totalHorasRealizadas + 'h');

    // PASO 7: Exceso de horas
    this.excesoHoras = Math.max(0, this.totalHorasRealizadas - this.jornadaMaximaProporcional);
    console.log('PASO 7 - Exceso de horas:', {
      realizadas: this.totalHorasRealizadas,
      maximaProporcional: this.jornadaMaximaProporcional.toFixed(2),
      exceso: this.excesoHoras.toFixed(2) + 'h'
    });

    // PASO 8: Días de compensación
    this.diasCompensacion = this.excesoHoras > 0 
      ? Math.round((this.excesoHoras / horasDia) * 10) / 10 
      : 0;
    console.log('PASO 8 - Días de compensación:', this.diasCompensacion);

    // PASO 9: Cálculo del importe monetario
    this.calcularImporteMonetario();
    
    console.log('✅ ==================== CÁLCULO FINALIZADO ====================');
    
    this.cdr.detectChanges();
  }

  // ==================== CÁLCULO DEL IMPORTE MONETARIO ====================
  calcularImporteMonetario() {
    if (this.excesoHoras === 0) {
      this.importeMonetario = 0;
      this.valorHoraExtra = 0;
      return;
    }

    // Salario base anual según convenio (Grupo IV - Módulo B)
    const salarioBaseAnual = this.salariosBase[this.anioCalculo] || 16576.00;
    
    // Jornada máxima del convenio
    const jornadaMaxima = this.jornadasMaximas[this.anioCalculo] || 1780;
    
    // Valor de la hora ordinaria
    const valorHoraOrdinaria = salarioBaseAnual / jornadaMaxima;
    
    // Valor de la hora extra con recargo del 50%
    this.valorHoraExtra = valorHoraOrdinaria * (1 + this.RECARGO_HORA_EXTRA);
    
    // Total a pagar
    this.importeMonetario = this.excesoHoras * this.valorHoraExtra;
    
    console.log('PASO 9 - Cálculo monetario:', {
      salarioBaseAnual: salarioBaseAnual.toFixed(2) + '€',
      jornadaMaxima: jornadaMaxima + 'h',
      valorHoraOrdinaria: valorHoraOrdinaria.toFixed(2) + '€',
      recargo: (this.RECARGO_HORA_EXTRA * 100) + '%',
      valorHoraExtra: this.valorHoraExtra.toFixed(2) + '€',
      excesoHoras: this.excesoHoras.toFixed(2) + 'h',
      importeTotal: this.importeMonetario.toFixed(2) + '€'
    });
    
    // Redondear a 2 decimales
    this.importeMonetario = Math.round(this.importeMonetario * 100) / 100;
  }

  // ==================== GUARDAR JORNADA ====================
  async guardarJornada() {
    if (!this.usuarioLogueado.email) {
      alert('Error: No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.');
      return;
    }

    this.cargando = true;
    const email = this.usuarioLogueado.email;
    const jornada = this.usuarioLogueado.jornadaContrato;

    console.log('💾 Guardando jornada:', { email, jornada });

    this.iaService.actualizarJornada(email, jornada).subscribe({
      next: (res: any) => {
        const localData = JSON.parse(localStorage.getItem('usuarioLogueado') || '{}');
        localData.jornadaContrato = jornada;
        localStorage.setItem('usuarioLogueado', JSON.stringify(localData));
        
        this.cargando = false;
        alert('¡Jornada guardada en la base de datos!');
        
        // Recalcular con la nueva jornada
        this.ejecutarCalculo();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ Error al guardar:', err);
        this.cargando = false;
        alert('Error al guardar en el servidor: ' + (err.error?.message || err.message));
        this.cdr.detectChanges();
      }
    });
  }
}