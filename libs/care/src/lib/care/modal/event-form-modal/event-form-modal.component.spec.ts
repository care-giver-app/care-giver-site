import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventFormModalComponent } from './event-form-modal.component';
import { ReceiverService } from '@care-giver-site/services';
import { AuthService } from '@care-giver-site/services';
import { AlertService } from '@care-giver-site/services';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

const mockReceiverService = { currentReceiverId: 'r1', addEvent: jest.fn() };
const mockAuthService = { getCurrentUserId: jest.fn().mockResolvedValue('u1') };
const mockAlertService = { show: jest.fn() };

describe('EventFormModalComponent', () => {
  let component: EventFormModalComponent;
  let fixture: ComponentFixture<EventFormModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventFormModalComponent, NoopAnimationsModule],
      providers: [
        { provide: ReceiverService, useValue: mockReceiverService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AlertService, useValue: mockAlertService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventFormModalComponent);
    component = fixture.componentInstance;
    component.eventTypes = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with no selected event types when initialTypes is not set', () => {
    expect(component.selectedEventTypes).toEqual([]);
  });

  it('should pre-select initialTypes when show becomes true', () => {
    component.initialTypes = ['Medication'];
    component.show = true;
    component.ngOnChanges({
      show: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false }
    });
    expect(component.selectedEventTypes).toEqual(['Medication']);
  });

  it('should emit showChange(false) and submitted when submitEvent is called', async () => {
    const showChangeSpy = jest.spyOn(component.showChange, 'emit');
    const submittedSpy = jest.spyOn(component.submitted, 'emit');
    component.selectedEventTypes = [];
    await component.submitEvent();
    expect(showChangeSpy).toHaveBeenCalledWith(false);
    expect(submittedSpy).toHaveBeenCalled();
  });

  it('should emit showChange(false) when close() is called', () => {
    const spy = jest.spyOn(component.showChange, 'emit');
    component.close();
    expect(spy).toHaveBeenCalledWith(false);
  });
});
