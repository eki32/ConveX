import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IaService } from '../../services/ia';
import { CalendarioComponent } from '../calendario/calendario';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: 'app-excesos',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarioComponent],
  templateUrl: './excesos.html',
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
    2028: 1768,
  };

  // Salarios base Grupo IV (Cajero/a) - Módulo B según Anexo I
  salariosBase: any = {
    2025: 16576.0,
    2026: 17040.13,
    2027: 17380.93,
    2028: 17728.55,
  };

  // ==================== DATOS DEL USUARIO ====================
  usuarioLogueado: any = {
    nombre: '',
    email: '',
    jornadaContrato: 40, // Jornada semanal en horas
  };

  // ==================== INPUTS DE VACACIONES Y BAJAS ====================
  periodoInvierno = { inicio: '', fin: '' };
  periodoVerano = { inicio: '', fin: '' };
  diasVacaciones: number = 0;
  diasBaja: number = 0;
  festivosEnVacaciones: number = 0; // Festivos que caen en vacaciones
  diasCompensacionVacaciones: number = 0; // Días adicionales por festivos en vacaciones

  // ==================== DATOS DEL CALENDARIO ====================
  diasTotalesAnio: number = 0; // 365 o 366 (bisiesto)
  diasLaborables: number = 0; // Total L-S laborables del calendario
  festivosOficiales: number = 0;
  festivosConvenio: number = 0;
  festivosDelCalendario: Date[] = []; // Array de fechas festivas del calendario
  totalDiasLS: number = 0; // Total días L-S del calendario (para "Efectivos")

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
  readonly RECARGO_HORA_EXTRA = 0.5; // 50% según Artículo 31
  readonly DIAS_SEMANA_LABORAL = 6; // Lunes a Sábado

  cargando: boolean = false;

constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    this.calcularDiasTotalesAnio();
    this.cargarDatosUsuario();
  }


 async exportarInformePDF() {
  // Verificamos si estamos en el navegador/móvil para evitar errores de SSR
  if (isPlatformBrowser(this.platformId)) {
    try {
      // Carga dinámica de librerías para solucionar el error de "Budget"
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF() as any;
      const fechaHoy = new Date().toLocaleDateString();

      // Encabezado con tus variables de usuario
      doc.setFontSize(18);
      doc.setTextColor(0, 51, 102);
      doc.text('Informe de Cálculo: Excesos de Jornada', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generado el: ${fechaHoy} | Trabajador: ${this.usuarioLogueado.nombre}`, 14, 28);
      doc.text(`Referencia: VI Convenio Colectivo DIA - Año 2025`, 14, 33);

      // 1. Tabla de Datos de Entrada (Usando tus variables de estado)
      doc.autoTable({
        startY: 40,
        head: [['Concepto', 'Valor']],
        body: [
          ['Jornada Semanal Contrato', `${this.usuarioLogueado.jornadaContrato}h`],
          ['Jornada Máxima Anual (Convenio 2025)', '1.780 horas'],
          ['Días Laborables (Calendario)', `${this.diasLaborables} días`],
          ['Días de Vacaciones disfrutados', `${this.diasVacaciones || 0} días`],
          ['Días de Baja Médica', `${this.diasBaja || 0} días`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [0, 51, 102] }
      });

      // 2. Resultados del Cálculo (Usando tus variables de resultado)
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('RESULTADO DEL CÓMPUTO ANUAL', 14, finalY);

      doc.autoTable({
        startY: finalY + 5,
        body: [
          ['Total Horas Efectivas Realizadas', `${this.totalHorasRealizadas}h`],
          ['EXCESO DETECTADO', `${this.excesoHoras.toFixed(2)}h`],
          ['Compensación en Días de Descanso', `${this.diasCompensacion} días`],
          ['Importe Monetario Bruto (+50% Recargo)', `${this.importeMonetario} €`]
        ],
        styles: { fontSize: 12, cellPadding: 5 },
        columnStyles: { 1: { fontStyle: 'bold', halign: 'right' } }
      });

      // Pie de página legal según Convenio DIA
      doc.setFontSize(8);
      doc.setTextColor(150);
      const pageHeight = doc.internal.pageSize.height;
      doc.text('Cálculo basado en jornada de trabajo efectivo (Art. 24 VI Convenio DIA). Recargo de horas según Art. 31.', 14, pageHeight - 10);

      // Guardar el archivo con el nombre del usuario
      doc.save(`Informe_Excesos_2025_${this.usuarioLogueado.nombre}.pdf`);

    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Error técnico al generar el informe. Revisa la consola.');
    }
  }
}


  // ==================== CALCULAR DÍAS TOTALES DEL AÑO ====================
  calcularDiasTotalesAnio() {
    // Verificar si el año es bisiesto
    const esBisiesto =
      (this.anioCalculo % 4 === 0 && this.anioCalculo % 100 !== 0) || this.anioCalculo % 400 === 0;
    this.diasTotalesAnio = esBisiesto ? 366 : 365;

    console.log(
      `📅 Año ${this.anioCalculo}: ${this.diasTotalesAnio} días (${esBisiesto ? 'bisiesto' : 'normal'})`,
    );
  }

  // ==================== CÁLCULO DE DÍAS DE VACACIONES ====================
  calcularDiasTotales() {
    const diasP1 = this.obtenerDiferencia(this.periodoInvierno.inicio, this.periodoInvierno.fin);
    const diasP2 = this.obtenerDiferencia(this.periodoVerano.inicio, this.periodoVerano.fin);

    this.diasVacaciones = diasP1 + diasP2;

    // Al cambiar las fechas, recalculamos festivos en ese periodo y ejecutamos el cálculo general
    this.calcularFestivosEnVacaciones();
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

  // ==================== CALCULAR FESTIVOS EN VACACIONES ====================
  /**
   * Detecta cuántos festivos caen dentro de los períodos de vacaciones
   * Según el Estatuto de los Trabajadores (Art. 38.3), los festivos que coincidan
   * con el periodo de vacaciones NO se descuentan del periodo vacacional
   */
  calcularFestivosEnVacaciones() {
    this.festivosEnVacaciones = 0;

    if (!this.festivosDelCalendario || this.festivosDelCalendario.length === 0) {
      console.warn('⚠️ No hay datos de festivos del calendario');
      return;
    }

    const periodosVacaciones: { inicio: Date; fin: Date }[] = [];

    // Convertir períodos de vacaciones a objetos Date
    if (this.periodoInvierno.inicio && this.periodoInvierno.fin) {
      periodosVacaciones.push({
        inicio: new Date(this.periodoInvierno.inicio),
        fin: new Date(this.periodoInvierno.fin),
      });
    }

    if (this.periodoVerano.inicio && this.periodoVerano.fin) {
      periodosVacaciones.push({
        inicio: new Date(this.periodoVerano.inicio),
        fin: new Date(this.periodoVerano.fin),
      });
    }

    // Verificar cada festivo
    this.festivosDelCalendario.forEach((festivo) => {
      const diaSemana = festivo.getDay();
      const esDomingo = diaSemana === 0;

      // Solo contar festivos laborables (L-S) que caen en vacaciones
      if (!esDomingo) {
        periodosVacaciones.forEach((periodo) => {
          if (festivo >= periodo.inicio && festivo <= periodo.fin) {
            this.festivosEnVacaciones++;
          }
        });
      }
    });

    // Los festivos en vacaciones NO se descuentan del periodo vacacional
    // Por tanto, estos días se "recuperan" sumándolos a los días trabajados
    this.diasCompensacionVacaciones = this.festivosEnVacaciones;

    console.log('🎉 Festivos en vacaciones (Art. 38.3 ET):', {
      festivosDetectados: this.festivosEnVacaciones,
      diasQueSeRecuperan: this.diasCompensacionVacaciones,
    });
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
          jornadaContrato: d.jornadaContrato || 40,
        };

        console.log('👤 Usuario cargado:', this.usuarioLogueado);
      } else {
        console.warn('⚠️ No hay usuario logueado en localStorage');
      }
    }
  }

  // ==================== RECIBIR DATOS DEL CALENDARIO ====================
  /**
   * Este método será llamado desde el componente calendario
   * cuando se emitan los datos del calendario
   */
  recibirDatosCalendario(datos: any) {
    // Asignamos los datos extensos del calendario
    this.diasLaborables = datos.laborables;
    this.festivosOficiales = datos.festivosOficiales;
    this.festivosConvenio = datos.festivosConvenio;
    this.totalDiasLS = datos.totalDiasLS;
    this.festivosDelCalendario = datos.fechasFestivos;

    // Si ya hay vacaciones puestas, recalculamos si algún festivo cae dentro
    if (this.diasVacaciones > 0) {
      this.calcularFestivosEnVacaciones();
    }

    // Disparamos cálculo principal
    this.ejecutarCalculo();
  }

  // ==================== CÁLCULO PRINCIPAL CORREGIDO ====================
  /**
   * METODOLOGÍA DE CÁLCULO SEGÚN LEGISLACIÓN LABORAL:
   *
   * 1. Jornada máxima anual del convenio (base 40h/semana)
   * 2. Jornada máxima proporcional según contrato individual
   * 3. Horas diarias teóricas (jornada semanal / 6 días L-S)
   * 4. Días laborables del año según calendario oficial
   * 5. Días efectivamente trabajados (laborables - ausencias + festivos en vacaciones)
   * 6. Horas totales realizadas (días trabajados × horas diarias)
   * 7. Exceso = horas realizadas - jornada máxima proporcional
   * 8. Compensación en días (exceso / horas diarias)
   * 9. Valoración económica (según Art. 31 del convenio)
   */
  ejecutarCalculo() {
    // ============ VALIDACIÓN PREVIA ============
    if (!this.diasLaborables || this.diasLaborables === 0) {
      console.log('⏳ Esperando datos del calendario para calcular...');
      return;
    }

    console.log('🔄 ==================== CÁLCULO DE EXCESOS DE JORNADA ====================');
    console.log('📋 Marco Legal: VI Convenio Colectivo DIA + Estatuto de los Trabajadores');

    // ============ PASO 1: JORNADA MÁXIMA ANUAL (BASE 40H) ============
    const jornadaMaximaBase = this.jornadasMaximas[this.anioCalculo] || 1780;
    console.log(`PASO 1 - Jornada máxima anual (40h/sem): ${jornadaMaximaBase}h`);

    // ============ PASO 2: JORNADA PROPORCIONAL SEGÚN CONTRATO ============
    const horasSemana = this.usuarioLogueado.jornadaContrato || 40;
    this.jornadaMaximaProporcional = (jornadaMaximaBase * horasSemana) / 40;
    console.log(
      `PASO 2 - Jornada proporcional (${horasSemana}h/sem): ${this.jornadaMaximaProporcional.toFixed(2)}h`,
    );

    // ============ PASO 3: HORAS DIARIAS TEÓRICAS ============
    const horasDia = horasSemana / this.DIAS_SEMANA_LABORAL;
    console.log(`PASO 3 - Horas por día (L-S): ${horasDia.toFixed(2)}h`);

    // ============ PASO 4: DÍAS LABORABLES DEL CALENDARIO ============
    this.diasLaborablesEfectivos = this.diasLaborables;
    console.log(
      `PASO 4 - Días laborables calendario (L-S netos): ${this.diasLaborablesEfectivos} días`,
    );

    // ============ PASO 5: DÍAS EFECTIVAMENTE TRABAJADOS ============
    /**
     * CORRECCIÓN CRÍTICA:
     * - Los días trabajados NO dependen de la proporción de jornada
     * - Un trabajador a 20h trabaja los mismos DÍAS, pero menos HORAS por día
     * - Fórmula: Laborables - Vacaciones - Bajas + Festivos en vacaciones
     *
     * Fundamento legal:
     * - Art. 38.3 ET: Festivos en vacaciones no se descuentan del periodo
     * - Los festivos en vacaciones se "recuperan" como días trabajados adicionales
     */
    this.diasTrabajados =
      this.diasLaborables -
      (this.diasVacaciones || 0) -
      (this.diasBaja || 0) +
      (this.festivosEnVacaciones || 0);

    console.log('PASO 5 - Días efectivamente trabajados:', {
      diasLaborables: this.diasLaborables,
      menosVacaciones: -(this.diasVacaciones || 0),
      menosBajas: -(this.diasBaja || 0),
      masFestivosEnVacaciones: +(this.festivosEnVacaciones || 0),
      resultado: this.diasTrabajados,
    });

    // ============ PASO 6: HORAS TOTALES REALIZADAS ============
    /**
     * Aquí SÍ aplicamos las horas por día según la jornada contratada
     * Un trabajador a 20h trabaja 3.33h/día × días trabajados
     * Un trabajador a 40h trabaja 6.67h/día × días trabajados
     */
    this.totalHorasRealizadas = Math.round(this.diasTrabajados * horasDia);
    console.log(
      `PASO 6 - Horas totales realizadas: ${this.diasTrabajados} días × ${horasDia.toFixed(2)}h = ${this.totalHorasRealizadas}h`,
    );

    // ============ PASO 7: EXCESO DE JORNADA ============
    /**
     * Comparación: Horas realizadas vs Jornada máxima proporcional
     * Solo hay exceso si se supera la jornada máxima legal
     */
    const excesoReal = this.totalHorasRealizadas - this.jornadaMaximaProporcional;
    this.excesoHoras = Math.max(0, excesoReal);

    console.log('PASO 7 - Cálculo de exceso:', {
      horasRealizadas: this.totalHorasRealizadas,
      jornadaMaxima: this.jornadaMaximaProporcional.toFixed(2),
      diferencia: excesoReal.toFixed(2),
      exceso: this.excesoHoras.toFixed(2),
    });

    // ============ PASO 8: COMPENSACIÓN EN DÍAS ============
    /**
     * CORRECCIÓN: La compensación por festivos en vacaciones NO se suma aquí
     * Ya está incluida en el cálculo de exceso (PASO 5)
     *
     * La compensación en días es SOLO por el exceso de horas trabajadas
     */
    this.diasCompensacion =
      this.excesoHoras > 0 ? Math.round((this.excesoHoras / horasDia) * 10) / 10 : 0;

    console.log(
      `PASO 8 - Días de compensación: ${this.excesoHoras.toFixed(2)}h ÷ ${horasDia.toFixed(2)}h = ${this.diasCompensacion} días`,
    );

    // ============ PASO 9: VALORACIÓN ECONÓMICA ============
    this.calcularImporteMonetario();

    // ============ RESUMEN FINAL ============
    console.log('📊 ==================== RESUMEN FINAL ====================');
    console.log({
      jornadaContratada: `${horasSemana}h/semana`,
      jornadaMaximaAnual: `${this.jornadaMaximaProporcional.toFixed(2)}h`,
      diasTrabajados: `${this.diasTrabajados} días`,
      horasRealizadas: `${this.totalHorasRealizadas}h`,
      excesoHoras: `${this.excesoHoras.toFixed(2)}h`,
      compensacionDias: `${this.diasCompensacion} días`,
      importeMonetario: `${this.importeMonetario.toFixed(2)}€`,
      festivosEnVacaciones: `${this.festivosEnVacaciones} festivos recuperados`,
    });
    console.log('=========================================================');

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
    const salarioBaseAnual = this.salariosBase[this.anioCalculo] || 16576.0;

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
      recargo: this.RECARGO_HORA_EXTRA * 100 + '%',
      valorHoraExtra: this.valorHoraExtra.toFixed(2) + '€',
      excesoHoras: this.excesoHoras.toFixed(2) + 'h',
      importeTotal: this.importeMonetario.toFixed(2) + '€',
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
      },
    });
  }
}
