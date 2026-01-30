import { TestBed } from '@angular/core/testing';

import { Calculadora } from './calculadora';

describe('Calculadora', () => {
  let service: Calculadora;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Calculadora);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
