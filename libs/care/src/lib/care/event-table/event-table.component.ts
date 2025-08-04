import { Component, OnInit, OnChanges, Input, SimpleChanges, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventMetadata, Event, DataPoint, User, AlertType } from '@care-giver-site/models';
import { ReceiverService, UserService, AuthService, AlertService, EventService } from '@care-giver-site/services';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';

interface RowEntry {
  meta: EventMetadata;
  data?: DataPoint
  loggedUser: string;
  readableTimestamp: string;
  eventId: string;
}

@Component({
  selector: 'care-event-table',
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './event-table.component.html',
  styleUrl: './event-table.component.css',
})
export class EventTableComponent implements OnInit, OnChanges {
  @Input() eventTypes!: EventMetadata[]
  @Input() events!: Event[];
  @Output() newEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() eventToDelete: EventEmitter<Event> = new EventEmitter<Event>();

  rows: RowEntry[] = [];
  private receiverService = inject(ReceiverService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private eventService = inject(EventService);

  currentUserId: string = '';

  // Modal state
  showModal = false;
  inputData = '';
  timestampValue = '';
  selectedEventType = '';
  selectedEventMetadata?: EventMetadata;


  constructor() { this.initializeCurrentUser(); }

  private async initializeCurrentUser() {
    try {
      this.currentUserId = await this.authService.getCurrentUserId();
    } catch (error) {
      console.error('Error fetching current user ID:', error);
    }
  }

  ngOnInit() {
    this.rows = this.eventTypes.map(meta => ({
      meta: meta,
      data: undefined,
      loggedUser: '',
      readableTimestamp: '',
      eventId: '',
    }));
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['events']?.currentValue) {
      await this.updateRowsWithEvents();
    }
  }

  private async updateRowsWithEvents() {
    for (let i = 0; i < this.eventTypes.length; i++) {
      const meta = this.eventTypes[i];
      const latestEvent = await this.getLatestEvent(meta);
      if (latestEvent) {
        this.rows[i].data = latestEvent.data;
        this.rows[i].loggedUser = latestEvent.loggedUser;
        this.rows[i].readableTimestamp = latestEvent.readableTimestamp;
        this.rows[i].eventId = latestEvent.eventId;
      } else {
        this.rows[i].data = undefined;
        this.rows[i].loggedUser = '';
        this.rows[i].readableTimestamp = '';
      }
    }
  }

  private async getLatestEvent(meta: EventMetadata): Promise<RowEntry | undefined> {
    const events = this.receiverService.getEventsOfType(this.events, meta.type);
    if (events.length > 0) {
      const latestEvent = events[0];
      const readableTimestamp = this.eventService.getReadableTimestamp(latestEvent);
      const loggedUser = await this.userService.getLoggedUser(latestEvent.userId);
      return {
        meta: meta,
        data: latestEvent.data ? latestEvent.data[0] : undefined,
        loggedUser,
        readableTimestamp,
        eventId: latestEvent.eventId || '',
      };
    }
    return undefined;
  }

  onQuickLogEvent(type: string) {
    this.selectedEventType = type;
    this.getMetadata(type);
    if (this.selectedEventMetadata?.data) {
      this.openModal();
    } else {
      this.addEvent(type, null, new Date().toISOString());
    }
  }
  onLogEvent() { this.openModal(); }
  closeModal() { this.resetModalState(); this.showModal = false; }
  openModal() { this.resetModalState(); this.showModal = true; }
  getMetadata(type: string) { this.selectedEventMetadata = this.eventTypes.find(event => event.type === type); }

  private resetModalState() {
    this.inputData = '';
    this.timestampValue = this.getLocaleDateTime();
  }

  private getLocaleDateTime(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0] + 'T' + now.toTimeString().slice(0, 5);
  }

  submitEvent() {
    const timestamp = new Date(`${this.timestampValue}`).toISOString();
    this.addEvent(this.selectedEventType, this.inputData, timestamp);
    this.closeModal();
  }

  private async addEvent(type: string, datavalue: string | null, timestamp: string) {
    let data: DataPoint[] = [];
    if (datavalue) {
      this.getMetadata(type);
      if (this.selectedEventMetadata?.data) {
        data = [{ name: this.selectedEventMetadata.data.name, value: datavalue }];
      }
    }

    try {
      if (!this.receiverService.currentReceiverId) {
        this.alertService.show('No receiver selected. Please select a receiver before adding an event.', AlertType.Failure);
        return;
      }
      const observable = await this.receiverService.addEvent(
        this.receiverService.currentReceiverId,
        this.currentUserId,
        type,
        data,
        timestamp
      );

      observable.subscribe({
        next: () => {
          this.newEvent.emit();
          this.alertService.show(`${type} event added successfully`, AlertType.Success);
        },
        error: (err) => {
          this.alertService.show(`Error adding event. Please try again later.`, AlertType.Failure);
        },
      });
    } catch (error) {
      this.alertService.show(`Error adding event. Please try again later.`, AlertType.Failure);
    }
  }

  onDeleteEvent(eventId: string) {
    const event = this.events.find(row => row.eventId === eventId);
    if (event) {
      this.eventToDelete.emit(event);
    }
  }
}


