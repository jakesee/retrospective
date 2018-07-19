import { TestBed, inject } from '@angular/core/testing';

import { Websocket } from './websocket.service';

describe('Websocket', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Websocket]
    });
  });

  it('should be created', inject([Websocket], (service: Websocket) => {
    expect(service).toBeTruthy();
  }));
});
