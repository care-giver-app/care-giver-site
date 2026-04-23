import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DailyTimelineComponent } from './daily-timeline.component';
import { ReceiverService, EventService, AuthService } from '@care-giver-site/services';
import { Event, EventMetadata } from '@care-giver-site/models';

const mockReceiverService = {
  currentReceiverId: 'Receiver#123',
  getReceiverEvents: jest.fn().mockResolvedValue(of([])),
};

const mockEventService = {
  eventConfigs$: of([]),
};

const mockAuthService = {
  getCurrentUserId: jest.fn().mockResolvedValue('User#123'),
};

const baseEvent: Event = {
  receiverId: 'Receiver#123',
  eventId: 'Event#1',
  userId: 'User#123',
  startTime: '2026-04-23T14:15:00Z',
  endTime: '2026-04-23T14:45:00Z',
  type: 'Urination',
  data: [],
};

describe('DailyTimelineComponent', () => {
  let component: DailyTimelineComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyTimelineComponent],
      providers: [
        { provide: ReceiverService, useValue: mockReceiverService },
        { provide: EventService, useValue: mockEventService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DailyTimelineComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('dataSummary', () => {
    it('formats value+unit for events with metadata.data', () => {
      const event: Event = { ...baseEvent, type: 'Walk', data: [{ name: 'Duration', value: '22' }] };
      const meta = { type: 'Walk', data: { name: 'Duration', unit: 'Mins' } } as EventMetadata;
      expect(component.dataSummary(event, meta)).toBe('22 mins');
    });

    it('joins field values with · for events with metadata.fields', () => {
      const event: Event = {
        ...baseEvent,
        type: 'Doctor Appointment',
        data: [{ name: 'Doctor', value: 'Dr. Chen' }, { name: 'Location', value: 'City Clinic' }],
      };
      const meta = {
        type: 'Doctor Appointment',
        fields: [{ name: 'Doctor', label: 'Doctor', inputType: 'text' as const, required: false, placeholder: '' }],
      } as EventMetadata;
      expect(component.dataSummary(event, meta)).toBe('Dr. Chen · City Clinic');
    });

    it('returns empty string when event has no data', () => {
      const meta = { type: 'Urination' } as EventMetadata;
      expect(component.dataSummary(baseEvent, meta)).toBe('');
    });
  });

  describe('formatDateLabel', () => {
    it('returns "Today, ..." for today', () => {
      expect(component.formatDateLabel(new Date())).toMatch(/^Today,/);
    });

    it('returns "Yesterday, ..." for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(component.formatDateLabel(yesterday)).toMatch(/^Yesterday,/);
    });

    it('returns weekday + date for older dates', () => {
      // April 1, 2026 is a Wednesday
      const old = new Date('2026-04-01T12:00:00Z');
      expect(component.formatDateLabel(old)).toMatch(/^Wednesday/);
    });
  });

  describe('buildRows', () => {
    const meta: EventMetadata = {
      type: 'Urination',
      icon: 'assets/urination-icon.svg',
      color: { primary: '#D4AC0D', secondary: '#FFF8DC' },
      hasQuickAdd: true,
    };

    it('sorts events chronologically oldest-first', () => {
      const events: Event[] = [
        { ...baseEvent, eventId: 'e2', startTime: '2026-04-23T14:00:00Z', endTime: '2026-04-23T14:01:00Z' },
        { ...baseEvent, eventId: 'e1', startTime: '2026-04-23T08:00:00Z', endTime: '2026-04-23T08:01:00Z' },
      ];
      component.eventTypes = [meta];
      const rows = component.buildRows(events);
      expect(rows[0].event.eventId).toBe('e1');
      expect(rows[1].event.eventId).toBe('e2');
    });

    it('excludes events whose type has no matching EventMetadata', () => {
      const events: Event[] = [
        { ...baseEvent, type: 'Unknown' },
      ];
      component.eventTypes = [meta];
      expect(component.buildRows(events)).toHaveLength(0);
    });

    it('sets timeLabel as a formatted AM/PM string', () => {
      const events: Event[] = [
        { ...baseEvent, startTime: '2026-04-23T08:45:00Z' },
      ];
      component.eventTypes = [meta];
      const rows = component.buildRows(events);
      expect(rows[0].timeLabel).toMatch(/\d+:\d{2}\s?(AM|PM)/i);
    });
  });
});
