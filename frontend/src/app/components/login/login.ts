import { Component, inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser, CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  credentials = { email: '', password: '' };

  mostrarModalCodigo = false;
  codigoIntroducido = '';
  errorCodigo = false;
  private CODIGO_SECRETO = '1111';

  cerrarModal(event?: MouseEvent) {
    if (!event || event.target === event.currentTarget) {
      this.mostrarModalCodigo = false;
      this.errorCodigo = false;
      this.codigoIntroducido = '';
    }
  }

  async validarCodigo() {
    try {
      console.log('Validando código...'); // ← debug
      console.log('🔑 Código introducido:', this.codigoIntroducido);
      console.log('🚀 Llamando a validarCodigoRegistro...');
      const res = await this.authService.validarCodigoRegistro(this.codigoIntroducido);

      console.log('📥 Respuesta recibida:', res);

      if (res.valido) {
        this.mostrarModalCodigo = false;
        this.errorCodigo = false;
        this.codigoIntroducido = '';
        this.router.navigate(['/registro']);
      } else {
        this.errorCodigo = true;
      }
    } catch (err: any) {
      console.error('Error completo:', err); // ← ver el error completo
      this.errorCodigo = true;

      // Mostrar mensaje más específico
      if (err.status === 404) {
        alert(
          'Error: El servidor no encontró el endpoint. Verifica que el backend esté corriendo.',
        );
      }
    }
  }

  async onSubmit() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const res = await this.authService.login(this.credentials);

        if (res.success) {
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
