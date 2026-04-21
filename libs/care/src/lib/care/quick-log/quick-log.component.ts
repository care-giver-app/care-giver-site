import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ReceiverService, AuthService, AlertService } from '@care-giver-site/services';
import { EventMetadata, EventRequest, AlertType, DataPoint } from '@care-giver-site/models';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'care-quick-log',
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTimepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './quick-log.component.html',
  styleUrl: './quick-log.component.css',
})
export class QuickLogComponent {
  @Input() eventTypes!: EventMetadata[];
  @Output() newEvent = new EventEmitter<void>();

  private receiverService = inject(ReceiverService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  currentUserId = '';

  // Modal state
  showModal = false;
  selectedType: EventMetadata | null = null;
  inputData: { [key: string]: string } = {};
  dateValue: Date | null = null;
  timeValue: Date | null = null;
  noteValue?: string;

  constructor() {
    this.authService.getCurrentUserId().then(id => {
      this.currentUserId = id;
    }).catch(err => {
      console.error('Error fetching current user ID:', err);
    });
  }

  get quickAddTypes(): EventMetadata[] {
    return this.eventTypes?.filter(e => e.hasQuickAdd) ?? [];
  }

  onButtonClick(meta: EventMetadata) {
    const needsModal = meta.data || (meta.fields && meta.fields.length > 0);
    if (needsModal) {
      this.openModal(meta);
    } else {
      this.logEvent(meta.type);
    }
  }

  openModal(meta: EventMetadata) {
    this.selectedType = meta;
    this.inputData = {};
    this.dateValue = new Date();
    this.timeValue = this.roundToNearestMinutes(new Date(), 10);
    this.noteValue = undefined;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedType = null;
    this.inputData = {};
    this.noteValue = undefined;
  }

  submitModal() {
    if (!this.selectedType) return;
    let startTime = '';
    if (this.dateValue && this.timeValue) {
      const combined = new Date(this.dateValue);
      combined.setHours(this.timeValue.getHours(), this.timeValue.getMinutes(), 0, 0);
      startTime = combined.toISOString();
    } else {
      startTime = new Date().toISOString();
    }
    this.logEvent(this.selectedType.type, this.inputData, startTime, this.noteValue);
    this.closeModal();
  }

  private async logEvent(
    type: string,
    fieldValues: { [key: string]: string } = {},
    startTimeOverride?: string,
    note?: string,
  ) {
    const metadata = this.eventTypes.find(e => e.type === type);
    if (!metadata) return;

    let data: DataPoint[] = [];
    if (metadata.fields?.length) {
      data = Object.entries(fieldValues)
        .filter(([, v]) => v?.trim())
        .map(([name, value]) => ({ name, value }));
    } else if (metadata.data && fieldValues['value']) {
      data = [{ name: metadata.data.name, value: fieldValues['value'] }];
    }

    const startTime = startTimeOverride ?? new Date().toISOString();
    const durationMins =
      metadata.data?.unit === 'Mins' && fieldValues['value']
        ? parseFloat(fieldValues['value'])
        : 30;
    const endTime = new Date(new Date(startTime).getTime() + durationMins * 60000).toISOString();

    if (!this.receiverService.currentReceiverId) {
      this.alertService.show('No receiver selected.', AlertType.Failure);
      return;
    }

    const req: EventRequest = {
      receiverId: this.receiverService.currentReceiverId,
      userId: this.currentUserId,
      startTime,
      endTime,
      type,
      data,
      note,
    };

    try {
      const obs = await this.receiverService.addEvent(req);
      obs.subscribe({
        next: () => {
          this.newEvent.emit();
          this.alertService.show(`${type} logged`, AlertType.Success);
        },
        error: () => {
          this.alertService.show('Error logging event', AlertType.Failure);
        },
      });
    } catch {
      this.alertService.show('Error logging event', AlertType.Failure);
    }
  }

  private roundToNearestMinutes(date: Date, interval: number): Date {
    const ms = 1000 * 60 * interval;
    return new Date(Math.round(date.getTime() / ms) * ms);
  }
}
