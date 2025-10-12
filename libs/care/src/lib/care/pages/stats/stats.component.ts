import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventTableComponent } from '../../event-table/event-table.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import { EventModalComponent } from '../../modal/event-modal/event-modal.component';
import { ReceiverService, EventTypes, AuthService, UserService, AlertService, EventService } from '@care-giver-site/services'
import { AlertType, Event, EventMetadata, Receiver, User, Relationships } from '@care-giver-site/models';
import { AlertComponent } from '../../alert/alert.component';
import { ChartComponent } from '../../chart/chart.component';
import { ReceiverSelectionComponent } from '../../receiver-selection/receiver-selection.component';

@Component({
  selector: 'lib-stats',
  imports: [CommonModule, NavbarComponent, FormsModule, EventTableComponent, AlertComponent, EventModalComponent, ChartComponent, ReceiverSelectionComponent],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css',
})
export class StatsComponent {
  private receiverService = inject(ReceiverService);
  private authService = inject(AuthService);
  private userService = inject(UserService)
  private eventService = inject(EventService);
  private alertService = inject(AlertService);
  eventTypes: EventMetadata[] = EventTypes;

  events: Event[] = [];
  receivers: Receiver[] = [];
  userId: string = '';
  user: User | undefined = undefined;

  showAddReceiverModal = false;
  showAddCareGiverModal = false;
  showEventModal = false

  newReceiver = { firstName: '', lastName: '' };
  additionalCareGiverEmail = '';

  selectedEvent: Event | null = null;
  eventAction: 'create' | 'update' | 'delete' | 'view' = 'view';

  weightMetaData: EventMetadata = EventTypes.find(e => e.type === 'Weight')!

  onReceiverChange() {
    this.getLatestEvents()
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
    this.eventAction = 'delete';
    this.showEventModal = true;
  }

  handleViewEvent(event: Event) {
    this.selectedEvent = event;
    this.eventAction = 'view';
    this.showEventModal = true;
  }

}