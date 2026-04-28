import { TestBed } from '@angular/core/testing';

import { PasswordGenerator } from './password-generator';

describe('PasswordGenerator', () => {
  let service: PasswordGenerator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PasswordGenerator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
