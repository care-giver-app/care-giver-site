import { Component, OnInit, OnChanges, Input, SimpleChanges, inject, Output, EventEmitter, ViewChild, AfterViewInit, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventMetadata, Event, DataPoint, EventRequest, AlertType } from '@care-giver-site/models';
import { ReceiverService, UserService, AuthService, AlertService, EventService, ViewService } from '@care-giver-site/services';
import { FormsModule } from '@angular/forms';
import { EventFormModalComponent } from '../modal/event-form-modal/event-form-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

interface RowEntry {
  meta: EventMetadata;
  dataPoints: DataPoint[];
  loggedUser: string;
  readableTimestamp: string;
  eventId: string;
  note?: string;
}

interface ComponentConfig {
  hasPaginator: boolean;
  hasFilter: boolean;
  hasQuickAdd: boolean;
  tableTitle: string;
  initFunction: () => void;
  onChangesFunction: (changes: SimpleChanges) => void;
}

@Component({
  selector: 'care-event-table',
  imports: [
    CommonModule,
    FormsModule,
    EventFormModalComponent,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatSelectModule,
    MatAutocompleteModule,
  ],
  templateUrl: './event-table.component.html',
  styleUrl: './event-table.component.css',
})
export class EventTableComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() variant: 'recent_activity' | 'all_events' = 'recent_activity';
  @Input() eventTypes!: EventMetadata[];
  @Input() events!: Event[];
  @Output() newEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() eventToDelete: EventEmitter<Event> = new EventEmitter<Event>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  rows: RowEntry[] = [];
  dataSource: MatTableDataSource<RowEntry> = new MatTableDataSource(this.rows);
  filteredTypes: string[] = [];

  private receiverService = inject(ReceiverService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private eventService = inject(EventService);
  private viewService = inject(ViewService);

  showFormModal = false;
  initialTypesForModal: string[] = [];

  columnsToDisplay: string[] = ['event', 'lastLogged'];
  columnsToDisplayWithActions = [...this.columnsToDisplay, 'actions'];
  expandedRow: RowEntry | null = null;

  isMobile: boolean = this.viewService.isMobile();

  configs: { [key: string]: ComponentConfig } = {
    recent_activity: {
      hasPaginator: false,
      hasFilter: false,
      hasQuickAdd: true,
      tableTitle: 'Recent Activity',
      initFunction: () => this.initRecentActivity(),
      onChangesFunction: (changes) => this.updateRowsWithLatestEvents(changes),
    },
    all_events: {
      hasPaginator: true,
      hasFilter: true,
      hasQuickAdd: false,
      tableTitle: 'All Events',
      initFunction: () => this.initAllActivity(),
      onChangesFunction: (changes) => this.updateRowsWithAllEvents(changes),
    },
  };

  ngOnInit() {
    this.configs[this.variant].initFunction();
  }

  initRecentActivity() {
    this.rows = this.eventTypes.map(meta => ({
      meta,
      dataPoints: [],
      loggedUser: '',
      readableTimestamp: '',
      eventId: '',
      note: undefined,
    }));
    this.dataSource.data = this.rows;
  }

  initAllActivity() {}

  onFilterChange() {
    if (this.filteredTypes.length) {
      this.dataSource.data = this.rows.filter(row => this.filteredTypes.includes(row.meta.type));
    } else {
      this.dataSource.data = this.rows;
    }
  }

  ngAfterViewInit() {
    if (this.configs[this.variant].hasPaginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  isExpanded(row: RowEntry) { return this.expandedRow === row; }
  toggle(row: RowEntry) { this.expandedRow = this.isExpanded(row) ? null : row; }

  async ngOnChanges(changes: SimpleChanges) {
    this.configs[this.variant].onChangesFunction(changes);
  }

  private async updateRowsWithAllEvents(changes: SimpleChanges) {
    if (changes['events']) {
      const newRows: RowEntry[] = [];
      this.events.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      for (const event of this.events) {
        const metadata = this.eventTypes.find(meta => meta.type === event.type)!;
        const readableTimestamp = this.isMobile
          ? this.eventService.getCalendarTimestamp(event)
          : this.eventService.getReadableTimestamp(event);
        const loggedUser = await this.userService.getLoggedUser(event.userId);
        newRows.push({
          meta: metadata,
          dataPoints: event.data ?? [],
          loggedUser,
          readableTimestamp,
          eventId: event.eventId || '',
          note: event.note,
        });
      }
      this.rows = newRows;
      this.dataSource.data = this.rows;
      if (this.configs[this.variant].hasFilter && this.filteredTypes.length) {
        this.dataSource.data = this.rows.filter(row => this.filteredTypes.includes(row.meta.type));
      }
    }
  }

  private async updateRowsWithLatestEvents(changes: SimpleChanges) {
    if (changes['events']) {
      for (let i = 0; i < this.eventTypes.length; i++) {
        const meta = this.eventTypes[i];
        const latestEvent = await this.getLatestEvent(meta);
        if (latestEvent) {
          this.rows[i].dataPoints = latestEvent.dataPoints;
          this.rows[i].loggedUser = latestEvent.loggedUser;
          this.rows[i].readableTimestamp = latestEvent.readableTimestamp;
          this.rows[i].eventId = latestEvent.eventId;
          this.rows[i].note = latestEvent.note;
        } else {
          this.rows[i].dataPoints = [];
          this.rows[i].loggedUser = '';
          this.rows[i].readableTimestamp = '';
          this.rows[i].note = undefined;
        }
      }
      this.dataSource.data = this.rows;
    }
  }

  private async getLatestEvent(meta: EventMetadata): Promise<RowEntry | undefined> {
    const events = this.receiverService.getEventsOfType(this.events, meta.type);
    if (events.length > 0) {
      const latestEvent = events[0];
      const readableTimestamp = this.isMobile
        ? this.eventService.getCalendarTimestamp(latestEvent)
        : this.eventService.getReadableTimestamp(latestEvent);
      const loggedUser = await this.userService.getLoggedUser(latestEvent.userId);
      return {
        meta,
        dataPoints: latestEvent.data ?? [],
        loggedUser,
        readableTimestamp,
        eventId: latestEvent.eventId || '',
        note: latestEvent.note,
      };
    }
    return undefined;
  }

  onQuickLogEvent(type: string) {
    const metadata = this.getMetadata(type);
    if (metadata?.data || (metadata?.fields && metadata.fields.length > 0)) {
      this.initialTypesForModal = [type];
      this.showFormModal = true;
    } else {
      this.addEventNoModal(type);
    }
  }

  onLogEvent() {
    this.initialTypesForModal = [];
    this.showFormModal = true;
  }

  getMetadata(type: string): EventMetadata | undefined {
    return this.eventTypes.find(event => event.type === type);
  }

  getFieldLabel(type: string, name: string): string {
    return this.getMetadata(type)?.fields?.find(f => f.name === name)?.label ?? name;
  }

  getFieldUnit(type: string, name: string): string {
    const meta = this.getMetadata(type);
    return meta?.data?.name === name ? (meta.data.unit ?? '') : '';
  }

  onDeleteEvent(eventId: string) {
    const event = this.events.find(row => row.eventId === eventId);
    if (event) {
      this.eventToDelete.emit(event);
    }
  }

  private async addEventNoModal(type: string) {
    const currentUserId = await this.authService.getCurrentUserId();
    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + 30 * 60000).toISOString();

    if (!this.receiverService.currentReceiverId) {
      this.alertService.show('No receiver selected.', AlertType.Failure);
      return;
    }

    const req: EventRequest = {
      receiverId: this.receiverService.currentReceiverId,
      userId: currentUserId,
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
          this.alertService.show(`${type} event added`, AlertType.Success);
        },
        error: () => this.alertService.show('Error adding event.', AlertType.Failure),
      });
    } catch {
      this.alertService.show('Error adding event.', AlertType.Failure);
    }
  }

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly currentType = model('');

  get filteredAvailableTypes(): string[] {
    const input = this.currentType().toLowerCase();
    return this.availableTypes.filter(type => type.toLowerCase().includes(input));
  }

  get availableTypes(): string[] {
    return this.eventTypes.map(e => e.type).filter(type => !this.filteredTypes.includes(type));
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.filteredTypes.includes(value)) {
      this.filteredTypes.push(value);
      this.onFilterChange();
    }
    this.currentType.set('');
  }

  remove(type: string): void {
    const index = this.filteredTypes.indexOf(type);
    if (index >= 0) {
      this.filteredTypes.splice(index, 1);
      this.onFilterChange();
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.viewValue;
    if (value && !this.filteredTypes.includes(value)) {
      this.filteredTypes.push(value);
      this.onFilterChange();
    }
    this.currentType?.set?.('');
    event.option.deselect?.();
  }
}
