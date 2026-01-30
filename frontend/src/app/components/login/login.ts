import { Component, inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router, RouterLink } from '@angular/router'; // Añadimos RouterLink
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser, CommonModule } from '@angular/common'; // Importante para el navegador

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule], // Importamos RouterLink para que funcione el enlace a registro
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  
  credentials = { email: '', password: '' };

  async onSubmit() {
    // Verificamos que estamos en el navegador para evitar errores de localStorage/SSR
    if (isPlatformBrowser(this.platformId)) {
      try {
        const res = await this.authService.login(this.credentials);

        if (res.success) {
          // Guardamos al usuario (importante para cálculos de 2022-2025)
          this.authService.establecerUsuario(res.user);
          
          console.log('🚀 Login exitoso, navegando...');
          this.router.navigate(['/inicio']);
        } else {
          alert('Usuario o contraseña incorrectos');
        }
      } catch (err) {
        console.error('Error de conexión con el servidor', err);
        alert('No se pudo conectar con el servidor.');
      }
    }
  }
}