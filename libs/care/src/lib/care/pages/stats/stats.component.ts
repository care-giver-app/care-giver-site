import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EventTableComponent } from '../../event-table/event-table.component';
import { EventViewModalComponent } from '../../modal/event-view-modal/event-view-modal.component';
import { ReceiverService, AuthService, UserService, AlertService, EventService } from '@care-giver-site/services'
import { Event, EventMetadata, Receiver, User } from '@care-giver-site/models';
import { AlertComponent } from '../../alert/alert.component';
import { ChartComponent } from '../../chart/chart.component';

@Component({
  selector: 'lib-stats',
  imports: [CommonModule, FormsModule, EventTableComponent, AlertComponent, EventViewModalComponent, ChartComponent],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css',
})
export class StatsComponent implements OnInit, OnDestroy {
  private receiverService = inject(ReceiverService);
  private authService = inject(AuthService);
  private eventService = inject(EventService);

  private destroy$ = new Subject<void>();

  events: Event[] = [];
  receivers: Receiver[] = [];
  userId = '';
  user: User | undefined = undefined;

  showEventModal = false

  selectedEvent: Event | null = null;

  eventTypes: EventMetadata[] = [];
  eventTypesWithGraphs: EventMetadata[] = [];

  ngOnInit() {
    this.eventService.eventConfigs$.subscribe(configs => {
      this.eventTypes = configs;
      this.eventTypesWithGraphs = this.eventTypes.filter(e => e.graph);
    });

    this.receiverService.receiverChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.getLatestEvents());

    this.receiverService.eventAdded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.getLatestEvents());

    if (this.receiverService.currentReceiverId) {
      this.getLatestEvents();
    }
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
        });
      }
    });
  }

  handleDeleteEvent(event: Event) {
    this.selectedEvent = event;
    this.showEventModal = true;
  }

  handleViewEvent(event: Event) {
    this.selectedEvent = event;
    this.showEventModal = true;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}