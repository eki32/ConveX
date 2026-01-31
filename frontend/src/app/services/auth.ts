import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs'; // ✅ IMPORTACIÓN CORRECTA

@Injectable({ providedIn: 'root' })



export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private url='https://convex-production.up.railway.app'
  //private url = 'http://localhost:3000';

  // Signal para gestionar el usuario en tiempo real
  public currentUser = signal<any>(null);

  // Se ejecuta al iniciar el servicio para recuperar la sesión si existe
  constructor() {
    this.recuperarSesion();
  }

  // Guarda al usuario y asegura la persistencia para cálculos futuros
  establecerUsuario(usuario: any) {
  if (isPlatformBrowser(this.platformId)) {
    localStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
    this.currentUser.set(usuario); // ✅ Esto activa el Navbar inmediatamente
  }
}

  // Recupera los datos (como fecha_alta) al recargar la página
  private recuperarSesion() {
  if (isPlatformBrowser(this.platformId)) {
    const savedUser = localStorage.getItem('usuarioLogueado'); // ✅ Llave corregida
    if (savedUser) {
      this.currentUser.set(JSON.parse(savedUser));
    }
  }
}

  // Registro: Mantenemos el Observable para que el componente maneje el éxito/error
  registrar(datos: any) {
    return this.http.post(`${this.url}/registro`, datos);
  }

  // Login: Convertido a Promesa para usar async/await en login.ts
  async login(credentials: any): Promise<any> {
    try {
        // La URL final debe ser http://localhost:3000/login
        return await firstValueFrom(this.http.post(`${this.url}/login`, credentials));
    } catch (error) {
        console.error('Error en la petición de login:', error);
        throw error;
    }
}

  // Método para cerrar sesión y limpiar el Navbar
  logout() {
  this.currentUser.set(null); // ✅ Esto oculta el Navbar inmediatamente
  if (isPlatformBrowser(this.platformId)) {
    localStorage.removeItem('usuarioLogueado'); // ✅ Llave corregida
    // Opcional: Redirigir al login
  }
}
}

export { isPlatformBrowser };
