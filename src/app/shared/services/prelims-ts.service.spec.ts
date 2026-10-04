import { TestBed } from '@angular/core/testing';

import { PrelimsTsService } from './prelims-ts.service';

describe('PrelimsTsService', () => {
  let service: PrelimsTsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrelimsTsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
