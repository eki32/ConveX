import { Component, OnInit, inject, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FESTIVOS_BIZKAIA } from './festivos-config';

interface DiaCalendario {
  fecha: Date;
  dia: number;
  mes: number;
  esFestivo: boolean;
  esDiaConvenio: boolean;
  esFinDeSemana: boolean;
  esLaborable: boolean;
  tipoFestivo?: string;
  descripcion?: string;
}

interface MesCalendario {
  nombre: string;
  numero: number;
  dias: DiaCalendario[];
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendario.html',
  styleUrls: ['./calendario.css'],
})
export class CalendarioComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  // Calcular automáticamente el año anterior
  anio = new Date().getFullYear() - 1; // Siempre muestra el año pasado
  meses: MesCalendario[] = [];

  // Festivos se cargarán dinámicamente según el año
  festivosOficiales: any[] = [];

  // Días adicionales de convenio
  diasConvenio: any[] = [];

  totalFestivos = 0;
  totalLaborables = 0;
  totalDiasConvenio = 0;

  diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  nombresMeses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  @Output() datosCalendario = new EventEmitter<{
    laborables: number;
    festivosOficiales: number;
    festivosConvenio: number;
    totalDiasLS?: number;
    fechasFestivos?: Date[];
  }>();

  ngOnInit() {
    this.cargarFestivosDelAnio();
    this.generarCalendario();
  }

  /**
   * Carga los festivos oficiales según el año
   */
  cargarFestivosDelAnio() {
    // Cargar festivos desde el archivo de configuración
    if (FESTIVOS_BIZKAIA[this.anio]) {
      this.festivosOficiales = FESTIVOS_BIZKAIA[this.anio];
    } else {
      // Si no tenemos datos del año, generar festivos fijos
      console.warn(`⚠️ Festivos de ${this.anio} no disponibles. Usando festivos genéricos.`);
      this.festivosOficiales = this.generarFestivosFijos(this.anio);
    }

    // Días de convenio (siempre 24 y 31 de diciembre)
    this.diasConvenio = [
      { fecha: `${this.anio}-12-24`, descripcion: 'Nochebuena (Convenio)' },
      { fecha: `${this.anio}-12-31`, descripcion: 'Fin de Año (Convenio)' },
    ];
  }

  /**
   * Genera festivos fijos para cualquier año (sin Semana Santa que es variable)
   */
  generarFestivosFijos(anio: number): any[] {
    return [
      { fecha: `${anio}-01-01`, descripcion: 'Año Nuevo', tipo: 'Nacional' },
      { fecha: `${anio}-01-06`, descripcion: 'Reyes Magos', tipo: 'Nacional' },
      { fecha: `${anio}-05-01`, descripcion: 'Día del Trabajo', tipo: 'Nacional' },
      { fecha: `${anio}-07-25`, descripcion: 'Santiago Apóstol', tipo: 'Autonómico' },
      { fecha: `${anio}-08-15`, descripcion: 'Asunción de la Virgen', tipo: 'Nacional' },
      { fecha: `${anio}-10-12`, descripcion: 'Fiesta Nacional de España', tipo: 'Nacional' },
      { fecha: `${anio}-11-01`, descripcion: 'Todos los Santos', tipo: 'Nacional' },
      { fecha: `${anio}-12-06`, descripcion: 'Día de la Constitución', tipo: 'Nacional' },
      { fecha: `${anio}-12-08`, descripcion: 'Inmaculada Concepción', tipo: 'Nacional' },
      { fecha: `${anio}-12-25`, descripcion: 'Navidad', tipo: 'Nacional' },
    ];
  }

  generarCalendario() {
    this.meses = [];

    for (let mes = 0; mes < 12; mes++) {
      const diasDelMes = this.generarDiasMes(mes);

      this.meses.push({
        nombre: this.nombresMeses[mes],
        numero: mes + 1,
        dias: diasDelMes,
      });
    }

    this.calcularTotales();
  }

  generarDiasMes(mes: number): DiaCalendario[] {
    const dias: DiaCalendario[] = [];
    const primerDia = new Date(this.anio, mes, 1);
    const ultimoDia = new Date(this.anio, mes + 1, 0);

    // Calcular días vacíos al inicio (lunes = 0)
    let diaSemana = primerDia.getDay();
    diaSemana = diaSemana === 0 ? 6 : diaSemana - 1; // Ajustar domingo

    // Añadir días vacíos
    for (let i = 0; i < diaSemana; i++) {
      dias.push({
        fecha: new Date(0),
        dia: 0,
        mes: mes,
        esFestivo: false,
        esDiaConvenio: false,
        esFinDeSemana: false,
        esLaborable: false,
      });
    }

    // Añadir días del mes
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(this.anio, mes, dia);
      const fechaStr = this.formatearFecha(fecha);

      const festivo = this.festivosOficiales.find((f) => f.fecha === fechaStr);
      const diaConvenio = this.diasConvenio.find((d) => d.fecha === fechaStr);

      const diaSem = fecha.getDay();
      const esFinDeSemana = diaSem === 0; // Solo domingo

      dias.push({
        fecha: fecha,
        dia: dia,
        mes: mes,
        esFestivo: !!festivo,
        esDiaConvenio: !!diaConvenio,
        esFinDeSemana: esFinDeSemana,
        esLaborable: !festivo && !diaConvenio && !esFinDeSemana,
        tipoFestivo: festivo?.tipo,
        descripcion: festivo?.descripcion || diaConvenio?.descripcion,
      });
    }

    return dias;
  }

  formatearFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  /**
   * CORRECCIÓN CRÍTICA DEL CÁLCULO DE TOTALES
   *
   * Conceptos:
   * - totalLS: Total días L-S del año (365 - domingos ≈ 313)
   * - laborables: Días que NO son domingo NI festivo NI convenio
   * - oficiales: Festivos oficiales (sin contar si caen en domingo)
   * - convenio: Días de convenio (24 y 31 dic)
   */
  calcularTotales() {
    let laborables = 0;
    let oficiales = 0;
    let convenio = 0;
    let totalLS = 0;
    let totalDiasAnio = 0; // Para verificación
    const fechasFestivos: Date[] = [];

    console.log('🔍 ==================== ANÁLISIS CALENDARIO ====================');

    this.meses.forEach((mes) => {
      mes.dias.forEach((d) => {
        // Ignorar días vacíos del calendario (día = 0)
        if (d.dia === 0) return;

        totalDiasAnio++;
        const fecha = new Date(d.fecha);
        const diaSemana = fecha.getDay();
        const esDomingo = diaSemana === 0;

        // ============ PASO 1: TOTAL DÍAS L-S ============
        // Contar todos los días que NO sean domingo
        if (!esDomingo) {
          totalLS++;
        }

        // ============ PASO 2: FESTIVOS OFICIALES ============
        // Contar festivos (independientemente del día de la semana)
        if (d.esFestivo) {
          oficiales++;
          fechasFestivos.push(fecha);
        }

        // ============ PASO 3: DÍAS DE CONVENIO ============
        // Contar días de convenio (24 y 31 dic)
        if (d.esDiaConvenio) {
          convenio++;
          fechasFestivos.push(fecha);
        }

        // ============ PASO 4: DÍAS LABORABLES NETOS ============
        /**
         * CORRECCIÓN CRÍTICA:
         * Un día es laborable SI Y SOLO SI:
         * - NO es domingo
         * - NO es festivo oficial
         * - NO es día de convenio
         *
         * IMPORTANTE: Un festivo que cae en domingo SOLO se cuenta como domingo
         * NO se resta dos veces (domingo + festivo)
         */
        if (!esDomingo && !d.esFestivo && !d.esDiaConvenio) {
          d.esLaborable = true;
          laborables++;
        } else {
          d.esLaborable = false;
        }
      });
    });

    // ============ ASIGNACIÓN DE TOTALES ============
    this.totalLaborables = laborables;
    this.totalFestivos = oficiales;
    this.totalDiasConvenio = convenio;

    // ============ VERIFICACIÓN DE CONSISTENCIA ============
    const domingos = totalDiasAnio - totalLS;
    const festivosLaborables = oficiales; // Aproximación
    const calculoVerificacion = totalLS - festivosLaborables - convenio;

    console.log('📊 DATOS DEL CALENDARIO:', {
      anio: this.anio,
      diasTotales: totalDiasAnio,
      domingos: domingos,
      totalDiasLS: totalLS,
      festivosOficiales: oficiales,
      festivosConvenio: convenio,
      laborablesNetos: laborables,
      verificacion: `${totalLS} - ${festivosLaborables} - ${convenio} ≈ ${calculoVerificacion}`,
    });

    // ============ ALERTAS DE INCONSISTENCIA ============
    if (totalDiasAnio !== 365 && totalDiasAnio !== 366) {
      console.error('❌ ERROR: Total días del año incorrecto:', totalDiasAnio);
    }

    if (totalLS > 313 || totalLS < 310) {
      console.warn('⚠️ ADVERTENCIA: Días L-S fuera de rango normal (310-313):', totalLS);
    }

    if (laborables > totalLS) {
      console.error('❌ ERROR CRÍTICO: Laborables no puede ser mayor que Total L-S');
      console.error('Laborables:', laborables, 'Total L-S:', totalLS);
    }

    // ============ EMISIÓN DE DATOS ============
    this.datosCalendario.emit({
      laborables: this.totalLaborables,
      festivosOficiales: this.totalFestivos,
      festivosConvenio: this.totalDiasConvenio,
      totalDiasLS: totalLS,
      fechasFestivos: fechasFestivos,
    });

    console.log('✅ Datos emitidos a componente padre:', {
      laborables: this.totalLaborables,
      festivosOficiales: this.totalFestivos,
      festivosConvenio: this.totalDiasConvenio,
      totalDiasLS: totalLS,
    });
    console.log('=========================================================');
  }

  obtenerClaseDia(dia: DiaCalendario): string {
    if (dia.dia === 0) return 'dia-vacio';
    if (dia.esFestivo) return 'dia-festivo';
    if (dia.esDiaConvenio) return 'dia-convenio';
    if (dia.esFinDeSemana) return 'dia-fin-semana';
    return 'dia-laborable';
  }

  toggleDiaConvenio(dia: DiaCalendario) {
    dia.esDiaConvenio = !dia.esDiaConvenio;
    dia.esLaborable = !dia.esDiaConvenio && !dia.esFestivo && !dia.esFinDeSemana;

    // Recalcular totales del calendario
    this.calcularTotales();
  }

  tieneFestivos(mes: MesCalendario): boolean {
    return mes.dias.some((dia) => dia.esFestivo || dia.esDiaConvenio);
  }
}
