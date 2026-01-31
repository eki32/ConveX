import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';
import { IaService } from '../../services/ia'; // Importamos el servicio de IA
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {
  public authService = inject(AuthService);
  private iaService = inject(IaService); // Inyectamos para limpiar el informe
  private router = inject(Router);
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
  this.isMenuOpen = false;
}
  
  logout() {
    // 1. Borrar la clave exacta que usaste en el login/inicio
    localStorage.removeItem('usuarioLogueado'); 
    localStorage.removeItem('usuario'); // Por seguridad borramos ambas si tienes dudas

    // 2. Limpiar los datos del informe (tablas de 2022-2025)
    this.iaService.limpiarMemoria(); 

    // 3. Resetear el estado del usuario en el Signal
    this.authService.currentUser.set(null);

    // 4. Redirigir al login
    this.router.navigate(['/login']);
  }

  
}

