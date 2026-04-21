import { Component, OnInit, OnChanges, Input, SimpleChanges, inject, Output, EventEmitter, ViewChild, AfterViewInit, computed, model, signal } from '@angular/core';
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
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

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
    MatTimepickerModule,
    MatAutocompleteModule
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
  filteredTypes: string[] = [];

  private receiverService = inject(ReceiverService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private eventService = inject(EventService);
  private viewService = inject(ViewService);

  currentUserId = '';

  // Modal state
  showModal = false;
  inputData: { [eventType: string]: { [fieldName: string]: string } } = {};
  timestampValue = '';
  timeValue: Date | null = null;
  dateValue: Date | null = null;
  noteValue?: string;

  selectedEventTypes: string[] = [];

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
      dataPoints: [],
      loggedUser: '',
      readableTimestamp: '',
      eventId: '',
      note: undefined,
    }));
    this.dataSource.data = this.rows;
  }

  initAllActivity() {
    //this.filteredTypes = this.eventTypes.map(meta => meta.type);
  }

  onFilterChange() {
    if (this.filteredTypes.length) {
      const filteredRows = this.rows.filter(row => this.filteredTypes.includes(row.meta.type));
      this.dataSource.data = filteredRows;
    } else {
      this.dataSource.data = this.rows;
    }
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
      this.events.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      for (const event of this.events) {
        const metadata = this.eventTypes.find(meta => meta.type === event.type)!
        const readableTimestamp = this.isMobile ? this.eventService.getCalendarTimestamp(event) : this.eventService.getReadableTimestamp(event);
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
        const filteredRows = this.rows.filter(row => this.filteredTypes.includes(row.meta.type));
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
      const readableTimestamp = this.isMobile ? this.eventService.getCalendarTimestamp(latestEvent) : this.eventService.getReadableTimestamp(latestEvent);
      const loggedUser = await this.userService.getLoggedUser(latestEvent.userId);
      return {
        meta: meta,
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
    this.selectedEventTypes = [type];
    const metadata = this.getMetadata(type);
    if (metadata?.data || (metadata?.fields && metadata.fields.length > 0)) {
      this.openModal();
    } else {
      this.addEvent(type, new Date().toISOString());
    }
  }
  onLogEvent() { this.openModal(); }
  closeModal() { this.resetModalState(); this.showModal = false; this.selectedEventTypes = []; }
  openModal() { this.resetModalState(); this.showModal = true; }
  getMetadata(type: string): EventMetadata | undefined { return this.eventTypes.find(event => event.type === type); }
  getDataConfig(type: string): { name: string; unit: string } | undefined { return this.getMetadata(type)?.data; }
  getFieldLabel(type: string, name: string): string {
    const meta = this.getMetadata(type);
    return meta?.fields?.find(f => f.name === name)?.label ?? name;
  }
  getFieldUnit(type: string, name: string): string {
    const meta = this.getMetadata(type);
    return meta?.data?.name === name ? (meta.data.unit ?? '') : '';
  }

  onEventTypeChange(types: string[]) {
    this.selectedEventTypes = types;
    for (const type of types) {
      if (!this.inputData[type]) {
        this.inputData[type] = {};
      }
    }
  }

  private buildDataPoints(fieldValues: { [key: string]: string }): DataPoint[] {
    return Object.entries(fieldValues)
      .filter(([, v]) => v?.trim())
      .map(([name, value]) => ({ name, value }));
  }

  private resetModalState() {
    this.inputData = {};
    for (const type of this.selectedEventTypes) {
      this.inputData[type] = {};
    }
    this.timestampValue = this.getLocaleDateTime();
    this.dateValue = new Date(this.timestampValue);
    this.timeValue = this.roundToNearestMinutes(new Date(), 10);
    this.noteValue = undefined;
  }

  private roundToNearestMinutes(date: Date, interval: number): Date {
    const ms = 1000 * 60 * interval;
    return new Date(Math.round(date.getTime() / ms) * ms);
  }

  private getLocaleDateTime(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0] + 'T' + now.toTimeString().slice(0, 5);
  }

  submitEvent() {
    let startTime = '';
    if (this.dateValue && this.timeValue) {
      this.dateValue.setHours(this.timeValue.getHours(), this.timeValue.getMinutes(), 0, 0);
      startTime = this.dateValue.toISOString();
    } else {
      startTime = new Date().toISOString();
    }
    for (const type of this.selectedEventTypes) {
      this.addEvent(type, startTime, this.inputData[type] ?? {}, this.noteValue);
    }
    this.closeModal();
  }

  private async addEvent(type: string, startTime: string, fieldValues: { [key: string]: string } = {}, note?: string) {
    let data: DataPoint[] = [];
    const metadata = this.getMetadata(type);
    if (metadata?.fields && metadata.fields.length > 0) {
      data = this.buildDataPoints(fieldValues);
    } else if (metadata?.data && fieldValues['value']) {
      data = [{ name: metadata.data.name, value: fieldValues['value'] }];
    }

    const endTime = new Date(new Date(startTime).getTime() + 30 * 60 * 1000).toISOString();

    try {
      if (!this.receiverService.currentReceiverId) {
        this.alertService.show('No receiver selected. Please select a receiver before adding an event.', AlertType.Failure);
        return;
      }

      const req: EventRequest = {
        receiverId: this.receiverService.currentReceiverId,
        userId: this.currentUserId,
        startTime: startTime,
        endTime: endTime,
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


  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly currentType = model('');
  get filteredAvailableTypes(): string[] {
    const input = this.currentType().toLowerCase();
    return this.availableTypes.filter(type =>
      type.toLowerCase().includes(input)
    );
  }

  get availableTypes(): string[] {
    return this.eventTypes
      .map(e => e.type)
      .filter(type => !this.filteredTypes.includes(type));
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


