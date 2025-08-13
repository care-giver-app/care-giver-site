import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventTableComponent } from '../../event-table/event-table.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import { EventModalComponent } from '../../modal/event-modal/event-modal.component';
import { ReceiverService, EventTypes, AuthService, UserService, AlertService, EventService } from '@care-giver-site/services'
import { AlertType, Event, EventMetadata, Receiver, User } from '@care-giver-site/models';
import { AlertComponent } from '../../alert/alert.component';
import { ChartComponent } from '../../chart/chart.component';

@Component({
  selector: 'lib-stats',
  imports: [CommonModule, NavbarComponent, FormsModule, EventTableComponent, AlertComponent, EventModalComponent, ChartComponent],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css',
})
export class StatsComponent implements OnInit {
  private receiverService = inject(ReceiverService);
  private authService = inject(AuthService);
  private userService = inject(UserService)
  private eventService = inject(EventService);
  private alertService = inject(AlertService);
  eventTypes: EventMetadata[] = EventTypes;

  events: Event[] = [];
  receivers: Receiver[] = [];
  selectedReceiverId: string = '';
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

  ngOnInit() {
    this.fetchReceivers();
  }

  onReceiverChange() {
    this.receiverService.currentReceiverId = this.selectedReceiverId;
    this.getLatestEvents()
  }

  async getLatestEvents() {
    const observable = await this.receiverService.getReceiverEvents(this.selectedReceiverId, this.userId);
    observable.subscribe((data: Event[]) => {
      this.events = data;
    });
  }

  signOut() {
    this.authService.signOutUser().then(() => {
      window.location.reload();
    })
  }

  fetchReceivers(receiverId?: string) {
    this.authService.getCurrentUserId().then((userId) => {
      this.userId = userId;
      this.userService.getUserData(this.userId).then((user: User | undefined) => {
        if (user) {
          this.user = user;
          this.receiverService.getReceivers(
            this.userId,
            [
              ...(this.user?.primaryCareReceivers ?? []),
              ...(this.user?.additionalCareReceivers ?? [])
            ]
          ).then((receivers: Receiver[]) => {
            this.receivers = receivers;
            if (this.receivers.length) {
              if (receiverId) {
                this.selectedReceiverId = receiverId
                this.receiverService.currentReceiverId = this.selectedReceiverId;
              } else {
                this.selectedReceiverId = this.receivers[0].receiverId;
                this.receiverService.currentReceiverId = this.selectedReceiverId;
              }
              this.getLatestEvents()
            }
          })
        }
      })
    });
  }

  submitAddReceiver() {
    this.userService.addCareReceiver(this.userId, this.newReceiver.firstName, this.newReceiver.lastName).then((resp) => {
      if (resp) {
        this.alertService.show('Care Receiver added successfully', AlertType.Success);
        this.fetchReceivers(resp.receiverId);
      } else {
        this.alertService.show('Error adding care receiver. Please try again later.', AlertType.Failure);
      }
      this.showAddReceiverModal = false;
      this.newReceiver = { firstName: '', lastName: '' };
    })
  }

  submitAddCareGiver() {
    this.userService.addCareGiver(this.userId, this.selectedReceiverId, this.additionalCareGiverEmail).then((resp) => {
      if (resp) {
        this.alertService.show('Care Giver added successfully', AlertType.Success);
      } else {
        this.alertService.show('Error adding care giver. Please try again later.', AlertType.Failure);
      }
      this.showAddCareGiverModal = false;
      this.additionalCareGiverEmail = '';
    })
  }

  handleDeleteEvent(event: Event) {
    this.selectedEvent = event;
    this.eventAction = 'delete';
    this.showEventModal = true;
  }

  handleViewEvent(event: Event) {
    console.log(this.eventAction);
    this.selectedEvent = event;
    this.eventAction = 'view';
    this.showEventModal = true;
  }

}