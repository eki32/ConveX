import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms'; // 👈 Esto arregla el error del HTML
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, CommonModule, FormsModule, RouterLink], // 👈 Obligatorio incluirlo aquí
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  router = inject(Router);
  private authService = inject(AuthService);

  // Objeto que coincide con los ngModel del HTML
  usuario = {
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    fechaAlta: '',
    categoria: 'G4',
  };

  enviarRegistro() {
    this.authService.registrar(this.usuario).subscribe({
      next: (res) => {
        alert('¡Registro con éxito!');

        // Limpiamos el objeto para vaciar los inputs del HTML
        this.usuario = {
          nombre: '',
          apellidos: '',
          email: '',
          password: '',
          fechaAlta: '',
          categoria: '',
        };

        // Navegamos al login
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error al registrar:', err);
        // Si el correo está duplicado, avisamos al usuario
        if (err.error?.includes('Duplicate entry')) {
          alert('Este correo ya está registrado.');
        } else {
          alert('Error al conectar con el servidor.');
        }
      },
    });
  }
}
