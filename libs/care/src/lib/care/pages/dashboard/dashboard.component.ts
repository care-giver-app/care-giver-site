import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CareCalendarComponent } from '../../calendar/calendar.component';
import { UpcomingEventsComponent } from '../../upcoming-events/upcoming-events.component';
import { StatusMonitorComponent } from '../../status-monitor/status-monitor.component';
import { QuickLogComponent } from '../../quick-log/quick-log.component';
import { EventModalComponent } from '../../modal/event-modal/event-modal.component';
import { ReceiverService, EventService, AuthService } from '@care-giver-site/services'
import { Event, EventMetadata } from '@care-giver-site/models';
import { AlertComponent } from '../../alert/alert.component';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DailyTimelineComponent } from '../../daily-timeline/daily-timeline.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-dashboard',
  imports: [
    CommonModule,
    CareCalendarComponent,
    FormsModule,
    AlertComponent,
    EventModalComponent,
    MatButtonModule,
    MatProgressSpinnerModule,
    UpcomingEventsComponent,
    StatusMonitorComponent,
    QuickLogComponent,
    DailyTimelineComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(DailyTimelineComponent) private timeline!: DailyTimelineComponent;

  private receiverService = inject(ReceiverService);
  private authService = inject(AuthService);
  private eventService = inject(EventService);
  private destroy$ = new Subject<void>();
  eventTypes: EventMetadata[] = [];

  events: Event[] = [];
  userId = '';

  showEventModal = false
  showSpinner = true

  selectedEvent: Event | null = null;
  eventAction: 'create' | 'update' | 'delete' | 'view' = 'view';

  ngOnInit() {
    this.eventService.eventConfigs$.subscribe(configs => {
      this.eventTypes = configs;
    });

    this.receiverService.receiverChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.getLatestEvents());

    this.receiverService.eventAdded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onNewEvent());

    if (this.receiverService.currentReceiverId) {
      this.getLatestEvents();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async getLatestEvents() {
    if (!this.receiverService.currentReceiverId) {
      return;
    }

    this.authService.getCurrentUserId().then(async (userId) => {
      this.userId = userId;
      if (this.receiverService.currentReceiverId && this.userId) {
        const observable = await this.receiverService.getReceiverEvents(this.receiverService.currentReceiverId, this.userId);
        observable.subscribe((data: Event[]) => {
          this.events = data;
          this.showSpinner = false;
        });
      }
    });
  }

  onNewEvent() {
    this.getLatestEvents();
    this.timeline?.refresh();
  }

  handleDeleteEvent(event: Event) {
    this.selectedEvent = event;
    this.eventAction = 'delete';
    this.showEventModal = true;
  }

  handleViewEvent(event: Event) {
    this.selectedEvent = event;
    this.eventAction = 'view';
    this.showEventModal = true;
  }

}