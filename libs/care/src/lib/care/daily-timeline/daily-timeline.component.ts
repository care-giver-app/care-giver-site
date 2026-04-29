import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReceiverService, EventService, AuthService } from '@care-giver-site/services';
import { Event, EventMetadata } from '@care-giver-site/models';

export interface TimelineRow {
  meta: EventMetadata;
  event: Event;
  timeLabel: string;
  dataSummary: string;
}

@Component({
  selector: 'care-daily-timeline',
  imports: [CommonModule],
  templateUrl: './daily-timeline.component.html',
  styleUrl: './daily-timeline.component.css',
})
export class DailyTimelineComponent implements OnInit {
  private receiverService = inject(ReceiverService);
  private eventService = inject(EventService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  selectedDate = new Date();
  rows: TimelineRow[] = [];
  loading = false;
  eventTypes: EventMetadata[] = [];

  private cache = new Map<string, Event[]>();
  private userId = '';
  private loadSeq = 0;

  ngOnInit() {
    this.eventService.eventConfigs$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(configs => {
        this.eventTypes = configs;
      });
    this.authService.getCurrentUserId().then(id => {
      this.userId = id;
      this.loadDate(this.selectedDate);
    });
  }

  isToday(): boolean {
    return this.selectedDate.toDateString() === new Date().toDateString();
  }

  prevDay() {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() - 1);
    this.selectedDate = d;
    this.loadDate(this.selectedDate);
  }

  nextDay() {
    if (this.isToday()) return;
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() + 1);
    this.selectedDate = d;
    this.loadDate(this.selectedDate);
  }

  formatDateLabel(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (date.toDateString() === today.toDateString()) return `Today, ${monthDay}`;
    if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${monthDay}`;
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }

  refresh() {
    const key = `${this.selectedDate.getFullYear()}-${String(this.selectedDate.getMonth() + 1).padStart(2, '0')}-${String(this.selectedDate.getDate()).padStart(2, '0')}`;
    this.cache.delete(key);
    this.loadDate(this.selectedDate);
  }

  async loadDate(date: Date) {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const cached = this.cache.get(key);
    if (cached) {
      this.rows = this.buildRows(cached);
      return;
    }

    const seq = ++this.loadSeq;
    this.loading = true;

    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const end   = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    if (!this.receiverService.currentReceiverId || !this.userId) {
      this.loading = false;
      return;
    }

    try {
      const obs = await this.receiverService.getReceiverEvents(
        this.receiverService.currentReceiverId,
        this.userId,
        start.toISOString(),
        end.toISOString(),
      );
      obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((events: Event[]) => {
        if (seq !== this.loadSeq) return;
        this.cache.set(key, events);
        this.rows = this.buildRows(events);
        this.loading = false;
      });
    } catch {
      this.loading = false;
    }
  }

  buildRows(events: Event[]): TimelineRow[] {
    return events
      .slice()
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .map(event => {
        const meta = this.eventTypes.find(m => m.type === event.type);
        if (!meta) return null;
        return {
          meta,
          event,
          timeLabel: new Date(event.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          dataSummary: this.dataSummary(event, meta),
        };
      })
      .filter((r): r is TimelineRow => r !== null);
  }

  dataSummary(event: Event, meta: EventMetadata): string {
    if (!event.data?.length) return '';
    if (meta.data) {
      return `${event.data[0].value} ${meta.data.unit.toLowerCase()}`;
    }
    if (meta.fields?.length) {
      return event.data.map(d => d.value).join(' · ');
    }
    return '';
  }
}
