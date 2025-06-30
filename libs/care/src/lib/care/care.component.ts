import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CareCalendarComponent } from './calendar/calendar.component';
import { EventBoxComponent } from './event-box/event-box.component';
import { NavbarComponent } from './navbar/navbar.component';
import { ModalComponent } from './modal/modal.component';
import { ReceiverService, EventTypes, AuthService, UserService } from '@care-giver-site/services'
import { Event, EventMetadata, Receiver, User } from '@care-giver-site/models';

@Component({
  selector: 'lib-care',
  imports: [CommonModule, CareCalendarComponent, EventBoxComponent, NavbarComponent, FormsModule, ModalComponent],
  templateUrl: './care.component.html',
  styleUrl: './care.component.css',
})
export class CareComponent implements OnInit {
  private receiverService = inject(ReceiverService);
  private authService = inject(AuthService);
  private userService = inject(UserService)
  eventTypes: EventMetadata[] = EventTypes;

  events: Event[] = [];
  receivers: Receiver[] = [];
  selectedReceiverId: string = '';
  userId: string = '';
  user: User | undefined = undefined;

  showAddReceiverModal = false;
  showAddCareGiverModal = false;

  newReceiver = { firstName: '', lastName: '' };
  additionalCareGiverEmail = '';

  ngOnInit() {
    this.fetchReceivers();
  }

  onReceiverChange() {
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
              } else {
                this.selectedReceiverId = this.receivers[0].receiverId;
              }
              this.getLatestEvents()
            }
          })
        }
      })
    });
  }

  submitAddReceiver() {
    // Validate and handle new receiver creation
    // Example: this.receiverService.createReceiver(this.newReceiver).subscribe(...)
    this.showAddReceiverModal = false;
    this.userService.addCareReceiver(this.userId, this.newReceiver.firstName, this.newReceiver.lastName).then((resp) => {
      if (resp) {
        this.fetchReceivers(resp.receiverId);
      }
    })
  }

  submitAddCareGiver() {
    // Validate and handle adding additional care giver
    // Example: this.userService.addCareGiver(this.additionalCareGiverEmail).subscribe(...)
    this.showAddCareGiverModal = false;
    this.additionalCareGiverEmail = '';
  }

}