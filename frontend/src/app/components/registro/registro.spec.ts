import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroComponent } from './registro';

import { FormsModule } from '@angular/forms'; // Para el ngModel

describe('Registro', () => {
  let component: RegistroComponent;
  let fixture: ComponentFixture<RegistroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Si tu componente es Standalone, va en imports. 
      // Si no lo es, debe ir en declarations.
      imports: [
        RegistroComponent, 
        FormsModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Importante para inicializar el componente
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});