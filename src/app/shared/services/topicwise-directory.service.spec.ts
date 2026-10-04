import { TestBed } from '@angular/core/testing';

import { TopicwiseDirectoryService } from './topicwise-directory.service';

describe('TopicwiseDirectoryService', () => {
  let service: TopicwiseDirectoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TopicwiseDirectoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
