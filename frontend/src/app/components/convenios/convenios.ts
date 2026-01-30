import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth';
import { IaService } from '../../services/ia';


@Component({
  selector: 'app-convenios',
  standalone: true,
  imports: [CommonModule, ],
  templateUrl: './convenios.html',
  styleUrls: ['./convenios.css']
})
export class Convenios {

  iaService = inject(IaService);
  public authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID); // Para evitar el error de localStorage


  get tablasDia() { return this.iaService.tablaDiaModeloA; }
  get tablasSalariales() {
    return this.iaService.tablasSalariales;
  }
  

  constructor() {
    // Verificamos si estamos en el navegador antes de usar localStorage
    if (isPlatformBrowser(this.platformId)) {
      const user = localStorage.getItem('user');
      // Lógica adicional...
    }
  }
}