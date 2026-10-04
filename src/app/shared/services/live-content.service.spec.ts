import { TestBed } from '@angular/core/testing';

import { LiveContentService } from './live-content.service';

describe('LiveContentService', () => {
  let service: LiveContentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiveContentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
