import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login'; // Ajusta la ruta
import { InicioComponent } from './components/inicio/inicio';
import { Convenios } from './components/convenios/convenios';
import { Registro } from './components/registro/registro';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: Registro },
  { path: 'convenios', component: Convenios },
  { path: 'inicio', component: InicioComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' } ,
  { path: '**', redirectTo: 'login'} // Redirección por defecto
];