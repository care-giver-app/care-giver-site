import { Component, OnInit, OnChanges, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event, EventMetadata } from '@care-giver-site/models';
import { ModalComponent } from '../modal/modal.component';
import { MatButtonModule } from '@angular/material/button';

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
  imports: [CommonModule, ModalComponent, MatButtonModule],
  templateUrl: './status-monitor.component.html',
  styleUrl: './status-monitor.component.css',
})
export class StatusMonitorComponent implements OnInit, OnChanges {
  @Input() events!: Event[];
  @Input() eventTypes!: EventMetadata[];

  rows: MonitorRow[] = [];

  showModal = false;
  selectedRow: MonitorRow | null = null;

  ngOnInit(): void { this.buildRows(); }
  ngOnChanges(): void { this.buildRows(); }

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
      const t = meta.monitor.alertThresholds;
      const status: StatusLevel = hours >= t.critical ? 'critical'
        : hours >= t.red ? 'red'
        : hours >= t.yellow ? 'yellow'
        : 'green';

      result.push({
        meta,
        lastEvent: latest,
        relativeTime: this.toRelativeTime(hours),
        absoluteTime: new Date(latest.startTime).toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        }),
        status,
        urgencyRatio: hours / t.yellow,
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
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedRow = null;
  }

  getFieldLabel(meta: EventMetadata, name: string): string {
    return meta.fields?.find(f => f.name === name)?.label ?? name;
  }
}
