import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ModalComponent } from '../modal.component';
import { ReceiverService, AuthService, AlertService, UserService, EventService } from '@care-giver-site/services';
import { Event, EventMetadata, DataPoint, AlertType, UpdateEventRequest } from '@care-giver-site/models';

export type ViewState = 'view' | 'edit' | 'delete-confirm';

@Component({
  selector: 'care-event-view-modal',
  standalone: true,
  imports: [
    FormsModule,
    ModalComponent,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTimepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './event-view-modal.component.html',
  styleUrl: './event-view-modal.component.css',
})
export class EventViewModalComponent implements OnChanges {
  @Input() event!: Event;
  @Input() eventTypes: EventMetadata[] = [];
  @Input() show = false;
  @Output() showChange = new EventEmitter<boolean>();
  @Output() eventChange = new EventEmitter<void>();

  private eventService = inject(EventService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private receiverService = inject(ReceiverService);
  private alertService = inject(AlertService);

  state: ViewState = 'view';

  loggedUser = '';
  readableTimestamp = '';
  dataPoints: DataPoint[] = [];

  editType = '';
  editDate: Date | null = null;
  editTime: Date | null = null;
  editInputData: { [field: string]: string } = {};
  editNote?: string;

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['event'] && this.event) {
      this.state = 'view';
      this.loggedUser = await this.userService.getLoggedUser(this.event.userId);
      this.readableTimestamp = this.eventService.getReadableTimestamp(this.event);
      this.dataPoints = this.event.data ?? [];
    }
  }

  get modalHeader(): string {
    switch (this.state) {
      case 'edit': return 'Edit Event';
      case 'delete-confirm': return 'Delete Event?';
      default: return 'Event Details';
    }
  }

  getMetadata(type: string): EventMetadata | undefined {
    return this.eventTypes.find(e => e.type === type);
  }

  getFieldLabel(name: string): string {
    return this.getMetadata(this.event.type)?.fields?.find(f => f.name === name)?.label ?? name;
  }

  getFieldUnit(name: string): string {
    const meta = this.getMetadata(this.event.type);
    return meta?.data?.name === name ? (meta.data.unit ?? '') : '';
  }

  startEdit() {
    this.editType = this.event.type;
    const start = new Date(this.event.startTime);
    this.editDate = new Date(start);
    this.editTime = new Date(start);
    this.editInputData = {};
    for (const dp of this.event.data ?? []) {
      this.editInputData[dp.name] = dp.value;
    }
    this.editNote = this.event.note;
    this.state = 'edit';
  }

  onEditTypeChange() {
    this.editInputData = {};
  }

  startDeleteConfirm() {
    this.state = 'delete-confirm';
  }

  cancelAction() {
    this.state = 'view';
  }

  close() {
    this.show = false;
    this.showChange.emit(false);
    this.state = 'view';
  }

  async saveEdit() {
    let startTime: string;
    if (this.editDate && this.editTime) {
      const combined = new Date(this.editDate);
      combined.setHours(this.editTime.getHours(), this.editTime.getMinutes(), 0, 0);
      startTime = combined.toISOString();
    } else {
      startTime = this.event.startTime;
    }

    const meta = this.getMetadata(this.editType);
    let data: DataPoint[] = [];
    if (meta?.fields?.length) {
      data = Object.entries(this.editInputData)
        .filter(([, v]) => v?.trim())
        .map(([name, value]) => ({ name, value }));
    } else if (meta?.data && this.editInputData['value']) {
      data = [{ name: meta.data.name, value: this.editInputData['value'] }];
    }

    const durationMins =
      meta?.data?.unit === 'Mins' && this.editInputData['value']
        ? parseFloat(this.editInputData['value'])
        : 30;
    const endTime = new Date(new Date(startTime).getTime() + durationMins * 60000).toISOString();

    const currentUserId = await this.authService.getCurrentUserId();

    const req: UpdateEventRequest = {
      receiverId: this.receiverService.currentReceiverId!,
      userId: currentUserId,
      eventId: this.event.eventId,
      startTime,
      endTime,
      type: this.editType,
      data,
      note: this.editNote,
    };

    try {
      const obs = await this.receiverService.updateEvent(req);
      obs.subscribe({
        next: () => {
          this.alertService.show('Event updated', AlertType.Success);
          this.eventChange.emit();
          this.state = 'view';
        },
        error: () =>
          this.alertService.show('Error updating event. Please try again.', AlertType.Failure),
      });
    } catch {
      this.alertService.show('Error updating event. Please try again.', AlertType.Failure);
    }
  }

  async confirmDelete() {
    const currentUserId = await this.authService.getCurrentUserId();
    try {
      const obs = await this.receiverService.deleteEvent(
        this.receiverService.currentReceiverId!,
        currentUserId,
        this.event.eventId,
      );
      obs.subscribe({
        next: () => {
          this.alertService.show('Event deleted', AlertType.Success);
          this.eventChange.emit();
          this.close();
        },
        error: () =>
          this.alertService.show('Error deleting event. Please try again.', AlertType.Failure),
      });
    } catch {
      this.alertService.show('Error deleting event. Please try again.', AlertType.Failure);
    }
  }
}
