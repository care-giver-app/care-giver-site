import { Component, OnChanges, Input, SimpleChanges, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event, DatabaseType } from '@care-giver-site/models';
import { ReceiverService, ReceiverData } from '@care-giver-site/services';
import { FormsModule } from '@angular/forms';



@Component({
  selector: 'care-event-box',
  imports: [CommonModule, FormsModule],
  templateUrl: './event-box.component.html',
  styleUrl: './event-box.component.css',
})
export class EventBoxComponent implements OnChanges {
  @Input() eventType!: DatabaseType

  @Input() receiver!: ReceiverData

  @Output() newEvent: EventEmitter<void> = new EventEmitter<void>();


  latestEvent: Event | undefined;
  receiverService = inject(ReceiverService)

  showModal: boolean = false;
  inputValue: string = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['receiver'] && changes['receiver'].currentValue && this.receiver.receiverId) {
      this.latestEvent = this.receiverService.getLastEvent(this.receiver, this.eventType.type) as Event;
    }
  }

  onAddEvent() {
    if (this.eventType.dataName) {
      // Show the modal if a dataName is associated with the event type
      this.showModal = true;
    } else {
      // Add event directly if no dataName is required
      this.addEvent(null);
    }
  }

  closeModal() {
    this.showModal = false;
    this.inputValue = '';
  }

  submitEvent() {
    this.addEvent(this.inputValue);
    this.closeModal();
  }

  addEvent(data: string | null) {
    this.receiverService.addEvent(this.receiver.receiverId, this.eventType, data).subscribe(() => {
      this.newEvent.emit()
    });
  }
}
