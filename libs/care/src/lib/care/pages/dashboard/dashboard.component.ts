import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CareCalendarComponent } from '../../calendar/calendar.component';
import { EventTableComponent } from '../../event-table/event-table.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import { EventModalComponent } from '../../modal/event-modal/event-modal.component';
import { ReceiverService, EventTypes, AuthService } from '@care-giver-site/services'
import { Event, EventMetadata, Receiver, User } from '@care-giver-site/models';
import { AlertComponent } from '../../alert/alert.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReceiverSelectionComponent } from '../../receiver-selection/receiver-selection.component';

@Component({
  selector: 'lib-dashboard',
  imports: [
    CommonModule,
    CareCalendarComponent,
    NavbarComponent,
    FormsModule,
    EventTableComponent,
    AlertComponent,
    EventModalComponent,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    ReceiverSelectionComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private receiverService = inject(ReceiverService);
  private authService = inject(AuthService);
  eventTypes: EventMetadata[] = EventTypes;

  events: Event[] = [];
  receivers: Receiver[] = [];
  userId: string = '';
  user: User | undefined = undefined;

  showEventModal = false

  selectedEvent: Event | null = null;
  eventAction: 'create' | 'update' | 'delete' | 'view' = 'view';

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

  signOut() {
    this.authService.signOutUser().then(() => {
      window.location.reload();
    })
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