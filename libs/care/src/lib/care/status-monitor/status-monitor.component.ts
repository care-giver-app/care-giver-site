import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event, EventMetadata } from '@care-giver-site/models';
import { EventViewModalComponent } from '../modal/event-view-modal/event-view-modal.component';

type StatusLevel = 'green' | 'yellow' | 'red' | 'critical';

interface MonitorRow {
  meta: EventMetadata;
  lastEvent: Event;
  relativeTime: string;
  absoluteTime: string;
  status: StatusLevel;
  urgencyRatio: number;
}

@Component({
  selector: 'care-status-monitor',
  imports: [CommonModule, EventViewModalComponent],
  templateUrl: './status-monitor.component.html',
  styleUrl: './status-monitor.component.css',
})
export class StatusMonitorComponent implements OnInit, OnChanges {
  @Input() events!: Event[];
  @Input() eventTypes!: EventMetadata[];
  @Output() eventChange = new EventEmitter<void>();

  rows: MonitorRow[] = [];
  showEventModal = false;
  selectedRow: MonitorRow | null = null;

  ngOnInit(): void { this.buildRows(); }
  ngOnChanges(): void { this.buildRows(); }

  private buildRows(): void {
    const now = Date.now();
    const result: MonitorRow[] = [];

    for (const meta of this.eventTypes) {
      if (!meta.monitor?.alertThresholds && !meta.monitor?.showLastValue) continue;

      const eventsOfType = this.events.filter(e => e.type === meta.type);
      if (eventsOfType.length === 0) continue;

      const latest = eventsOfType.reduce((a, b) =>
        new Date(a.startTime).getTime() > new Date(b.startTime).getTime() ? a : b
      );

      const hours = (now - new Date(latest.startTime).getTime()) / 3600000;
      const t = meta.monitor.alertThresholds;
      const status: StatusLevel = t
        ? (hours >= t.critical ? 'critical' : hours >= t.red ? 'red' : hours >= t.yellow ? 'yellow' : 'green')
        : 'green';
      const urgencyRatio = t ? hours / t.yellow : -1;

      result.push({
        meta,
        lastEvent: latest,
        relativeTime: this.toRelativeTime(hours),
        absoluteTime: new Date(latest.startTime).toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        }),
        status,
        urgencyRatio,
      });
    }

    this.rows = result.sort((a, b) => b.urgencyRatio - a.urgencyRatio);
  }

  private toRelativeTime(hours: number): string {
    if (hours < 1) return `${Math.round(hours * 60)}m ago`;
    if (hours < 24) return `${Math.round(hours)}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  }

  onRowClick(row: MonitorRow): void {
    this.selectedRow = row;
    this.showEventModal = true;
  }

  onEventChange(): void {
    this.selectedRow = null;
    this.showEventModal = false;
    this.eventChange.emit();
  }
}
