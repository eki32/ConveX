import { Component, inject, OnInit, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IaService } from '../../services/ia';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css'],
})
export class InicioComponent implements OnInit {
  private iaService = inject(IaService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  datos: any;

  // --- SECCIÓN CORREGIDA: Eliminadas variables vacías de excesos ---
  // Mantenemos solo la referencia a las jornadas anuales por si las necesitas en el dashboard
  jornadasAnuales: any = {
    2024: 1714,
    2025: 1710,
  };

  get resultados() {
    return this.iaService.resultadosGuardados;
  }
  set resultados(val) {
    this.iaService.resultadosGuardados = val;
  }

  usuarioLogueado: any;
  listaNominas: { file: File | null; preview: string; cargando: boolean }[] = [];
  analizando = false;
  totalAtrasos: number = 0;
  totalNetoEstimado: number = 0;
  indiceAnalizando = 0;
  mostrarResultados = false;
  irpfManual: number = 2;
  anioActual = new Date().getFullYear();

  ngOnInit() {
    this.totalAtrasos = this.iaService.totales.bruto;
    this.totalNetoEstimado = this.iaService.totales.neto;

    if (this.resultados.length > 0) {
      this.mostrarResultados = true;
    }

    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('usuarioLogueado');
      if (saved) {
        const d = JSON.parse(saved);
        this.usuarioLogueado = {
          nombre: d.nombre,
          grupo: d.categoria || 'G4',
          fechaAlta: d.fecha_alta,
          email: d.email,
          // Añadimos la jornada aquí para que ExcesosComponent la lea correctamente
          jornadaContrato: d.jornadaContrato || 40,
        };
      }
    }
  }

  // Eliminado calcularExceso() vacío y variables duplicadas (totalExceso, diasLibres, etc.)
  // ya que ahora viven en ExcesosComponent.

  // --- GESTIÓN DE ARCHIVOS ---
  async onFilesSelected(event: any) {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    const seleccionados = Array.from(files).slice(0, 4 - this.listaNominas.length);
    const startIndex = this.listaNominas.length;

    const nuevos = seleccionados.map(() => ({ file: null, preview: '', cargando: true }));
    this.listaNominas = [...this.listaNominas, ...nuevos];

    for (let i = 0; i < seleccionados.length; i++) {
      const dataUrl = await this.comprimirImagen(seleccionados[i]);
      this.listaNominas[startIndex + i] = {
        file: seleccionados[i],
        preview: dataUrl,
        cargando: false,
      };
      this.cdr.detectChanges();
    }
  }

  actualizarTodoPorGrupo() {
    localStorage.setItem('usuarioLogueado', JSON.stringify(this.usuarioLogueado));
    if (this.resultados.length > 0) {
      this.resultados = this.resultados.map((res) => this.procesarDatosIA(res));
      this.actualizarTotalesGlobales();
    }
  }

  private comprimirImagen(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const MAX_WIDTH = 1000;
          let scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async analizarNominas() {
    if (this.listaNominas.length === 0) return;
    this.analizando = true;
    this.mostrarResultados = true;

    for (let i = 0; i < this.listaNominas.length; i++) {
      this.indiceAnalizando = i + 1;
      this.cdr.detectChanges();
      try {
        const datos = await this.iaService.escanearNomina(this.listaNominas[i].preview);
        if (datos) {
          const nuevoResultado = this.procesarDatosIA(datos);
          this.resultados = [...this.resultados, nuevoResultado];
        }
      } catch (error) {
        console.error('Error', error);
      }
    }
    this.listaNominas = [];
    this.actualizarTotalesGlobales();
    this.analizando = false;
    this.cdr.detectChanges();
  }

  procesarDatosIA(datos: any) {
    const anioUso = datos.anio >= 2022 && datos.anio <= 2025 ? datos.anio : 2022;
    const grupoActual = this.usuarioLogueado?.grupo || 'G4';
    const grupoDoc = this.iaService.tablasSalariales.find((t) => t.grupo === grupoActual);
    let salarioBaseConvenio = 0;

    if (grupoDoc && grupoDoc.subgrupos && grupoDoc.subgrupos.length > 0) {
      const base2022 = (grupoDoc.subgrupos[0] as any).s2022 || 0;
      salarioBaseConvenio = this.iaService.getSalarioDiaAnio(base2022, anioUso);
    }

    const textoIdentificador = `${datos.nombreTipo || ''} ${datos.mes || ''}`.toUpperCase();
    const esOctubre = textoIdentificador.includes('OCTUBRE');
    const esExtraMarzo = textoIdentificador.includes('MARZO');
    const esExtraJulio = textoIdentificador.includes('JULIO');
    const esExtraDiciembre = textoIdentificador.includes('DICIEMBRE');

    let esExtra =
      textoIdentificador.includes('EXTRA') ||
      textoIdentificador.includes('PAGA') ||
      esExtraMarzo ||
      esExtraJulio ||
      esExtraDiciembre ||
      (esOctubre && parseFloat(datos.salarioBase) < 1000);

    let multiplicador = 1;
    let nombreFinal = datos.nombreTipo || `MES ${datos.mes}`;

    if (esExtra) {
      if (esOctubre) {
        multiplicador = 0.5;
        nombreFinal = 'EXTRA Octubre (50%)';
      } else if (esExtraMarzo) {
        nombreFinal = 'EXTRA Marzo (100%)';
      } else if (esExtraJulio) {
        nombreFinal = 'EXTRA Julio (100%)';
      } else if (esExtraDiciembre) {
        nombreFinal = 'EXTRA Diciembre (100%)';
      } else {
        nombreFinal = `PAGA EXTRA`;
      }
    }

    const salarioEsperadoBruto = salarioBaseConvenio * multiplicador;
    let porcentajeAnt = 0;
    if (this.usuarioLogueado?.fechaAlta) {
      porcentajeAnt = this.calcularCuatrienio(this.usuarioLogueado.fechaAlta, anioUso);
    }
    const antEsperadaBruta = ((salarioBaseConvenio * porcentajeAnt) / 100) * multiplicador;

    const pagadoBase = parseFloat(datos.salarioBase) || 0;
    const pagadoAnt = parseFloat(datos.antiguedadPagada || datos.antiguedad || 0);

    const totalBrutoBizkaia = salarioEsperadoBruto + antEsperadaBruta;
    const diferenciaBruta = totalBrutoBizkaia - (pagadoBase + pagadoAnt);
    const tasaDescuento = this.irpfManual / 100 + 0.0645;
    const diferenciaNeta = diferenciaBruta * (1 - tasaDescuento);

    return {
      ...datos,
      anio: anioUso,
      nombreTipo: nombreFinal,
      esExtra: esExtra,
      salarioBase: pagadoBase,
      salarioEsperado: salarioEsperadoBruto,
      antiguedadCalculada: antEsperadaBruta,
      antiguedadPagada: pagadoAnt,
      totalBrutoBizkaia: totalBrutoBizkaia,
      diferenciaBruta: diferenciaBruta,
      diferenciaNeta: diferenciaNeta,
      esOctubre50: esOctubre && multiplicador === 0.5,
    };
  }

  recalcularFila(index: number) {
    this.resultados[index] = this.procesarDatosIA(this.resultados[index]);
    this.actualizarTotalesGlobales();
  }

  subirParaMas() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  actualizarTodoPorIrpf() {
    this.resultados = this.resultados.map((res) => this.procesarDatosIA(res));
    this.actualizarTotalesGlobales();
  }

  actualizarTotalesGlobales() {
    this.totalAtrasos = this.resultados.reduce((acc, r) => acc + r.diferenciaBruta, 0);
    this.totalNetoEstimado = this.resultados.reduce((acc, r) => acc + r.diferenciaNeta, 0);
    this.iaService.totales.bruto = this.totalAtrasos;
    this.iaService.totales.neto = this.totalNetoEstimado;
  }

  getNetoConvenio(res: any): number {
    const tasaDescuento = this.irpfManual / 100 + 0.0645;
    return (res.salarioEsperado + res.antiguedadCalculada) * (1 - tasaDescuento);
  }

  get anhosFormateados(): string {
    if (!this.resultados.length) return '2022';
    const anhos = [...new Set(this.resultados.map((r) => r.anio))].sort();
    return anhos.length === 1 ? anhos[0].toString() : `${anhos[0]} - ${anhos[anhos.length - 1]}`;
  }

  private calcularCuatrienio(fechaAlta: string, anio: number): number {
    const f = new Date(fechaAlta);
    if (isNaN(f.getTime())) return 0;
    const diferenciaAnios = anio - f.getFullYear();
    const tramos = Math.floor(diferenciaAnios / 4);
    return Math.max(0, tramos * 5);
  }

  eliminarNomina(index: number) {
    this.resultados.splice(index, 1);
    this.actualizarTotalesGlobales();
  }

  limpiarTodo() {
    this.listaNominas = [];
    this.resultados = [];
    this.iaService.limpiarMemoria();
    this.mostrarResultados = false;
    this.totalAtrasos = 0;
    this.totalNetoEstimado = 0;
    this.indiceAnalizando = 0;
  }
}
