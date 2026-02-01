import { Injectable } from '@angular/core';
import localeEs from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';


registerLocaleData(localeEs);


@Injectable({ providedIn: 'root' })
export class IaService {

  

// --- TABLA BIZKAIA (Mínimos legales del convenio provincial) ---
public tablasSalariales = [
 { 
    grupo: 'G1', 
    subgrupos: [
      { oficio: 'Titulados/as de Grado Superior', s2022: 2370.84, desc: 'Directores, Licenciados' },
      { oficio: 'Titulados/as de Grado Medio', s2022: 2010.04, desc: 'Ingenieros Técnicos, Peritos' }
    ]
  },
  { 
    grupo: 'G2', 
    subgrupos: [
      { oficio: 'Jefaturas de sección / administrativo', s2022: 1778.38, desc: 'Responsables de área' }
    ]
  },
  { 
    grupo: 'G3', 
    subgrupos: [
      { oficio: 'Oficial Administrativo / Cajero/a principal', s2022: 1487.75, desc: 'Personal cualificado' }
    ]
  },
  { 
    grupo: 'G4', 
    subgrupos: [
      { oficio: 'Dependiente/a / Ayudante / Reposición', s2022: 1350.50, desc: 'Mínimo garantizado Bizkaia' },
      { oficio: 'Personal de Limpieza / Servicios', s2022: 1350.50, desc: 'Mínimo sectorial' }
    ]
  }
];

 // --- TABLA DIA (Modelo A - Centros de Bizkaia) ---
public tablaDiaModeloA = [
  {
    grupo: 'G1',
    subgrupos: [
      { oficio: 'Jefe/a Zona / Gerente Almacén', s2022: 1692.12 },
      { oficio: 'Jefe/a de Área', s2022: 1622.24 }
    ]
  },
  {
    grupo: 'G2',
    subgrupos: [
      { oficio: 'Responsable Tienda / Online', s2022: 1487.75 },
      { oficio: 'Jefe/a de Inventarios', s2022: 1441.22 }
    ]
  },
  {
    grupo: 'G3',
    subgrupos: [
      { oficio: 'Dependiente Especialista', s2022: 1350.64 },
      { oficio: 'Oficial Administrativo', s2022: 1285.67 }
    ]
  },
  {
    grupo: 'G4',
    subgrupos: [
      { oficio: 'Dependiente/a / Personal Caja', s2022: 1174.75 },
      { oficio: 'Auxiliar Caja / Reposición', s2022: 1117.93 },
      { oficio: 'Vigilante Nocturno / Cocinero', s2022: 1174.75 },
      { oficio: 'Personal Limpieza / Ayudante', s2022: 1117.93 }
    ]
  }
];

// Función para calcular los años de DIA (Subidas del 3% anual aprox)
getSalarioDiaAnio(base2022: number, anio: number): number {
  const factores: any = {
    2021: 1 / 1.025, // Estimación hacia atrás
    2022: 1,
    2023: 1.03,
    2024: 1.0609, // 3% sobre 2023
    2025: 1.0927  // 3% sobre 2024
  };
  return Number((base2022 * (factores[anio] || 1)).toFixed(2));
}


  // API Key correcta
  public resultadosGuardados: any[] = [];
  
  
  public totales = { bruto: 0, neto: 0 };
  
  private backendUrl = 'convex-production.up.railway.app/api/escanear-nomina';

  // ✅ Modelo que SÍ tienes disponible
  private apiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  async escanearNomina(base64Image: string) {
    try {
      const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image
      //const base64Data = base64Image.includes(',')
        ? base64Image.split(',')[1]
        : base64Image;

      const payload = {
        contents: [
          {
            parts: [
              {
                text: `Eres un experto en nóminas de DIA España.
Analiza la imagen para un trabajador del Grupo que recogas en la lectura de nominas.
Extrae: año, mes, salario base (código 0BG) y antigüedad (código WA3).

REGLA CRÍTICA:
Si el salario base es menor a 900, avisa.

Devuelve SOLO JSON puro con este formato exacto:
{"anio":2022,"mes":"string","salarioBase":number,"antiguedadPagada":number,"tipo":"MENSUAL"}`
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }
        ]
      };

      

      const response = await fetch(
        `${this.apiUrl}?key=${this.backendUrl}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error de la API de Google:', errorData);
        return null;
      }

      const data = await response.json();

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) return null;

      const limpio = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(limpio);

    } catch (error) {
      console.error('Error en el proceso:', error);
      return null;
    }
  }
  limpiarMemoria() {
    this.resultadosGuardados = [];
    this.totales = { bruto: 0, neto: 0 };
  }
}


