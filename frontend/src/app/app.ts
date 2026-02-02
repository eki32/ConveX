import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from './components/navbar/navbar';
import { IaService } from './services/ia';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private iaService = inject(IaService);

  [x: string]: any;
  protected readonly title = signal('Convex');
  constructor(public router: Router) {}

  logout() {
    // 1. Borramos el usuario del localStorage (para que no entre auto)
    localStorage.removeItem('usuarioLogueado');

    // 2. Vaciamos la tabla del informe del servicio
    this.iaService.limpiarMemoria();

    // 3. Redirigimos al login o inicio
    this.router.navigate(['/login']);
  }
}
