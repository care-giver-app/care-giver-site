import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { setMinutes, setHours, addMinutes } from 'date-fns';
import { Subject } from 'rxjs';
import {
  CalendarEvent,
  CalendarEventTimesChangedEvent,
  CalendarView,
  CalendarModule,
} from 'angular-calendar';
import { CalendarHeaderComponent } from './calendar-header/calendar-header.component';
import { DatabaseEvent, Event } from '@care-giver-site/models';
import { ReceiverService, ReceiverData, EventService } from '@care-giver-site/services';



@Component({
  selector: 'care-calendar',
  imports: [CommonModule, CalendarModule, CalendarHeaderComponent],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareCalendarComponent implements OnChanges {
  @Input() receiver!: ReceiverData;

  view: CalendarView = CalendarView.Week;

  viewDate: Date = new Date();

  events: CalendarEvent[] = [];

  refresh = new Subject<void>();

  receiverService = inject(ReceiverService);
  eventService = inject(EventService);

  ngOnInit() {
    if (this.isMobile()) {
      this.view = CalendarView.Day;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['receiver'] && changes['receiver'].currentValue && this.receiver.receiverId) {
      this.events = []
      const dbEvents = this.receiverService.getAllEvents(this.receiver) as DatabaseEvent[];

      for (const event of dbEvents) {
        const eventData: Event = event.data
        this.events.push({
          start: new Date(eventData.timestamp),
          title: event.name,
          color: this.eventService.getEventColor(event.type),
        });
      }

      this.refresh.next();
    }
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    this.refresh.next();
  }

  changeDay(date: Date) {
    this.viewDate = date;
    this.view = CalendarView.Day;
  }

  private isMobile(): boolean {
    return window.innerWidth <= 768;
  }
}
