import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CareCalendarComponent } from './calendar/calendar.component';
import { EventBoxComponent } from './event-box/event-box.component';
import { NavbarComponent } from './navbar/navbar.component';
import { ReceiverService, EventTypes, AuthService } from '@care-giver-site/services'
import { Event, EventMetadata, Receiver } from '@care-giver-site/models';

@Component({
  selector: 'lib-care',
  imports: [CommonModule, CareCalendarComponent, EventBoxComponent, NavbarComponent],
  templateUrl: './care.component.html',
  styleUrl: './care.component.css',
})
export class CareComponent implements OnInit {
  private receiverService = inject(ReceiverService);
  private authService = inject(AuthService);
  eventTypes: EventMetadata[] = EventTypes;

  events: Event[] = [];
  receiverId: string = 'Receiver#aaf12b66-75fe-4b03-97f9-615bf809a537';
  userId: string = '';

  receiver: Receiver = {
    receiverId: '',
    firstName: '',
    lastName: '',
  };

  ngOnInit() {
    this.authService.getCurrentUserId().then((userId) => {
      this.userId = userId;
      this.getLatestEvents()
    });
    this.getReceiver()
  }

  async getLatestEvents() {
    const observable = await this.receiverService.getReceiverEvents(this.receiverId, this.userId);
    observable.subscribe((data: Event[]) => {
      this.events = data;
    });
  }

  async getReceiver() {
    const observable = await this.receiverService.getReceiver(this.receiverId, this.userId);
    observable.subscribe((data: Receiver) => {
      this.receiver = data;
    });
  }

  signOut() {
    this.authService.signOutUser().then(() => {
      window.location.reload();
    })
  }
}
