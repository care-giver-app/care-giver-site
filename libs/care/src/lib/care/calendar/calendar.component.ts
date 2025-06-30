import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import {
  CalendarEvent,
  CalendarEventTimesChangedEvent,
  CalendarView,
  CalendarModule,
} from 'angular-calendar';
import { CalendarHeaderComponent } from './calendar-header/calendar-header.component';
import { Event } from '@care-giver-site/models';
import { ReceiverService, EventService } from '@care-giver-site/services';


@Component({
  selector: 'care-calendar',
  imports: [CommonModule, CalendarModule, CalendarHeaderComponent],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareCalendarComponent implements OnChanges {
  @Input() events!: Event[];

  view: CalendarView = CalendarView.Week;

  viewDate: Date = new Date();

  calendarEvents: CalendarEvent[] = [];

  refresh = new Subject<void>();

  receiverService = inject(ReceiverService);
  eventService = inject(EventService);

  ngOnInit() {
    if (this.isMobile()) {
      this.view = CalendarView.Day;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['events'] && changes['events'].currentValue) {
      this.calendarEvents = []

      for (const event of this.events) {
        this.calendarEvents.push({
          start: new Date(event.timestamp),
          title: event.type,
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
