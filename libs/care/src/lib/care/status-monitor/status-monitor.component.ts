import { Component, OnInit, OnChanges, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Event, EventMetadata, EventRequest, AlertType, DataPoint } from '@care-giver-site/models';
import { ReceiverService, AuthService, AlertService } from '@care-giver-site/services';
import { ModalComponent } from '../modal/modal.component';

type StatusLevel = 'green' | 'yellow' | 'red' | 'critical';

interface MonitorRow {
  meta: EventMetadata;
  hoursSinceLast: number;
  relativeTime: string;
  status: StatusLevel;
  urgencyRatio: number;
}

@Component({
  selector: 'care-status-monitor',
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTimepickerModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './status-monitor.component.html',
  styleUrl: './status-monitor.component.css',
})
export class StatusMonitorComponent implements OnInit, OnChanges {
  @Input() events!: Event[];
  @Input() eventTypes!: EventMetadata[];
  @Output() newEvent = new EventEmitter<void>();

  private receiverService = inject(ReceiverService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  currentUserId = '';

  rows: MonitorRow[] = [];

  // Modal state
  showModal = false;
  selectedType: EventMetadata | null = null;
  dateValue: Date | null = null;
  timeValue: Date | null = null;
  inputData: { [fieldName: string]: string } = {};
  noteValue: string | undefined;

  constructor() {
    this.authService.getCurrentUserId().then(id => {
      this.currentUserId = id;
    }).catch(err => {
      console.error('Error fetching current user ID:', err);
    });
  }

  ngOnInit(): void {
    this.buildRows();
  }

  ngOnChanges(): void {
    this.buildRows();
  }

  private buildRows(): void {
    const now = Date.now();
    const result: MonitorRow[] = [];

    for (const meta of this.eventTypes) {
      if (!meta.monitor?.alertThresholds) continue;

      const eventsOfType = this.events.filter(e => e.type === meta.type);
      if (eventsOfType.length === 0) continue;

      const latest = eventsOfType.reduce((a, b) =>
        new Date(a.startTime).getTime() > new Date(b.startTime).getTime() ? a : b
      );

      const hours = (now - new Date(latest.startTime).getTime()) / 3600000;
      const thresholds = meta.monitor.alertThresholds;
      const status = this.deriveStatus(hours, thresholds);
      const urgencyRatio = hours / thresholds.yellow;

      result.push({
        meta,
        hoursSinceLast: hours,
        relativeTime: this.toRelativeTime(hours),
        status,
        urgencyRatio,
      });
    }

    result.sort((a, b) => b.urgencyRatio - a.urgencyRatio);
    this.rows = result;
  }

  private deriveStatus(
    hours: number,
    thresholds: { yellow: number; red: number; critical: number }
  ): StatusLevel {
    if (hours >= thresholds.critical) return 'critical';
    if (hours >= thresholds.red) return 'red';
    if (hours >= thresholds.yellow) return 'yellow';
    return 'green';
  }

  private toRelativeTime(hours: number): string {
    if (hours < 1) {
      const mins = Math.round(hours * 60);
      return `${mins}m ago`;
    }
    if (hours < 24) {
      return `${Math.round(hours)}h ago`;
    }
    const days = Math.round(hours / 24);
    return `${days}d ago`;
  }

  onRowClick(row: MonitorRow): void {
    const meta = row.meta;
    if (meta.data || (meta.fields && meta.fields.length > 0)) {
      this.openModal(meta);
    } else {
      this.quickLog(meta.type);
    }
  }

  private async quickLog(type: string): Promise<void> {
    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + 30 * 60000).toISOString();
    const req: EventRequest = {
      receiverId: this.receiverService.currentReceiverId!,
      userId: this.currentUserId,
      startTime,
      endTime,
      type,
      data: [],
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

  openModal(meta: EventMetadata): void {
    this.selectedType = meta;
    this.inputData = {};
    const now = new Date();
    this.dateValue = new Date(now);
    this.timeValue = this.roundToNearestMinutes(now, 10);
    this.noteValue = undefined;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedType = null;
    this.inputData = {};
    this.noteValue = undefined;
  }

  async submitModal(): Promise<void> {
    if (!this.selectedType) return;

    let startTime: string;
    if (this.dateValue && this.timeValue) {
      this.dateValue.setHours(this.timeValue.getHours(), this.timeValue.getMinutes(), 0, 0);
      startTime = this.dateValue.toISOString();
    } else {
      startTime = new Date().toISOString();
    }

    const meta = this.selectedType;
    let data: DataPoint[] = [];

    if (meta.fields && meta.fields.length > 0) {
      data = Object.entries(this.inputData)
        .filter(([, v]) => v?.trim())
        .map(([name, value]) => ({ name, value }));
    } else if (meta.data && this.inputData['value']) {
      data = [{ name: meta.data.name, value: this.inputData['value'] }];
    }

    const durationMins =
      meta.data?.unit === 'Mins' && this.inputData['value']
        ? parseFloat(this.inputData['value'])
        : 30;
    const endTime = new Date(new Date(startTime).getTime() + durationMins * 60 * 1000).toISOString();

    if (!this.receiverService.currentReceiverId) {
      this.alertService.show('No receiver selected.', AlertType.Failure);
      return;
    }

    const req: EventRequest = {
      receiverId: this.receiverService.currentReceiverId,
      userId: this.currentUserId,
      startTime,
      endTime,
      type: meta.type,
      data,
      note: this.noteValue,
    };

    try {
      const obs = await this.receiverService.addEvent(req);
      obs.subscribe({
        next: () => {
          this.newEvent.emit();
          this.alertService.show(`${meta.type} logged`, AlertType.Success);
        },
        error: () => {
          this.alertService.show('Error logging event', AlertType.Failure);
        },
      });
    } catch {
      this.alertService.show('Error logging event', AlertType.Failure);
    }

    this.closeModal();
  }

  getFieldLabel(name: string): string {
    return this.selectedType?.fields?.find(f => f.name === name)?.label ?? name;
  }

  private roundToNearestMinutes(date: Date, interval: number): Date {
    const ms = 1000 * 60 * interval;
    return new Date(Math.round(date.getTime() / ms) * ms);
  }
}
