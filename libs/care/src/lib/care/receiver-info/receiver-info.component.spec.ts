import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReceiverInfoComponent } from './receiver-info.component';
import { Receiver } from '@care-giver-site/models';

describe('ReceiverInfoComponent', () => {
  let fixture: ComponentFixture<ReceiverInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiverInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiverInfoComponent);
  });

  it('displays the receiver full name', () => {
    const receiver: Receiver = { receiverId: 'Receiver#1', firstName: 'John', lastName: 'Smith' };
    fixture.componentInstance.receiver = receiver;
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('John Smith');
  });
});
