import { TestBed } from '@angular/core/testing';

import { FreeResourceService } from './free-resource.service';

describe('FreeResourceService', () => {
  let service: FreeResourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FreeResourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
