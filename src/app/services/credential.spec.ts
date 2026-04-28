import { TestBed } from '@angular/core/testing';

import { Credential } from './credential';

describe('Credential', () => {
  let service: Credential;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Credential);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
