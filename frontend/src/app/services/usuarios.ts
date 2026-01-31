import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  
  private usuarioActual: any = null;

  private apiUrl = 'https://convex-production.up.railway.app'; // Ajusta a tu URL de backend

  constructor(private http: HttpClient) { }

  async login(credentials: any): Promise<any> {
    const res: any = await firstValueFrom(this.http.post(`${this.apiUrl}/login`, credentials));
    if (res.success) {
      this.setUsuario(res.user); // Guardamos los datos al loguear
    }
    return res;
  }

  setUsuario(user: any) {
    this.usuarioActual = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('usuarioLogueado', JSON.stringify(user));
    }
  }

  getUsuarioActual() {
    if (!this.usuarioActual && typeof window !== 'undefined') {
      const saved = localStorage.getItem('usuarioLogueado');
      if (saved) this.usuarioActual = JSON.parse(saved);
    }
    return this.usuarioActual;
  }}