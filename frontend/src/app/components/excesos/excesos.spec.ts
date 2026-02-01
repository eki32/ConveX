import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Excesos } from './excesos';

describe('Excesos', () => {
  let component: Excesos;
  let fixture: ComponentFixture<Excesos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Excesos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Excesos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
