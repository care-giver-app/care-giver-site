// libs/services/src/lib/receiver/receiver.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReceiverService } from './receiver.service';

describe('ReceiverService reactive subjects', () => {
  let service: ReceiverService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReceiverService],
    });
    service = TestBed.inject(ReceiverService);
  });

  it('emits receiverChanged$ when setCurrentReceiver is called', (done) => {
    service.receiverChanged$.subscribe(() => done());
    service.setCurrentReceiver('receiver-1');
  });

  it('emits eventAdded$ when notifyEventAdded is called', (done) => {
    service.eventAdded$.subscribe(() => done());
    service.notifyEventAdded();
  });
});
