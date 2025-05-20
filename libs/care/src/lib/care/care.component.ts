import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CareCalendarComponent } from './calendar/calendar.component';
import { EventBoxComponent } from './event-box/event-box.component';
import { ReceiverService, ReceiverData, EventTypes, AuthService } from '@care-giver-site/services'
import { DatabaseEvent, EventMetadata } from '@care-giver-site/models';

@Component({
  selector: 'lib-care',
  imports: [CommonModule, CareCalendarComponent, EventBoxComponent],
  templateUrl: './care.component.html',
  styleUrl: './care.component.css',
})
export class CareComponent implements OnInit {
  private receiverService = inject(ReceiverService);
  private authService = inject(AuthService);
  eventTypes: EventMetadata[] = EventTypes;

  events: DatabaseEvent[] = [];
  receiverId: string = 'Receiver#aaf12b66-75fe-4b03-97f9-615bf809a537';
  userId: string = '';

  receiver: ReceiverData = {
    receiverId: '',
    firstName: '',
    lastName: '',
    medications: [],
    bowelMovements: [],
    showers: [],
    urinations: [],
    weights: [],
  };

  ngOnInit() {
    this.getLatestReceiverData()

    this.authService.getCurrentUserId().then((userId) => {
      this.userId = userId;
    });
  }

  async getLatestReceiverData() {
    const observable = await this.receiverService.getReceiverData(this.receiverId);
    observable.subscribe((data: ReceiverData) => {
      this.receiver = data;
    });
  }

  signOut() {
    this.authService.signOutUser().then(() => {
      window.location.reload();
    })
  }
}
