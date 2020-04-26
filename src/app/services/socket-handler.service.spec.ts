import { TestBed } from '@angular/core/testing';

import { SocketHandlerService } from './socket-handler.service';

describe('SocketHandlerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SocketHandlerService = TestBed.get(SocketHandlerService);
    expect(service).toBeTruthy();
  });
});
