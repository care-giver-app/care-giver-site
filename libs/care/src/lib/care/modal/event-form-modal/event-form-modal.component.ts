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
import { ReceiverService, AuthService, AlertService } from '@care-giver-site/services';
import { EventMetadata, EventRequest, DataPoint, AlertType } from '@care-giver-site/models';

@Component({
  selector: 'care-event-form-modal',
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
  templateUrl: './event-form-modal.component.html',
  styleUrl: './event-form-modal.component.css',
})
export class EventFormModalComponent implements OnChanges {
  @Input() eventTypes: EventMetadata[] = [];
  @Input() initialTypes: string[] = [];
  @Input() show = false;
  @Output() showChange = new EventEmitter<boolean>();
  @Output() submitted = new EventEmitter<void>();

  private receiverService = inject(ReceiverService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  selectedEventTypes: string[] = [];
  inputData: { [type: string]: { [field: string]: string } } = {};
  dateValue: Date | null = null;
  timeValue: Date | null = null;
  noteValue?: string;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['show'] && this.show) {
      this.reset();
    }
  }

  private reset() {
    this.selectedEventTypes = [...this.initialTypes];
    this.inputData = {};
    for (const t of this.selectedEventTypes) {
      this.inputData[t] = {};
    }
    this.dateValue = new Date();
    this.timeValue = this.roundToNearest(new Date(), 10);
    this.noteValue = undefined;
  }

  onEventTypeChange(types: string[]) {
    this.selectedEventTypes = types;
    const typeSet = new Set(types);
    for (const key of Object.keys(this.inputData)) {
      if (!typeSet.has(key)) delete this.inputData[key];
    }
    for (const t of types) {
      if (!this.inputData[t]) this.inputData[t] = {};
    }
  }

  getMetadata(type: string): EventMetadata | undefined {
    return this.eventTypes.find(e => e.type === type);
  }

  async submitEvent() {
    const currentUserId = await this.authService.getCurrentUserId();

    let startTime: string;
    if (this.dateValue && this.timeValue) {
      const combined = new Date(this.dateValue);
      combined.setHours(this.timeValue.getHours(), this.timeValue.getMinutes(), 0, 0);
      startTime = combined.toISOString();
    } else {
      startTime = new Date().toISOString();
    }

    const results = await Promise.all(
      this.selectedEventTypes.map(type =>
        this.addEvent(type, startTime, this.inputData[type] ?? {}, this.noteValue, currentUserId)
      )
    );
    const anySucceeded = results.some(r => r);
    if (anySucceeded) this.submitted.emit();
    this.close();
  }

  close() {
    this.show = false;
    this.showChange.emit(false);
  }

  private async addEvent(
    type: string,
    startTime: string,
    fields: { [k: string]: string },
    note: string | undefined,
    userId: string,
  ): Promise<boolean> {
    const meta = this.getMetadata(type);
    if (!meta) return false;

    let data: DataPoint[] = [];
    if (meta.fields?.length) {
      data = Object.entries(fields)
        .filter(([, v]) => v?.trim())
        .map(([name, value]) => ({ name, value }));
    } else if (meta.data && fields['value']) {
      data = [{ name: meta.data.name, value: fields['value'] }];
    }

    const durationMins =
      meta.data?.unit === 'Mins' && fields['value'] ? parseFloat(fields['value']) : 30;
    const endTime = new Date(new Date(startTime).getTime() + durationMins * 60000).toISOString();

    if (!this.receiverService.currentReceiverId) {
      this.alertService.show('No receiver selected.', AlertType.Failure);
      return false;
    }

    const req: EventRequest = {
      receiverId: this.receiverService.currentReceiverId,
      userId,
      startTime,
      endTime,
      type,
      data,
      note,
    };

    try {
      const obs = await this.receiverService.addEvent(req);
      obs.subscribe({
        next: () => this.alertService.show(`${type} logged`, AlertType.Success),
        error: () =>
          this.alertService.show('Error logging event. Please try again.', AlertType.Failure),
      });
      return true;
    } catch {
      this.alertService.show('Error logging event. Please try again.', AlertType.Failure);
      return false;
    }
  }

  private roundToNearest(date: Date, interval: number): Date {
    const ms = 1000 * 60 * interval;
    return new Date(Math.round(date.getTime() / ms) * ms);
  }
}
