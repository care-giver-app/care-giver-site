import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CareCalendarComponent } from './calendar/calendar.component';
import { EventBoxComponent } from './event-box/event-box.component';
import { NavbarComponent } from './navbar/navbar.component';
import { ReceiverService, EventTypes, AuthService, UserService } from '@care-giver-site/services'
import { Event, EventMetadata, Receiver, User } from '@care-giver-site/models';

@Component({
  selector: 'lib-care',
  imports: [CommonModule, CareCalendarComponent, EventBoxComponent, NavbarComponent, FormsModule],
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

  ngOnInit() {
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
              this.selectedReceiverId = this.receivers[0].receiverId;
              this.getLatestEvents()
            }
          })
        }
      })
    });
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

}
