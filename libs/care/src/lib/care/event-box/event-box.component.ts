import { Component, OnChanges, Input, SimpleChanges, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventMetadata, Event, DataPoint } from '@care-giver-site/models';
import { ReceiverService, UserService, AuthService } from '@care-giver-site/services';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'care-event-box',
  imports: [CommonModule, FormsModule],
  templateUrl: './event-box.component.html',
  styleUrl: './event-box.component.css',
})
export class EventBoxComponent implements OnChanges {
  @Input() eventMetaData!: EventMetadata;
  @Input() events!: Event[];
  @Input() receiverId!: string;
  @Output() newEvent: EventEmitter<void> = new EventEmitter<void>();


  latestEvent?: Event;
  eventTimestamp: string = '';
  eventTimestampInput: string = this.formatDateTimeLocal(new Date());
  inputValue: string = '';
  showModal: boolean = false;

  private receiverService = inject(ReceiverService);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  currentUserId: string = '';
  loggedUser: string = '';

  constructor() {
    this.initializeCurrentUser();
  }

  private async initializeCurrentUser() {
    try {
      this.currentUserId = await this.authService.getCurrentUserId();
    } catch (error) {
      console.error('Error fetching current user ID:', error);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['events']?.currentValue) {
      this.updateLatestEvent();
    }
  }

  private updateLatestEvent() {
    this.latestEvent = undefined
    const events = this.receiverService.getEventsOfType(this.events, this.eventMetaData.type)
    if (events.length > 0) {
      this.latestEvent = events[0]
      this.eventTimestamp = this.formatEventTime(new Date(this.latestEvent.timestamp));
      this.fetchLoggedUser(this.latestEvent.userId);
    }
  }

  private fetchLoggedUser(userId: string) {
    this.userService.getUserData(userId).then((observable) => {
      observable.subscribe({
        next: (user) => {
          this.loggedUser = `${user.firstName} ${user.lastName}`;
        },
        error: (err) => {
          console.error('Error fetching user data:', err);
        },
      });
    });
  }

  private formatEventTime(date: Date): string {
    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

    if (this.isToday(date)) {
      return `Today at ${date.toLocaleTimeString([], timeOptions)}`;
    } else if (this.isYesterday(date)) {
      return `Yesterday at ${date.toLocaleTimeString([], timeOptions)}`;
    } else {
      return `${date.toLocaleDateString([], { weekday: 'long' })}, ${date.toLocaleDateString([], { dateStyle: 'long' })} ${date.toLocaleTimeString([], timeOptions)}`;
    }
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  }

  onLogEvent() {
    if (this.eventMetaData.dataName) {
      this.openModal();
    } else {
      this.addEvent(null);
    }
  }

  onLogEventWithTime() {
    this.openModal();
  }

  closeModal() {
    this.resetModalState();
    this.showModal = false;
  }

  openModal() {
    this.resetModalState();
    this.showModal = true;
  }

  private resetModalState() {
    this.inputValue = '';
    this.eventTimestampInput = this.formatDateTimeLocal(new Date());;
  }

  private formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  submitEvent() {
    this.addEvent(this.inputValue, this.eventTimestampInput);
    this.closeModal();
  }

  private async addEvent(datavalue: string | null, timestamp: string = this.formatDateTimeLocal(new Date())) {
    const data: DataPoint[] = datavalue !== null && this.eventMetaData.dataName
      ? [{ name: this.eventMetaData.dataName, value: datavalue }]
      : [];

    try {
      const observable = await this.receiverService.addEvent(
        this.receiverId,
        this.currentUserId,
        this.eventMetaData.type,
        data,
        timestamp
      );

      observable.subscribe({
        next: () => {
          this.newEvent.emit();
        },
        error: (err) => {
          console.error('Error adding event:', err);
        },
      });
    } catch (error) {
      console.error('Error in addEvent:', error);
    }
  }

  onDeleteEvent(eventId: string) {
    this.deleteEvent(eventId)
  }

  private async deleteEvent(eventId: string) {
    try {
      const observable = await this.receiverService.deleteEvent(
        this.receiverId,
        this.currentUserId,
        eventId,
      );

      observable.subscribe({
        next: () => {
          this.newEvent.emit();
        },
        error: (err) => {
          console.error('Error deleting event:', err);
        },
      });
    } catch (error) {
      console.error('Error in deleteEvent:', error);
    }
  }
}
