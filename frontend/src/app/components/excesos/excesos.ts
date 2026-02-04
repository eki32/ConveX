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
    fechaAlta: null,
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

  // Horas descontadas
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
  readonly FECHA_LIMITE_JORNADA = new Date('2007-01-01');
  readonly REDUCCION_HORAS_ANTIGUOS = 40;
  
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
        
        console.log('👤 Usuario cargado desde localStorage:', this.usuarioLogueado);
        console.log('📅 Fecha de alta en localStorage:', this.usuarioLogueado.fechaAlta);
        
        if (this.usuarioLogueado.email) {
          console.log('🔄 Consultando fecha de alta desde la BD...');
          this.iaService.obtenerFechaAltaUsuario(this.usuarioLogueado.email).subscribe({
            next: (response) => {
              console.log('✅ Respuesta completa del servidor:', response);
              
              if (response && response.fechaAlta) {
                const fechaString = response.fechaAlta.split('T')[0];
                this.usuarioLogueado.fechaAlta = fechaString;
                
                console.log('💾 Fecha normalizada:', fechaString);
                
                localStorage.setItem('usuarioLogueado', JSON.stringify(this.usuarioLogueado));
                
                const fechaAlta = new Date(fechaString);
                const aplicaReduccion = fechaAlta < this.FECHA_LIMITE_JORNADA;
                
                console.log('📊 Información de jornada:');
                console.log('  - Fecha de alta:', fechaString);
                console.log('  - Fecha límite:', this.FECHA_LIMITE_JORNADA.toISOString().split('T')[0]);
                console.log('  - ¿Aplica reducción?:', aplicaReduccion);
                
                this.ejecutarCalculo();
                this.cdr.detectChanges();
              } else {
                console.warn('⚠️ No se recibió fechaAlta del servidor');
              }
            },
            error: (err) => {
              console.error('❌ Error al obtener fecha de alta:', err);
              this.ejecutarCalculo();
            }
          });
        }
      }
    }
  }

  async guardarJornada() {
    if (!this.usuarioLogueado.email) return;

    this.cargando = true;
    this.iaService
      .actualizarJornada(this.usuarioLogueado.email, this.usuarioLogueado.jornadaContrato)
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
        },
      });
  }

  calcularDiasTotalesAnio() {
    const esBisiesto =
      (this.anioCalculo % 4 === 0 && this.anioCalculo % 100 !== 0) || this.anioCalculo % 400 === 0;
    this.diasTotalesAnio = esBisiesto ? 366 : 365;
  }

  recibirDatosCalendario(datos: any) {
    this.totalHorasRealizadas = datos.totalHorasTrabajadas;
    this.horasDescontadasVacaciones = datos.horasDescontadasVacaciones || 0;
    this.horasDescontadasBajas = datos.horasDescontadasBajas || 0;
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
      .filter((p) => p.inicio && p.fin)
      .map((p) => ({ start: new Date(p.inicio), end: new Date(p.fin) }));

    this.festivosDelCalendario.forEach((f) => {
      const fecha = new Date(f);
      if (fecha.getDay() !== 0) {
        if (periodos.some((p) => fecha >= p.start && fecha <= p.end)) {
          this.festivosEnVacaciones++;
        }
      }
    });
    this.diasCompensacionVacaciones = this.festivosEnVacaciones;
  }

  get jornadaConvenioDinamica(): number {
    const base = this.jornadasMaximas[this.anioCalculo] || 1780;
    let jornadaProporcional = (base * this.usuarioLogueado.jornadaContrato) / 40;
    
    if (this.usuarioLogueado.fechaAlta) {
      const fechaAlta = new Date(this.usuarioLogueado.fechaAlta);
      const fechaLimite = new Date(this.FECHA_LIMITE_JORNADA);
      
      if (fechaAlta < fechaLimite) {
        jornadaProporcional -= this.REDUCCION_HORAS_ANTIGUOS;
      }
    }
    
    return jornadaProporcional;
  }

  ejecutarCalculo() {
    const jornadaBase = this.jornadasMaximas[this.anioCalculo] || 1780;
    const horasSemana = this.usuarioLogueado.jornadaContrato || 40;
    const horasDia = horasSemana / this.DIAS_SEMANA_LABORAL;

    this.jornadaMaximaProporcional = this.jornadaConvenioDinamica;

    this.excesoHoras = Math.max(0, this.totalHorasRealizadas - this.jornadaMaximaProporcional);

    this.diasCompensacion =
      this.excesoHoras > 0 ? Math.round((this.excesoHoras / horasDia) * 10) / 10 : 0;

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
      const marginX = 20;
      let currentY = 20;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SOLICITUD DE REGULARIZACIÓN DE JORNADA', 105, currentY, { align: 'center' });

      currentY += 20;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      const linea1 = `D./Dña. __________________________________________ con DNI ____________________`;
      const linea2 = `trabajador/a de la entidad, presenta el siguiente informe detallado de exceso de jornada`;
      const linea3 = `correspondiente al ejercicio anual 2025.`;

      doc.text(linea1, marginX, currentY);
      currentY += 7;
      doc.text(linea2, marginX, currentY);
      currentY += 7;
      doc.text(linea3, marginX, currentY);

      currentY += 15;

      doc.setDrawColor(200);
      doc.rect(marginX - 2, currentY - 5, 170, 30);

      doc.setFont('helvetica', 'bold');
      doc.text(`RESULTADOS DEL CÁLCULO (AÑO 2025):`, marginX, currentY);

      currentY += 10;
      doc.setFontSize(12);
      doc.text(`• Días de exceso calculados: ${this.diasCompensacion} días`, marginX + 5, currentY);

      currentY += 8;
      doc.text(`• Valor monetario estimado: ${this.importeMonetario}€`, marginX + 5, currentY);

      currentY += 20;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'De acuerdo con el convenio vigente, solicito recibir dicha compensación mediante:',
        marginX,
        currentY,
      );

      currentY += 10;
      doc.text('Días de compensación [   ]', marginX + 10, currentY);
      doc.text('Valor monetario [   ]', marginX + 80, currentY);

      currentY += 30;

      const fechaActual = `En ____________________, a ____ de ____________ de 2026`;
      doc.text(fechaActual, marginX, currentY);

      currentY += 25;

      doc.text('Firma del trabajador/a:', marginX, currentY);
      doc.line(marginX, currentY + 2, marginX + 60, currentY + 2);

      doc.save(`Informe_Exceso_2025_${this.usuarioLogueado.nombre}.pdf`);
    }
  }
}