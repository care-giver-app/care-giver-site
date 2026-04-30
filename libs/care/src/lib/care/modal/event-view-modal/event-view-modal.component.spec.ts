import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventViewModalComponent } from './event-view-modal.component';
import { ReceiverService, AuthService, AlertService, UserService, EventService } from '@care-giver-site/services';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Event } from '@care-giver-site/models';

const mockEvent: Event = {
  receiverId: 'r1',
  eventId: 'e1',
  userId: 'u1',
  startTime: new Date().toISOString(),
  endTime: new Date().toISOString(),
  type: 'Medication',
  data: [],
};

const mockReceiverService = {
  currentReceiverId: 'r1',
  deleteEvent: jest.fn().mockResolvedValue({ subscribe: jest.fn() }),
  updateEvent: jest.fn().mockResolvedValue({ subscribe: jest.fn() }),
};
const mockAuthService = { getCurrentUserId: jest.fn().mockResolvedValue('u1') };
const mockAlertService = { show: jest.fn() };
const mockUserService = { getLoggedUser: jest.fn().mockResolvedValue('Jane Doe') };
const mockEventService = {
  getReadableTimestamp: jest.fn().mockReturnValue('Today at 10:00 AM'),
  getEventConfigs: jest.fn().mockReturnValue([]),
};

describe('EventViewModalComponent', () => {
  let component: EventViewModalComponent;
  let fixture: ComponentFixture<EventViewModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventViewModalComponent, NoopAnimationsModule],
      providers: [
        { provide: ReceiverService, useValue: mockReceiverService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AlertService, useValue: mockAlertService },
        { provide: UserService, useValue: mockUserService },
        { provide: EventService, useValue: mockEventService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventViewModalComponent);
    component = fixture.componentInstance;
    component.event = mockEvent;
    component.eventTypes = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start in view state', () => {
    expect(component.state).toBe('view');
  });

  it('should transition to delete-confirm state when startDeleteConfirm() is called', () => {
    component.startDeleteConfirm();
    expect(component.state).toBe('delete-confirm');
  });

  it('should return to view state when cancelAction() is called from delete-confirm', () => {
    component.startDeleteConfirm();
    component.cancelAction();
    expect(component.state).toBe('view');
  });

  it('should transition to edit state when startEdit() is called', () => {
    component.startEdit();
    expect(component.state).toBe('edit');
  });

  it('should return to view state when cancelAction() is called from edit', () => {
    component.startEdit();
    component.cancelAction();
    expect(component.state).toBe('view');
  });

  it('should reset to view state when a new event is passed in', async () => {
    component.startDeleteConfirm();
    component.event = { ...mockEvent, eventId: 'e2' };
    await component.ngOnChanges({
      event: { currentValue: component.event, previousValue: mockEvent, firstChange: false, isFirstChange: () => false }
    });
    expect(component.state).toBe('view');
  });

  it('should emit showChange(false) when close() is called', () => {
    const spy = jest.spyOn(component.showChange, 'emit');
    component.close();
    expect(spy).toHaveBeenCalledWith(false);
  });
});
