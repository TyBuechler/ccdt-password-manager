import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordManager } from './password-manager';

describe('PasswordManager', () => {
  let component: PasswordManager;
  let fixture: ComponentFixture<PasswordManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordManager],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordManager);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
