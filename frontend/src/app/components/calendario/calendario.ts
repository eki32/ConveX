import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  Input,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
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
  esVacaciones?: boolean;
  esBaja?: boolean;
  horasTrabajadas: number;
  horasOriginales?: number;
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
  template: `<!-- El template se mantiene en archivo separado -->`,
  templateUrl: './calendario.html',
  styleUrls: ['./calendario.css'],
})
export class CalendarioComponent implements OnInit, OnChanges {
  private cdr = inject(ChangeDetectorRef);

  anio = new Date().getFullYear() - 1;
  meses: MesCalendario[] = [];
  festivosOficiales: any[] = [];
  diasConvenio: any[] = [];

  // Totales
  totalFestivos = 0;
  totalLaborables = 0;
  totalDiasConvenio = 0;
  totalHorasTrabajadas = 0;
  horasDescontadasVacaciones = 0;
  horasDescontadasBajas = 0;

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
    totalHorasTrabajadas: number;
    horasDescontadasVacaciones: number;
    horasDescontadasBajas: number;
    festivosOficiales: number;
    festivosConvenio: number;
    diasLaborables: number;
    fechasFestivos?: Date[];
  }>();

  @Input() periodoInvierno: any;
  @Input() periodoVerano: any;
  @Input() diasBaja: number = 0;

  // ✅ NUEVO: Variables para manejar eventos táctiles y mouse
  private longPressTimer: any = null;
  private longPressActivado = false;
  private touchMoved = false; // Para detectar si el usuario está haciendo scroll

  ngOnInit() {
    this.cargarFestivosDelAnio();
    this.generarCalendario();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['periodoInvierno'] || changes['periodoVerano'] || changes['diasBaja']) {
      if (this.meses.length > 0) {
        this.aplicarVacacionesYBajas();
        this.calcularTotales();
      }
    }
  }

  cargarFestivosDelAnio() {
    if (FESTIVOS_BIZKAIA[this.anio]) {
      this.festivosOficiales = FESTIVOS_BIZKAIA[this.anio];
    } else {
      console.warn(`⚠️ Festivos de ${this.anio} no disponibles. Usando festivos genéricos.`);
      this.festivosOficiales = this.generarFestivosFijos(this.anio);
    }

    this.diasConvenio = [
      { fecha: `${this.anio}-12-24`, descripcion: 'Nochebuena (Convenio)' },
      { fecha: `${this.anio}-12-31`, descripcion: 'Fin de Año (Convenio)' },
    ];
  }

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

    this.aplicarVacacionesYBajas();
    this.calcularTotales();
  }

  esFechaEnVacaciones(fecha: Date): boolean {
    if (!fecha || fecha.getTime() === 0) return false;

    const check = (p: any) => {
      if (!p?.inicio || !p?.fin) return false;
      const inicio = new Date(p.inicio);
      const fin = new Date(p.fin);
      inicio.setHours(0, 0, 0, 0);
      fin.setHours(0, 0, 0, 0);
      const actual = new Date(fecha);
      actual.setHours(0, 0, 0, 0);
      return actual >= inicio && actual <= fin;
    };

    return check(this.periodoInvierno) || check(this.periodoVerano);
  }

  generarDiasMes(mes: number): DiaCalendario[] {
    const dias: DiaCalendario[] = [];
    const primerDia = new Date(this.anio, mes, 1);
    const ultimoDia = new Date(this.anio, mes + 1, 0);

    let diaSemana = primerDia.getDay();
    diaSemana = diaSemana === 0 ? 6 : diaSemana - 1;

    for (let i = 0; i < diaSemana; i++) {
      dias.push({
        fecha: new Date(0),
        dia: 0,
        mes: mes,
        esFestivo: false,
        esDiaConvenio: false,
        esFinDeSemana: false,
        esLaborable: false,
        horasTrabajadas: 0,
      });
    }

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(this.anio, mes, dia);
      const fechaStr = this.formatearFecha(fecha);

      const festivo = this.festivosOficiales.find((f) => f.fecha === fechaStr);
      const diaConvenio = this.diasConvenio.find((d) => d.fecha === fechaStr);

      const enVacaciones = this.esFechaEnVacaciones(fecha);

      const diaSem = fecha.getDay();
      const esFinDeSemana = diaSem === 0;

      const esLaborable = !festivo && !diaConvenio && !esFinDeSemana && !enVacaciones;

      dias.push({
        fecha: fecha,
        dia: dia,
        mes: mes,
        esFestivo: !!festivo,
        esDiaConvenio: !!diaConvenio,
        esFinDeSemana: esFinDeSemana,
        esLaborable: esLaborable,
        esVacaciones: enVacaciones,
        esBaja: false,
        horasTrabajadas: 0,
        horasOriginales: 0,
        tipoFestivo: festivo?.tipo,
        descripcion: enVacaciones ? 'Vacaciones' : festivo?.descripcion || diaConvenio?.descripcion,
      });
    }

    return dias;
  }

  aplicarVacacionesYBajas() {
    this.meses.forEach((mes) => {
      mes.dias.forEach((dia) => {
        if (dia.dia > 0 && dia.horasOriginales !== undefined) {
          if (dia.descripcion === 'Baja Médica') return;
          dia.horasTrabajadas = dia.horasOriginales;
          dia.esVacaciones = this.esFechaEnVacaciones(dia.fecha);
          dia.esBaja = false;
        }
      });
    });

    this.meses.forEach((mes) => {
      mes.dias.forEach((dia) => {
        if (dia.dia > 0 && dia.esVacaciones) {
          if (dia.horasOriginales === undefined || dia.horasOriginales === 0) {
            dia.horasOriginales = dia.horasTrabajadas;
          }
          dia.horasTrabajadas = 0;
          dia.descripcion = 'Vacaciones';
        }
      });
    });

    if (this.diasBaja > 0) {
      let diasBajaRestantes = this.diasBaja;

      for (let mesIdx = 0; mesIdx < this.meses.length && diasBajaRestantes > 0; mesIdx++) {
        const mes = this.meses[mesIdx];

        for (let diaIdx = 0; diaIdx < mes.dias.length && diasBajaRestantes > 0; diaIdx++) {
          const dia = mes.dias[diaIdx];

          const esBajaManual = dia.esBaja && dia.descripcion === 'Baja Médica (Manual)';
          if (
            dia.dia > 0 &&
            dia.esLaborable &&
            !dia.esVacaciones &&
            !dia.esFestivo &&
            !dia.esDiaConvenio &&
            !esBajaManual
          ) {
            if (dia.horasOriginales === undefined || dia.horasOriginales === 0) {
              dia.horasOriginales = dia.horasTrabajadas;
            }

            dia.esBaja = true;
            dia.horasTrabajadas = 0;
            dia.descripcion = 'Baja Médica (Automática)';
            diasBajaRestantes--;
          }
        }
      }
    }
  }

  formatearFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  actualizarHoras(dia: DiaCalendario, event: any, inputRef: HTMLInputElement) {
    const raw = event.target.value;

    if (raw === '' || raw === '.' || raw.endsWith('.')) {
      const valor = parseFloat(raw);
      if (!isNaN(valor)) {
        dia.horasTrabajadas = Math.min(24, Math.max(0, valor));
        dia.horasOriginales = dia.horasTrabajadas;
      }
      this.calcularTotales();
      return;
    }

    const valor = parseFloat(raw) || 0;
    dia.horasTrabajadas = Math.min(24, Math.max(0, valor));
    dia.horasOriginales = dia.horasTrabajadas;

    inputRef.value = dia.horasTrabajadas.toString();

    this.aplicarVacacionesYBajas();
    this.calcularTotales();
  }

  rellenarJornadaEstandar(horasPorDia: number = 6.67) {
    this.meses.forEach((mes) => {
      mes.dias.forEach((dia) => {
        if (dia.esLaborable && dia.dia > 0) {
          dia.horasTrabajadas = horasPorDia;
          dia.horasOriginales = horasPorDia;
        }
      });
    });
    this.aplicarVacacionesYBajas();
    this.calcularTotales();
  }

  limpiarHoras() {
    this.meses.forEach((mes) => {
      mes.dias.forEach((dia) => {
        dia.horasTrabajadas = 0;
        dia.horasOriginales = 0;
      });
    });
    this.aplicarVacacionesYBajas();
    this.calcularTotales();
  }

  calcularTotales() {
    let laborables = 0;
    let oficiales = 0;
    let convenio = 0;
    let totalHoras = 0;
    let horasVacaciones = 0;
    let horasBajas = 0;
    const fechasFestivos: Date[] = [];

    this.meses.forEach((mes) => {
      mes.dias.forEach((d) => {
        if (d.dia === 0) return;

        const esDomingo = d.fecha.getDay() === 0;

        if (d.esFestivo) {
          oficiales++;
          fechasFestivos.push(d.fecha);
        }

        if (d.esDiaConvenio) {
          convenio++;
          fechasFestivos.push(d.fecha);
        }

        if (!esDomingo && !d.esFestivo && !d.esDiaConvenio && !d.esBaja && !d.esVacaciones) {
          laborables++;
        }

        totalHoras += d.horasTrabajadas;

        if (d.esVacaciones && d.horasOriginales && d.horasOriginales > 0) {
          horasVacaciones += d.horasOriginales;
        }

        if (d.esBaja && d.horasOriginales && d.horasOriginales > 0) {
          horasBajas += d.horasOriginales;
        }
      });
    });

    this.totalLaborables = laborables;
    this.totalFestivos = oficiales;
    this.totalDiasConvenio = convenio;
    this.totalHorasTrabajadas = Math.round(totalHoras * 100) / 100;
    this.horasDescontadasVacaciones = Math.round(horasVacaciones * 100) / 100;
    this.horasDescontadasBajas = Math.round(horasBajas * 100) / 100;

    this.datosCalendario.emit({
      totalHorasTrabajadas: this.totalHorasTrabajadas,
      horasDescontadasVacaciones: this.horasDescontadasVacaciones,
      horasDescontadasBajas: this.horasDescontadasBajas,
      festivosOficiales: this.totalFestivos,
      festivosConvenio: this.totalDiasConvenio,
      diasLaborables: this.totalLaborables,
      fechasFestivos: fechasFestivos,
    });
  }

  obtenerClaseDia(dia: DiaCalendario): string {
    if (dia.dia === 0) return 'dia-vacio';
    if (dia.esBaja) return 'dia-baja';
    if (dia.esVacaciones) return 'dia-vacaciones';
    if (dia.esFestivo) return 'dia-festivo';
    if (dia.esDiaConvenio) return 'dia-convenio';
    if (dia.esFinDeSemana) return 'dia-fin-semana';
    return 'dia-laborable';
  }

  // ✅ NUEVO: Manejo de eventos TÁCTILES (touchstart, touchend, touchmove)
  onTouchStart(dia: DiaCalendario, event: TouchEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.classList.contains('indicador-convenio')) return;
    if (dia.dia === 0 || dia.esFestivo || dia.esFinDeSemana || dia.esVacaciones) return;

    this.touchMoved = false;
    this.longPressActivado = false;

    this.longPressTimer = setTimeout(() => {
      if (!this.touchMoved) {
        this.longPressActivado = true;
        this.toggleDiaBaja(dia);
        // Vibración háptica si está disponible
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, 600); // 600ms para móviles (un poco más corto que 800ms)
  }

  onTouchMove(event: TouchEvent) {
    // Si el usuario mueve el dedo (scroll), cancelar el long press
    this.touchMoved = true;
    this.cancelLongPress();
  }

  onTouchEnd(event: TouchEvent) {
    this.cancelLongPress();
  }

  // ✅ NUEVO: Manejo de eventos MOUSE (para escritorio)
  onMouseDown(dia: DiaCalendario, event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.classList.contains('indicador-convenio')) return;
    if (dia.dia === 0 || dia.esFestivo || dia.esFinDeSemana || dia.esVacaciones) return;

    this.longPressActivado = false;

    this.longPressTimer = setTimeout(() => {
      this.longPressActivado = true;
      this.toggleDiaBaja(dia);
    }, 800);
  }

  onMouseUp() {
    this.cancelLongPress();
  }

  onMouseLeave() {
    this.cancelLongPress();
  }

  // ✅ Método auxiliar para cancelar el long press
  private cancelLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  onDblClick(dia: DiaCalendario, event: Event) {
    if (this.longPressActivado) {
      this.longPressActivado = false;
      return;
    }
    this.toggleDiaConvenio(dia);
  }

  toggleDiaBaja(dia: DiaCalendario) {
    if (dia.dia === 0 || dia.esFestivo || dia.esFinDeSemana || dia.esVacaciones) return;

    dia.esBaja = !dia.esBaja;

    if (dia.esBaja) {
      if (!dia.horasOriginales) {
        dia.horasOriginales = dia.horasTrabajadas;
      }
      dia.horasTrabajadas = 0;
      dia.descripcion = 'Baja Médica';
      dia.esLaborable = false;
    } else {
      dia.horasTrabajadas = dia.horasOriginales || 0;
      dia.descripcion = undefined;
      dia.esLaborable = true;
    }

    this.calcularTotales();
  }

  toggleDiaConvenio(dia: DiaCalendario, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (dia.dia === 0 || dia.esFestivo || dia.esFinDeSemana || dia.esVacaciones || dia.esBaja)
      return;

    dia.esDiaConvenio = !dia.esDiaConvenio;
    dia.esLaborable = !dia.esDiaConvenio;

    if (dia.esDiaConvenio) {
      dia.horasTrabajadas = 0;
    }

    this.calcularTotales();
  }

  tieneFestivos(mes: MesCalendario): boolean {
    return mes.dias.some((dia) => dia.esFestivo || dia.esDiaConvenio);
  }

  getHorasMes(mes: MesCalendario): number {
    return mes.dias.filter((d) => d.dia > 0).reduce((sum, d) => sum + d.horasTrabajadas, 0);
  }
}