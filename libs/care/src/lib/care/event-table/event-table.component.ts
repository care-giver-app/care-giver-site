import { Component, OnInit, OnChanges, Input, SimpleChanges, inject, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventMetadata, Event, DataPoint, EventRequest, AlertType } from '@care-giver-site/models';
import { ReceiverService, UserService, AuthService, AlertService, EventService, ViewService } from '@care-giver-site/services';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';



interface RowEntry {
  meta: EventMetadata;
  data?: DataPoint
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
    ModalComponent,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTimepickerModule
  ],
  templateUrl: './event-table.component.html',
  styleUrl: './event-table.component.css',
})
export class EventTableComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() variant: 'recent_activity' | 'all_events' = 'recent_activity';
  @Input() eventTypes!: EventMetadata[]
  @Input() events!: Event[];
  @Output() newEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() eventToDelete: EventEmitter<Event> = new EventEmitter<Event>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  rows: RowEntry[] = [];
  dataSource: MatTableDataSource<RowEntry> = new MatTableDataSource(this.rows);
  filterTypes: string[] = [];

  private receiverService = inject(ReceiverService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private eventService = inject(EventService);
  private viewService = inject(ViewService);

  currentUserId: string = '';

  // Modal state
  showModal = false;
  inputData = '';
  timestampValue = '';
  timeValue: Date | null = null;
  dateValue: Date | null = null;
  noteValue?: string;

  selectedEventType = '';
  selectedEventMetadata?: EventMetadata;

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

  constructor() {
    this.initializeCurrentUser();
  }

  private async initializeCurrentUser() {
    try {
      this.currentUserId = await this.authService.getCurrentUserId();
    } catch (error) {
      console.error('Error fetching current user ID:', error);
    }
  }

  ngOnInit() {
    this.configs[this.variant].initFunction();
  }

  initRecentActivity() {
    this.rows = this.eventTypes.map(meta => ({
      meta: meta,
      data: undefined,
      loggedUser: '',
      readableTimestamp: '',
      eventId: '',
      note: undefined,
    }));
    this.dataSource.data = this.rows;
  }

  initAllActivity() {
    this.filterTypes = this.eventTypes.map(meta => meta.type);
  }

  onFilterChange(selected: string[]) {
    this.filterTypes = selected;
    const filteredRows = this.rows.filter(row => this.filterTypes.includes(row.meta.type));
    this.dataSource.data = filteredRows;
  }

  ngAfterViewInit() {
    if (this.configs[this.variant].hasPaginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  isExpanded(row: RowEntry) {
    return this.expandedRow === row;
  }

  toggle(row: RowEntry) {
    this.expandedRow = this.isExpanded(row) ? null : row;
  }

  async ngOnChanges(changes: SimpleChanges) {
    this.configs[this.variant].onChangesFunction(changes);
  }

  private async updateRowsWithAllEvents(changes: SimpleChanges) {
    if (changes['events']) {
      const newRows: RowEntry[] = [];
      this.events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      for (const event of this.events) {
        const metadata = this.eventTypes.find(meta => meta.type === event.type)!
        const readableTimestamp = this.isMobile ? this.eventService.getCalendarTimestamp(event) : this.eventService.getReadableTimestamp(event);
        const loggedUser = await this.userService.getLoggedUser(event.userId);
        newRows.push({
          meta: metadata,
          data: event.data ? event.data[0] : undefined,
          loggedUser,
          readableTimestamp,
          eventId: event.eventId || '',
          note: event.note,
        });
      }

      this.rows = newRows;
      this.dataSource.data = this.rows;

      if (this.configs[this.variant].hasFilter) {
        const filteredRows = this.rows.filter(row => this.filterTypes.includes(row.meta.type));
        this.dataSource.data = filteredRows;
      }
    }
  }

  private async updateRowsWithLatestEvents(changes: SimpleChanges) {
    if (changes['events']) {
      for (let i = 0; i < this.eventTypes.length; i++) {
        const meta = this.eventTypes[i];
        const latestEvent = await this.getLatestEvent(meta);
        if (latestEvent) {
          this.rows[i].data = latestEvent.data;
          this.rows[i].loggedUser = latestEvent.loggedUser;
          this.rows[i].readableTimestamp = latestEvent.readableTimestamp;
          this.rows[i].eventId = latestEvent.eventId;
          this.rows[i].note = latestEvent.note;
        } else {
          this.rows[i].data = undefined;
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
      const readableTimestamp = this.isMobile ? this.eventService.getCalendarTimestamp(latestEvent) : this.eventService.getReadableTimestamp(latestEvent);
      const loggedUser = await this.userService.getLoggedUser(latestEvent.userId);
      return {
        meta: meta,
        data: latestEvent.data ? latestEvent.data[0] : undefined,
        loggedUser,
        readableTimestamp,
        eventId: latestEvent.eventId || '',
        note: latestEvent.note,
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
      this.addEvent(type, new Date().toISOString());
    }
  }
  onLogEvent() { this.openModal(); }
  closeModal() { this.resetModalState(); this.showModal = false; }
  openModal() { this.resetModalState(); this.showModal = true; }
  getMetadata(type: string) { this.selectedEventMetadata = this.eventTypes.find(event => event.type === type); }

  private resetModalState() {
    this.inputData = '';
    this.timestampValue = this.getLocaleDateTime();
    this.dateValue = new Date(this.timestampValue)
    this.timeValue = new Date(this.timestampValue);
    this.noteValue = undefined;
  }

  private getLocaleDateTime(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0] + 'T' + now.toTimeString().slice(0, 5);
  }

  submitEventAndAddAnother() {
    this.submitEvent();
    this.openModal();
  }

  submitEvent() {
    let timestamp = '';
    if (this.dateValue && this.timeValue) {
      this.dateValue.setHours(this.timeValue.getHours(), this.timeValue.getMinutes(), 0, 0);
      timestamp = this.dateValue.toISOString();
    } else {
      timestamp = new Date().toISOString();
    }
    this.addEvent(this.selectedEventType, timestamp, this.inputData, this.noteValue);
    this.closeModal();
  }

  private async addEvent(type: string, timestamp: string, datavalue?: string, note?: string) {
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

      const req: EventRequest = {
        receiverId: this.receiverService.currentReceiverId,
        userId: this.currentUserId,
        timestamp: timestamp,
        type: type,
        data: data,
        note: note,
      };

      const observable = await this.receiverService.addEvent(req);

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


