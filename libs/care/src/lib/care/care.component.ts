import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CareCalendarComponent } from './calendar/calendar.component';
import { EventBoxComponent } from './event-box/event-box.component';
import { ReceiverService, ReceiverData, EventTypes } from '@care-giver-site/services'
import { DatabaseEvent, EventMetadata } from '@care-giver-site/models';

@Component({
  selector: 'lib-care',
  imports: [CommonModule, CareCalendarComponent, EventBoxComponent],
  templateUrl: './care.component.html',
  styleUrl: './care.component.css',
})
export class CareComponent implements OnInit {
  private receiverService = inject(ReceiverService);
  eventTypes: EventMetadata[] = EventTypes;

  events: DatabaseEvent[] = [];
  receiverId: string = 'Receiver#aaf12b66-75fe-4b03-97f9-615bf809a537';

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
  }

  getLatestReceiverData() {
    this.receiverService.getReceiverData(this.receiverId).subscribe((data: ReceiverData) => {
      this.receiver = data;
    });
  }
}
