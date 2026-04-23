import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event, EventMetadata } from '@care-giver-site/models';

interface UpcomingRow {
  meta: EventMetadata;
  event: Event;
  dateLabel: string;
}

@Component({
  selector: 'care-upcoming-events',
  imports: [CommonModule],
  templateUrl: './upcoming-events.component.html',
  styleUrl: './upcoming-events.component.css',
})
export class UpcomingEventsComponent implements OnChanges {
  @Input() events!: Event[];
  @Input() eventTypes!: EventMetadata[];

  rows: UpcomingRow[] = [];

  ngOnChanges() {
    this.rows = this.buildRows();
  }

  private buildRows(): UpcomingRow[] {
    const now = new Date();
    const rows: UpcomingRow[] = [];

    for (const meta of this.eventTypes) {
      if (!meta.upcoming?.show) continue;
      const ceiling = new Date(now.getTime() + meta.upcoming.lookAheadDays * 86400000);

      for (const event of this.events) {
        if (event.type !== meta.type) continue;
        const start = new Date(event.startTime);
        if (start > now && start <= ceiling) {
          rows.push({ meta, event, dateLabel: this.formatDate(start) });
        }
      }
    }

    return rows.sort((a, b) => new Date(a.event.startTime).getTime() - new Date(b.event.startTime).getTime());
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  getDataSummary(event: Event): string {
    if (!event.data?.length) return '';
    return event.data.map(d => `${d.name}: ${d.value}`).join(' · ');
  }
}
