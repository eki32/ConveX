import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IaService } from '../../services/ia';
import { CalendarioComponent } from '../calendario/calendario';

@Component({
  selector: 'app-excesos',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarioComponent],
  templateUrl: './excesos.html',
})
export class ExcesosComponent implements OnInit {
  private iaService = inject(IaService);
  private cdr = inject(ChangeDetectorRef);

  anioActual = new Date().getFullYear();
  anioCalculo = this.anioActual - 1;

  jornadasMaximas: any = {
    2025: 1780,
    2026: 1776,
    2027: 1772,
    2028: 1768,
  };

  salariosBase: any = {
    2025: 16576.0,
    2026: 17040.13,
    2027: 17380.93,
    2028: 17728.55,
  };

  usuarioLogueado: any = {
    nombre: '',
    email: '',
    jornadaContrato: 40,
  };

  periodoInvierno = { inicio: '', fin: '' };
  periodoVerano = { inicio: '', fin: '' };
  diasVacaciones: number = 0;
  diasBaja: number = 0;
  festivosEnVacaciones: number = 0;
  diasCompensacionVacaciones: number = 0;

  // Datos calendario
  diasTotalesAnio: number = 0;
  diasLaborables: number = 0;
  festivosOficiales: number = 0;
  festivosConvenio: number = 0;
  festivosDelCalendario: Date[] = [];
  totalDiasLS: number = 0;

  // ✅ NUEVO: Horas descontadas
  horasDescontadasVacaciones: number = 0;
  horasDescontadasBajas: number = 0;

  // Resultados
  jornadaMaximaProporcional: number = 0;
  diasLaborablesEfectivos: number = 0;
  diasTrabajados: number = 0;
  totalHorasRealizadas: number = 0;
  excesoHoras: number = 0;
  diasCompensacion: number = 0;
  importeMonetario: number = 0;
  valorHoraExtra: number = 0;

  readonly RECARGO_HORA_EXTRA = 0.5;
  readonly DIAS_SEMANA_LABORAL = 6;
  cargando: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    this.calcularDiasTotalesAnio();
    this.cargarDatosUsuario();
  }

  cargarDatosUsuario() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('usuarioLogueado');
      if (saved) {
        this.usuarioLogueado = JSON.parse(saved);
        if (!this.usuarioLogueado.jornadaContrato) this.usuarioLogueado.jornadaContrato = 40;
      }
    }
  }

  async guardarJornada() {
    if (!this.usuarioLogueado.email) return;
    
    this.cargando = true;
    this.iaService.actualizarJornada(this.usuarioLogueado.email, this.usuarioLogueado.jornadaContrato)
      .subscribe({
        next: () => {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('usuarioLogueado', JSON.stringify(this.usuarioLogueado));
          }
          this.cargando = false;
          this.ejecutarCalculo();
        },
        error: (err) => {
          console.error(err);
          this.cargando = false;
        }
      });
  }

  calcularDiasTotalesAnio() {
    const esBisiesto = (this.anioCalculo % 4 === 0 && this.anioCalculo % 100 !== 0) || this.anioCalculo % 400 === 0;
    this.diasTotalesAnio = esBisiesto ? 366 : 365;
  }

  recibirDatosCalendario(datos: any) {
    this.totalHorasRealizadas = datos.totalHorasTrabajadas;
    this.horasDescontadasVacaciones = datos.horasDescontadasVacaciones || 0; // ✅ NUEVO
    this.horasDescontadasBajas = datos.horasDescontadasBajas || 0; // ✅ NUEVO
    this.festivosOficiales = datos.festivosOficiales;
    this.festivosConvenio = datos.festivosConvenio;
    this.festivosDelCalendario = datos.fechasFestivos || [];
    this.ejecutarCalculo();
  }

  calcularDiasTotales() {
    const calc = (p: any) => {
      if (!p.inicio || !p.fin) return 0;
      const d = (new Date(p.fin).getTime() - new Date(p.inicio).getTime()) / (1000 * 3600 * 24);
      return d >= 0 ? d + 1 : 0;
    };
    this.diasVacaciones = calc(this.periodoInvierno) + calc(this.periodoVerano);
    this.calcularFestivosEnVacaciones();
    this.ejecutarCalculo();
  }

  calcularFestivosEnVacaciones() {
    this.festivosEnVacaciones = 0;
    const periodos = [this.periodoInvierno, this.periodoVerano]
      .filter(p => p.inicio && p.fin)
      .map(p => ({ start: new Date(p.inicio), end: new Date(p.fin) }));

    this.festivosDelCalendario.forEach(f => {
      const fecha = new Date(f);
      if (fecha.getDay() !== 0) {
        if (periodos.some(p => fecha >= p.start && fecha <= p.end)) {
          this.festivosEnVacaciones++;
        }
      }
    });
    this.diasCompensacionVacaciones = this.festivosEnVacaciones;
  }

  get jornadaConvenioDinamica(): number {
    const base = this.jornadasMaximas[this.anioCalculo] || 1780;
    return (base * this.usuarioLogueado.jornadaContrato) / 40;
  }

  ejecutarCalculo() {
    const jornadaBase = this.jornadasMaximas[this.anioCalculo] || 1780;
    const horasSemana = this.usuarioLogueado.jornadaContrato || 40;
    const horasDia = horasSemana / this.DIAS_SEMANA_LABORAL;

    this.jornadaMaximaProporcional = (jornadaBase * horasSemana) / 40;
    
    this.excesoHoras = Math.max(0, this.totalHorasRealizadas - this.jornadaMaximaProporcional);
    
    this.diasCompensacion = this.excesoHoras > 0 ? Math.round((this.excesoHoras / horasDia) * 10) / 10 : 0;
    
    this.calcularImporteMonetario();
    this.cdr.detectChanges();
  }

  calcularImporteMonetario() {
    const salario = this.salariosBase[this.anioCalculo] || 16576.0;
    const jornadaMax = this.jornadasMaximas[this.anioCalculo] || 1780;
    const valorHora = salario / jornadaMax;
    this.valorHoraExtra = valorHora * (1 + this.RECARGO_HORA_EXTRA);
    this.importeMonetario = Number((this.excesoHoras * this.valorHoraExtra).toFixed(2));
  }

  async exportarInformePDF() {
    if (isPlatformBrowser(this.platformId)) {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF() as any;
      doc.text("Informe de Excesos", 14, 20);
      doc.save(`Informe_${this.usuarioLogueado.nombre}.pdf`);
    }
  }
}