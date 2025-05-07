import { Component, OnChanges, Input, SimpleChanges, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event, EventMetadata } from '@care-giver-site/models';
import { ReceiverService, ReceiverData, UserService, AuthService } from '@care-giver-site/services';
import { FormsModule } from '@angular/forms';



@Component({
  selector: 'care-event-box',
  imports: [CommonModule, FormsModule],
  templateUrl: './event-box.component.html',
  styleUrl: './event-box.component.css',
})
export class EventBoxComponent implements OnChanges {
  @Input() eventType!: EventMetadata

  @Input() receiver!: ReceiverData

  @Output() newEvent: EventEmitter<void> = new EventEmitter<void>();


  latestEvent: Event | undefined;
  eventTimestamp!: string;
  receiverService = inject(ReceiverService)
  userService = inject(UserService)
  authService = inject(AuthService)

  showModal: boolean = false;
  inputValue: string = '';

  currentUserId: string = '';
  loggedUser: string = '';

  constructor() {
    this.authService.getCurrentUserId().then((userId) => {
      this.currentUserId = userId;
    })
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();
  }

  setEventTime(date: Date): string {
    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
    if (this.isToday(date)) {
      return `Today at ${date.toLocaleTimeString([], timeOptions)}`;
    } else if (this.isYesterday(date)) {
      return `Yesterday at ${date.toLocaleTimeString([], timeOptions)}`;
    } else {
      return `${date.toLocaleDateString([], { weekday: 'long' })}, ${date.toLocaleDateString([], { dateStyle: "long" })} ${date.toLocaleTimeString([], timeOptions)}`
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['receiver'] && changes['receiver'].currentValue && this.receiver.receiverId) {
      this.latestEvent = this.receiverService.getLastEvent(this.receiver, this.eventType.type) as Event;
      this.eventTimestamp = this.setEventTime(new Date(this.latestEvent?.timestamp))

      this.userService.getUserData(this.latestEvent?.user).then((observable) => {
        observable.subscribe((user) => {
          this.loggedUser = `${user.firstName} ${user.lastName}`;
        });
      });
    }
  }

  onAddEvent() {
    if (this.eventType.dataName) {
      this.showModal = true;
    } else {
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

  async addEvent(data: string | null) {
    const observable = await this.receiverService.addEvent(this.currentUserId, this.receiver.receiverId, this.eventType, data);
    observable.subscribe(() => {
      this.newEvent.emit();
    });
  }
}
