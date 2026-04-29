# Modal Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two duplicated inline add-event modals (in `quick-log` and `event-table`) and the limited `event-modal` with two focused, reusable components: `EventFormModalComponent` (create/edit) and `EventViewModalComponent` (view/edit-inline/delete-confirm).

**Architecture:** `EventFormModalComponent` encapsulates all event creation logic (multi-type select, date/time, dynamic fields, note, API call) and is dropped into `quick-log` and `event-table` in place of their duplicated inline modals. `EventViewModalComponent` replaces `event-modal` and manages three inline states — view, edit, delete-confirm — all within a single `care-modal` shell.

**Tech Stack:** Angular 17+ standalone components, Angular Material (mat-select, mat-datepicker, mat-timepicker, mat-form-field), FormsModule (ngModel), NX monorepo (`npx nx test care`).

---

## File Map

**Create:**
- `libs/care/src/lib/care/modal/event-form-modal/event-form-modal.component.ts`
- `libs/care/src/lib/care/modal/event-form-modal/event-form-modal.component.html`
- `libs/care/src/lib/care/modal/event-form-modal/event-form-modal.component.css`
- `libs/care/src/lib/care/modal/event-form-modal/event-form-modal.component.spec.ts`
- `libs/care/src/lib/care/modal/event-view-modal/event-view-modal.component.ts`
- `libs/care/src/lib/care/modal/event-view-modal/event-view-modal.component.html`
- `libs/care/src/lib/care/modal/event-view-modal/event-view-modal.component.css`
- `libs/care/src/lib/care/modal/event-view-modal/event-view-modal.component.spec.ts`

**Modify:**
- `libs/models/src/event.ts` — add `UpdateEventRequest`
- `libs/services/src/lib/receiver/receiver.service.ts` — add `updateEvent()`
- `libs/care/src/lib/care/quick-log/quick-log.component.ts`
- `libs/care/src/lib/care/quick-log/quick-log.component.html`
- `libs/care/src/lib/care/event-table/event-table.component.ts`
- `libs/care/src/lib/care/event-table/event-table.component.html`
- `libs/care/src/lib/care/pages/dashboard/dashboard.component.ts`
- `libs/care/src/lib/care/pages/dashboard/dashboard.component.html`
- `libs/care/src/lib/care/pages/stats/stats.component.ts`
- `libs/care/src/lib/care/pages/stats/stats.component.html`

**Delete:**
- `libs/care/src/lib/care/modal/event-modal/event-modal.component.ts`
- `libs/care/src/lib/care/modal/event-modal/event-modal.component.html`

---

## Task 1: Add UpdateEventRequest model and ReceiverService.updateEvent()

**Files:**
- Modify: `libs/models/src/event.ts`
- Modify: `libs/services/src/lib/receiver/receiver.service.ts`

- [ ] **Step 1: Add UpdateEventRequest to the models**

In `libs/models/src/event.ts`, add after the `EventRequest` interface:

```typescript
export interface UpdateEventRequest {
    receiverId: string;
    userId: string;
    eventId: string;
    startTime: string;
    endTime: string;
    type: string;
    data?: DataPoint[];
    note?: string;
}
```

- [ ] **Step 2: Export UpdateEventRequest from the models barrel**

Check `libs/models/src/index.ts` (or wherever models are re-exported). If `event.ts` is already re-exported via a wildcard, no change needed. If not, add `export * from './event'` or add `UpdateEventRequest` to the named exports.

Run: `npx nx build models` to confirm the export compiles.
Expected: Build succeeds with no errors.

- [ ] **Step 3: Add updateEvent() to ReceiverService**

In `libs/services/src/lib/receiver/receiver.service.ts`, add this import at the top alongside the existing imports:

```typescript
import { Event, Receiver, EventRequest, UpdateEventRequest } from '@care-giver-site/models';
```

Then add after the existing `deleteEvent` method (before `getEventsOfType`):

```typescript
updateEvent(request: UpdateEventRequest): Promise<Observable<any>> {
    return this.authService.getBearerToken().then((token) => {
        const headers: HttpHeaders = new HttpHeaders({ 'Authorization': token });
        const url = `/event/${encodeURIComponent(request.eventId)}`;
        const body = {
            receiverId: request.receiverId,
            userId: request.userId,
            startTime: formatRFC3339(request.startTime),
            endTime: formatRFC3339(request.endTime),
            type: request.type,
            data: request.data,
            note: request.note,
        };
        return this.http.put(url, body, { headers });
    });
}
```

- [ ] **Step 4: Verify the build compiles**

Run: `npx nx build care`
Expected: Build succeeds with no type errors.

- [ ] **Step 5: Commit**

```bash
git add libs/models/src/event.ts libs/services/src/lib/receiver/receiver.service.ts
git commit -m "feat: add UpdateEventRequest model and ReceiverService.updateEvent()"
```

---

## Task 2: Create EventFormModalComponent

**Files:**
- Create: `libs/care/src/lib/care/modal/event-form-modal/event-form-modal.component.spec.ts`
- Create: `libs/care/src/lib/care/modal/event-form-modal/event-form-modal.component.ts`
- Create: `libs/care/src/lib/care/modal/event-form-modal/event-form-modal.component.html`
- Create: `libs/care/src/lib/care/modal/event-form-modal/event-form-modal.component.css`

- [ ] **Step 1: Write the failing spec**

Create `libs/care/src/lib/care/modal/event-form-modal/event-form-modal.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventFormModalComponent } from './event-form-modal.component';
import { ReceiverService } from '@care-giver-site/services';
import { AuthService } from '@care-giver-site/services';
import { AlertService } from '@care-giver-site/services';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

const mockReceiverService = { currentReceiverId: 'r1', addEvent: jest.fn() };
const mockAuthService = { getCurrentUserId: jest.fn().mockResolvedValue('u1') };
const mockAlertService = { show: jest.fn() };

describe('EventFormModalComponent', () => {
  let component: EventFormModalComponent;
  let fixture: ComponentFixture<EventFormModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventFormModalComponent, NoopAnimationsModule],
      providers: [
        { provide: ReceiverService, useValue: mockReceiverService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AlertService, useValue: mockAlertService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventFormModalComponent);
    component = fixture.componentInstance;
    component.eventTypes = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with no selected event types when initialTypes is not set', () => {
    expect(component.selectedEventTypes).toEqual([]);
  });

  it('should pre-select initialTypes when show becomes true', () => {
    component.initialTypes = ['Medication'];
    component.show = true;
    component.ngOnChanges({
      show: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false }
    });
    expect(component.selectedEventTypes).toEqual(['Medication']);
  });

  it('should emit showChange(false) and submitted when submitEvent is called', async () => {
    const showChangeSpy = jest.spyOn(component.showChange, 'emit');
    const submittedSpy = jest.spyOn(component.submitted, 'emit');
    component.selectedEventTypes = [];
    await component.submitEvent();
    expect(showChangeSpy).toHaveBeenCalledWith(false);
    expect(submittedSpy).toHaveBeenCalled();
  });

  it('should emit showChange(false) when close() is called', () => {
    const spy = jest.spyOn(component.showChange, 'emit');
    component.close();
    expect(spy).toHaveBeenCalledWith(false);
  });
});
```

- [ ] **Step 2: Run the spec to confirm it fails**

Run: `npx nx test care --testPathPattern="event-form-modal"`
Expected: FAIL — `EventFormModalComponent` does not exist yet.

- [ ] **Step 3: Create the component TypeScript**

Create `libs/care/src/lib/care/modal/event-form-modal/event-form-modal.component.ts`:

```typescript
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

  private currentUserId = '';

  constructor() {
    this.authService.getCurrentUserId().then(id => (this.currentUserId = id));
  }

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
    for (const t of types) {
      if (!this.inputData[t]) this.inputData[t] = {};
    }
  }

  getMetadata(type: string): EventMetadata | undefined {
    return this.eventTypes.find(e => e.type === type);
  }

  async submitEvent() {
    let startTime: string;
    if (this.dateValue && this.timeValue) {
      const combined = new Date(this.dateValue);
      combined.setHours(this.timeValue.getHours(), this.timeValue.getMinutes(), 0, 0);
      startTime = combined.toISOString();
    } else {
      startTime = new Date().toISOString();
    }

    for (const type of this.selectedEventTypes) {
      await this.addEvent(type, startTime, this.inputData[type] ?? {}, this.noteValue);
    }
    this.close();
    this.submitted.emit();
  }

  close() {
    this.show = false;
    this.showChange.emit(false);
  }

  private async addEvent(
    type: string,
    startTime: string,
    fields: { [k: string]: string },
    note?: string,
  ) {
    const meta = this.getMetadata(type);
    if (!meta) return;

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
        next: () => this.alertService.show(`${type} logged`, AlertType.Success),
        error: () =>
          this.alertService.show('Error logging event. Please try again.', AlertType.Failure),
      });
    } catch {
      this.alertService.show('Error logging event. Please try again.', AlertType.Failure);
    }
  }

  private roundToNearest(date: Date, interval: number): Date {
    const ms = 1000 * 60 * interval;
    return new Date(Math.round(date.getTime() / ms) * ms);
  }
}
```

- [ ] **Step 4: Create the component template**

Create `libs/care/src/lib/care/modal/event-form-modal/event-form-modal.component.html`:

```html
<care-modal
  [show]="show"
  [header]="selectedEventTypes.length > 1 ? 'Add Events' : 'Add Event'"
  (close)="close()"
>
  <div modal-body class="form-body">
    <mat-form-field class="modal-full-width">
      <mat-label>Type</mat-label>
      <mat-select
        multiple
        [(ngModel)]="selectedEventTypes"
        (ngModelChange)="onEventTypeChange($event)"
      >
        @for (type of eventTypes; track type.type) {
          <mat-option [value]="type.type">{{ type.type }}</mat-option>
        }
      </mat-select>
    </mat-form-field>

    <mat-form-field class="modal-full-width">
      <mat-label>Date</mat-label>
      <input
        matInput
        [matDatepicker]="datePicker"
        [(ngModel)]="dateValue"
        placeholder="MM/DD/YYYY"
      />
      <mat-hint>MM/DD/YYYY</mat-hint>
      <mat-datepicker-toggle matIconSuffix [for]="datePicker"></mat-datepicker-toggle>
      <mat-datepicker #datePicker></mat-datepicker>
    </mat-form-field>

    <mat-form-field class="modal-full-width">
      <mat-label>Time</mat-label>
      <input
        matInput
        [matTimepicker]="timePicker"
        [(ngModel)]="timeValue"
        placeholder="HH:MM"
      />
      <mat-timepicker-toggle matIconSuffix [for]="timePicker"></mat-timepicker-toggle>
      <mat-timepicker #timePicker interval="10min"></mat-timepicker>
    </mat-form-field>

    @for (type of selectedEventTypes; track type) {
      @let fields = getMetadata(type)?.fields ?? [];
      @let dataConfig = getMetadata(type)?.data;
      @if (selectedEventTypes.length > 1) {
        <p class="type-section-label">{{ type }}</p>
      }
      @if (fields.length > 0) {
        @for (field of fields; track field.name) {
          @switch (field.inputType) {
            @case ('textarea') {
              <mat-form-field class="modal-full-width">
                <mat-label>{{ field.label }}</mat-label>
                <textarea
                  matInput
                  [(ngModel)]="inputData[type][field.name]"
                  [placeholder]="field.placeholder"
                  [required]="field.required"
                  rows="3"
                ></textarea>
              </mat-form-field>
            }
            @case ('date') {
              <mat-form-field class="modal-full-width">
                <mat-label>{{ field.label }}</mat-label>
                <input
                  matInput
                  [matDatepicker]="fieldDatePicker"
                  [(ngModel)]="inputData[type][field.name]"
                  [placeholder]="field.placeholder"
                />
                <mat-datepicker-toggle matIconSuffix [for]="fieldDatePicker"></mat-datepicker-toggle>
                <mat-datepicker #fieldDatePicker></mat-datepicker>
              </mat-form-field>
            }
            @default {
              <mat-form-field class="modal-full-width">
                <mat-label>{{ field.label }}</mat-label>
                <input
                  matInput
                  [(ngModel)]="inputData[type][field.name]"
                  [type]="field.inputType"
                  [placeholder]="field.placeholder"
                  [required]="field.required"
                />
              </mat-form-field>
            }
          }
        }
      } @else if (dataConfig) {
        <mat-form-field class="modal-full-width">
          <mat-label>{{ dataConfig.name }}</mat-label>
          <input
            matInput
            [(ngModel)]="inputData[type]['value']"
            type="number"
            [placeholder]="'Enter ' + dataConfig.name + ' (' + dataConfig.unit + ')'"
          />
        </mat-form-field>
      }
    }

    <mat-form-field class="modal-full-width">
      <mat-label>Optional Note</mat-label>
      <textarea
        matInput
        [(ngModel)]="noteValue"
        placeholder="Enter an optional note"
        maxlength="200"
        rows="3"
      ></textarea>
    </mat-form-field>
  </div>

  <div modal-footer>
    <button matButton="filled" class="modal-button" (click)="submitEvent()">
      @if (selectedEventTypes.length > 1) { Add Events } @else { Add Event }
    </button>
    <button matButton="filled" class="btn-secondary modal-button" (click)="close()">
      Cancel
    </button>
  </div>
</care-modal>
```

- [ ] **Step 5: Create the component CSS**

Create `libs/care/src/lib/care/modal/event-form-modal/event-form-modal.component.css`:

```css
.modal-full-width {
  width: 100%;
}

/* Mobile-first: scrollable body for tall forms */
.form-body {
  max-height: 60vh;
  overflow-y: auto;
}

.type-section-label {
  font-weight: var(--font-weight-medium);
  margin: var(--space-sm) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (min-width: 600px) {
  .form-body {
    max-height: 70vh;
  }
}
```

- [ ] **Step 6: Run the spec to confirm it passes**

Run: `npx nx test care --testPathPattern="event-form-modal"`
Expected: All 5 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add libs/care/src/lib/care/modal/event-form-modal/
git commit -m "feat: add EventFormModalComponent"
```

---

## Task 3: Migrate QuickLogComponent to EventFormModalComponent

**Files:**
- Modify: `libs/care/src/lib/care/quick-log/quick-log.component.ts`
- Modify: `libs/care/src/lib/care/quick-log/quick-log.component.html`

- [ ] **Step 1: Replace quick-log.component.ts**

Replace the entire file content of `libs/care/src/lib/care/quick-log/quick-log.component.ts`:

```typescript
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { ReceiverService, AuthService, AlertService } from '@care-giver-site/services';
import { EventMetadata, EventRequest, DataPoint, AlertType } from '@care-giver-site/models';
import { EventFormModalComponent } from '../modal/event-form-modal/event-form-modal.component';

@Component({
  selector: 'care-quick-log',
  imports: [EventFormModalComponent],
  templateUrl: './quick-log.component.html',
  styleUrl: './quick-log.component.css',
})
export class QuickLogComponent {
  @Input() eventTypes!: EventMetadata[];
  @Output() newEvent = new EventEmitter<void>();

  private receiverService = inject(ReceiverService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  showFormModal = false;
  initialTypes: string[] = [];

  private currentUserId = '';

  constructor() {
    this.authService.getCurrentUserId().then(id => (this.currentUserId = id));
  }

  get quickAddTypes(): EventMetadata[] {
    return this.eventTypes?.filter(e => e.hasQuickAdd) ?? [];
  }

  onButtonClick(meta: EventMetadata) {
    const needsModal = meta.data || (meta.fields && meta.fields.length > 0);
    if (needsModal) {
      this.initialTypes = [meta.type];
      this.showFormModal = true;
    } else {
      this.logEventNow(meta.type);
    }
  }

  private async logEventNow(type: string) {
    const metadata = this.eventTypes.find(e => e.type === type);
    if (!metadata) return;

    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + 30 * 60000).toISOString();

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
      data: [],
    };

    try {
      const obs = await this.receiverService.addEvent(req);
      obs.subscribe({
        next: () => {
          this.newEvent.emit();
          this.alertService.show(`${type} logged`, AlertType.Success);
        },
        error: () => this.alertService.show('Error logging event', AlertType.Failure),
      });
    } catch {
      this.alertService.show('Error logging event', AlertType.Failure);
    }
  }
}
```

- [ ] **Step 2: Replace quick-log.component.html**

Replace the entire file content of `libs/care/src/lib/care/quick-log/quick-log.component.html`:

```html
<div class="quick-log-card card">
  <h2 class="quick-log-title">Quick Log</h2>

  <div class="quick-log-grid">
    @for (meta of quickAddTypes; track meta.type) {
      <button
        class="quick-log-btn"
        type="button"
        [style.background-color]="meta.color.secondary"
        [style.border-color]="meta.color.primary"
        (click)="onButtonClick(meta)"
        [title]="meta.type"
      >
        <img class="quick-log-icon" [src]="meta.icon" [alt]="meta.type" />
        <span class="quick-log-label">{{ meta.type }}</span>
      </button>
    }
  </div>
</div>

<care-event-form-modal
  [eventTypes]="eventTypes"
  [initialTypes]="initialTypes"
  [(show)]="showFormModal"
  (submitted)="newEvent.emit()"
></care-event-form-modal>
```

- [ ] **Step 3: Verify the build compiles**

Run: `npx nx build care`
Expected: Build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add libs/care/src/lib/care/quick-log/
git commit -m "refactor: migrate quick-log to EventFormModalComponent"
```

---

## Task 4: Migrate EventTableComponent to EventFormModalComponent

**Files:**
- Modify: `libs/care/src/lib/care/event-table/event-table.component.ts`
- Modify: `libs/care/src/lib/care/event-table/event-table.component.html`

- [ ] **Step 1: Remove inline modal state and logic from event-table.component.ts**

In `libs/care/src/lib/care/event-table/event-table.component.ts`:

1. Remove these imports (no longer needed in the event-table):
   - `MatInputModule`, `MatFormFieldModule`, `MatDatepickerModule`, `MatNativeDateModule`, `MatTimepickerModule`, `MatChipsModule`, `MatChipInputEvent`, `MatAutocompleteModule`, `MatAutocompleteSelectedEvent`, `COMMA`, `ENTER`, `model`
   - `ModalComponent`
   - `FormsModule` (only needed for the filter chip autocomplete — keep if filter still uses ngModel)
   - `AuthService`, `AlertService` (only used for addEvent — keep if `onDeleteEvent` still emits to parent)

   Actually: keep `FormsModule`, `MatInputModule`, `MatFormFieldModule`, `MatChipsModule`, `MatChipInputEvent`, `MatAutocompleteModule`, `MatAutocompleteSelectedEvent`, `COMMA`, `ENTER`, `model` — these are all still used by the **filter chip** feature. Only remove the form-modal specific ones.

   Remove from imports array: `ModalComponent`, `MatDatepickerModule`, `MatNativeDateModule`, `MatTimepickerModule`
   Remove from class imports list: same four.

2. Remove these modal-related state fields:
   ```
   showModal
   inputData
   timestampValue
   timeValue
   dateValue
   noteValue
   selectedEventTypes
   ```

3. Remove these modal-related methods:
   ```
   onEventTypeChange()
   buildDataPoints()
   resetModalState()
   roundToNearestMinutes()
   getLocaleDateTime()
   submitEvent()
   addEvent()
   ```

4. Remove the `authService` and `alertService` injections (no longer used after removing addEvent).

5. Change `onQuickLogEvent` to use `showFormModal` and `initialTypesForModal`:
   ```typescript
   showFormModal = false;
   initialTypesForModal: string[] = [];

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

   closeFormModal() {
     this.showFormModal = false;
   }
   ```

6. Add a private `addEventNoModal` method for quick-add types that have no fields (reuses the same logic that was previously in `addEvent` but without the modal state):
   ```typescript
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
   ```

7. Add `EventFormModalComponent` to the component's imports array.
8. Keep `authService` and `alertService` injections since `addEventNoModal` uses them.
9. Add `EventRequest` to the model imports since `addEventNoModal` uses it.

The full replacement of `event-table.component.ts` after these changes:

```typescript
import { Component, OnInit, OnChanges, Input, SimpleChanges, inject, Output, EventEmitter, ViewChild, AfterViewInit, computed, model, signal } from '@angular/core';
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
```

- [ ] **Step 2: Update event-table.component.html**

Replace the `<care-modal>` block at the bottom of `libs/care/src/lib/care/event-table/event-table.component.html` (lines 173–301) with:

```html
<care-event-form-modal
  [eventTypes]="eventTypes"
  [initialTypes]="initialTypesForModal"
  [(show)]="showFormModal"
  (submitted)="newEvent.emit()"
></care-event-form-modal>
```

The rest of the template (the table, filter chip, paginator) stays unchanged.

- [ ] **Step 3: Verify the build compiles**

Run: `npx nx build care`
Expected: Build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add libs/care/src/lib/care/event-table/
git commit -m "refactor: migrate event-table to EventFormModalComponent"
```

---

## Task 5: Create EventViewModalComponent (view + delete-confirm states)

**Files:**
- Create: `libs/care/src/lib/care/modal/event-view-modal/event-view-modal.component.spec.ts`
- Create: `libs/care/src/lib/care/modal/event-view-modal/event-view-modal.component.ts`
- Create: `libs/care/src/lib/care/modal/event-view-modal/event-view-modal.component.html`
- Create: `libs/care/src/lib/care/modal/event-view-modal/event-view-modal.component.css`

- [ ] **Step 1: Write the failing spec**

Create `libs/care/src/lib/care/modal/event-view-modal/event-view-modal.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventViewModalComponent } from './event-view-modal.component';
import { ReceiverService, AuthService, AlertService, UserService, EventService } from '@care-giver-site/services';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Event } from '@care-giver-site/models';

const mockEvent: Event = {
  receiverId: 'r1',
  eventId: 'e1',
  userId: 'u1',
  startTime: new Date().toISOString(),
  endTime: new Date().toISOString(),
  type: 'Medication',
  data: [],
};

const mockReceiverService = {
  currentReceiverId: 'r1',
  deleteEvent: jest.fn().mockResolvedValue({ subscribe: jest.fn() }),
  updateEvent: jest.fn().mockResolvedValue({ subscribe: jest.fn() }),
};
const mockAuthService = { getCurrentUserId: jest.fn().mockResolvedValue('u1') };
const mockAlertService = { show: jest.fn() };
const mockUserService = { getLoggedUser: jest.fn().mockResolvedValue('Jane Doe') };
const mockEventService = {
  getReadableTimestamp: jest.fn().mockReturnValue('Today at 10:00 AM'),
  getEventConfigs: jest.fn().mockReturnValue([]),
};

describe('EventViewModalComponent', () => {
  let component: EventViewModalComponent;
  let fixture: ComponentFixture<EventViewModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventViewModalComponent, NoopAnimationsModule],
      providers: [
        { provide: ReceiverService, useValue: mockReceiverService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AlertService, useValue: mockAlertService },
        { provide: UserService, useValue: mockUserService },
        { provide: EventService, useValue: mockEventService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventViewModalComponent);
    component = fixture.componentInstance;
    component.event = mockEvent;
    component.eventTypes = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start in view state', () => {
    expect(component.state).toBe('view');
  });

  it('should transition to delete-confirm state when startDeleteConfirm() is called', () => {
    component.startDeleteConfirm();
    expect(component.state).toBe('delete-confirm');
  });

  it('should return to view state when cancelAction() is called from delete-confirm', () => {
    component.startDeleteConfirm();
    component.cancelAction();
    expect(component.state).toBe('view');
  });

  it('should transition to edit state when startEdit() is called', () => {
    component.startEdit();
    expect(component.state).toBe('edit');
  });

  it('should return to view state when cancelAction() is called from edit', () => {
    component.startEdit();
    component.cancelAction();
    expect(component.state).toBe('view');
  });

  it('should reset to view state when a new event is passed in', async () => {
    component.startDeleteConfirm();
    component.event = { ...mockEvent, eventId: 'e2' };
    await component.ngOnChanges({
      event: { currentValue: component.event, previousValue: mockEvent, firstChange: false, isFirstChange: () => false }
    });
    expect(component.state).toBe('view');
  });

  it('should emit showChange(false) when close() is called', () => {
    const spy = jest.spyOn(component.showChange, 'emit');
    component.close();
    expect(spy).toHaveBeenCalledWith(false);
  });
});
```

- [ ] **Step 2: Run the spec to confirm it fails**

Run: `npx nx test care --testPathPattern="event-view-modal"`
Expected: FAIL — `EventViewModalComponent` does not exist yet.

- [ ] **Step 3: Create the component TypeScript**

Create `libs/care/src/lib/care/modal/event-view-modal/event-view-modal.component.ts`:

```typescript
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
import { ReceiverService, AuthService, AlertService, UserService, EventService } from '@care-giver-site/services';
import { Event, EventMetadata, DataPoint, AlertType, UpdateEventRequest } from '@care-giver-site/models';

export type ViewState = 'view' | 'edit' | 'delete-confirm';

@Component({
  selector: 'care-event-view-modal',
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
  templateUrl: './event-view-modal.component.html',
  styleUrl: './event-view-modal.component.css',
})
export class EventViewModalComponent implements OnChanges {
  @Input() event!: Event;
  @Input() eventTypes: EventMetadata[] = [];
  @Input() show = false;
  @Output() showChange = new EventEmitter<boolean>();
  @Output() eventChange = new EventEmitter<void>();

  private eventService = inject(EventService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private receiverService = inject(ReceiverService);
  private alertService = inject(AlertService);

  state: ViewState = 'view';

  loggedUser = '';
  readableTimestamp = '';
  dataPoints: DataPoint[] = [];

  editType = '';
  editDate: Date | null = null;
  editTime: Date | null = null;
  editInputData: { [field: string]: string } = {};
  editNote?: string;

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['event'] && this.event) {
      this.state = 'view';
      this.loggedUser = await this.userService.getLoggedUser(this.event.userId);
      this.readableTimestamp = this.eventService.getReadableTimestamp(this.event);
      this.dataPoints = this.event.data ?? [];
    }
  }

  get modalHeader(): string {
    switch (this.state) {
      case 'edit': return 'Edit Event';
      case 'delete-confirm': return 'Delete Event?';
      default: return 'Event Details';
    }
  }

  getMetadata(type: string): EventMetadata | undefined {
    return this.eventTypes.find(e => e.type === type);
  }

  getFieldLabel(name: string): string {
    return this.getMetadata(this.event.type)?.fields?.find(f => f.name === name)?.label ?? name;
  }

  getFieldUnit(name: string): string {
    const meta = this.getMetadata(this.event.type);
    return meta?.data?.name === name ? (meta.data.unit ?? '') : '';
  }

  startEdit() {
    this.editType = this.event.type;
    const start = new Date(this.event.startTime);
    this.editDate = new Date(start);
    this.editTime = new Date(start);
    this.editInputData = {};
    for (const dp of this.event.data ?? []) {
      this.editInputData[dp.name] = dp.value;
    }
    this.editNote = this.event.note;
    this.state = 'edit';
  }

  onEditTypeChange() {
    this.editInputData = {};
  }

  startDeleteConfirm() {
    this.state = 'delete-confirm';
  }

  cancelAction() {
    this.state = 'view';
  }

  close() {
    this.show = false;
    this.showChange.emit(false);
    this.state = 'view';
  }

  async saveEdit() {
    let startTime: string;
    if (this.editDate && this.editTime) {
      const combined = new Date(this.editDate);
      combined.setHours(this.editTime.getHours(), this.editTime.getMinutes(), 0, 0);
      startTime = combined.toISOString();
    } else {
      startTime = this.event.startTime;
    }

    const meta = this.getMetadata(this.editType);
    let data: DataPoint[] = [];
    if (meta?.fields?.length) {
      data = Object.entries(this.editInputData)
        .filter(([, v]) => v?.trim())
        .map(([name, value]) => ({ name, value }));
    } else if (meta?.data && this.editInputData['value']) {
      data = [{ name: meta.data.name, value: this.editInputData['value'] }];
    }

    const durationMins =
      meta?.data?.unit === 'Mins' && this.editInputData['value']
        ? parseFloat(this.editInputData['value'])
        : 30;
    const endTime = new Date(new Date(startTime).getTime() + durationMins * 60000).toISOString();

    const currentUserId = await this.authService.getCurrentUserId();

    const req: UpdateEventRequest = {
      receiverId: this.receiverService.currentReceiverId!,
      userId: currentUserId,
      eventId: this.event.eventId,
      startTime,
      endTime,
      type: this.editType,
      data,
      note: this.editNote,
    };

    try {
      const obs = await this.receiverService.updateEvent(req);
      obs.subscribe({
        next: () => {
          this.alertService.show('Event updated', AlertType.Success);
          this.eventChange.emit();
          this.state = 'view';
        },
        error: () =>
          this.alertService.show('Error updating event. Please try again.', AlertType.Failure),
      });
    } catch {
      this.alertService.show('Error updating event. Please try again.', AlertType.Failure);
    }
  }

  async confirmDelete() {
    const currentUserId = await this.authService.getCurrentUserId();
    try {
      const obs = await this.receiverService.deleteEvent(
        this.receiverService.currentReceiverId!,
        currentUserId,
        this.event.eventId,
      );
      obs.subscribe({
        next: () => {
          this.alertService.show('Event deleted', AlertType.Success);
          this.eventChange.emit();
          this.close();
        },
        error: () =>
          this.alertService.show('Error deleting event. Please try again.', AlertType.Failure),
      });
    } catch {
      this.alertService.show('Error deleting event. Please try again.', AlertType.Failure);
    }
  }
}
```

- [ ] **Step 4: Create the component template**

Create `libs/care/src/lib/care/modal/event-view-modal/event-view-modal.component.html`:

```html
<care-modal [show]="show" [header]="modalHeader" (close)="close()">
  <div modal-body class="view-modal-body">
    @switch (state) {
      @case ('view') {
        <div class="detail-row"><strong>Event:</strong> {{ event.type }}</div>
        <div class="detail-row"><strong>Logged By:</strong> {{ loggedUser }}</div>
        <div class="detail-row"><strong>Time:</strong> {{ readableTimestamp }}</div>
        @for (point of dataPoints; track point.name) {
          <div class="detail-row">
            <strong>{{ getFieldLabel(point.name) }}:</strong>
            {{ point.value }}{{ getFieldUnit(point.name) ? ' ' + getFieldUnit(point.name) : '' }}
          </div>
        }
        @if (event.note) {
          <div class="detail-row"><strong>Note:</strong> {{ event.note }}</div>
        }
      }

      @case ('edit') {
        <mat-form-field class="modal-full-width">
          <mat-label>Type</mat-label>
          <mat-select [(ngModel)]="editType" (ngModelChange)="onEditTypeChange()">
            @for (t of eventTypes; track t.type) {
              <mat-option [value]="t.type">{{ t.type }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field class="modal-full-width">
          <mat-label>Date</mat-label>
          <input
            matInput
            [matDatepicker]="editDatePicker"
            [(ngModel)]="editDate"
            placeholder="MM/DD/YYYY"
          />
          <mat-hint>MM/DD/YYYY</mat-hint>
          <mat-datepicker-toggle matIconSuffix [for]="editDatePicker"></mat-datepicker-toggle>
          <mat-datepicker #editDatePicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field class="modal-full-width">
          <mat-label>Time</mat-label>
          <input
            matInput
            [matTimepicker]="editTimePicker"
            [(ngModel)]="editTime"
            placeholder="HH:MM"
          />
          <mat-timepicker-toggle matIconSuffix [for]="editTimePicker"></mat-timepicker-toggle>
          <mat-timepicker #editTimePicker interval="10min"></mat-timepicker>
        </mat-form-field>

        @let editFields = getMetadata(editType)?.fields ?? [];
        @let editDataConfig = getMetadata(editType)?.data;
        @if (editFields.length > 0) {
          @for (field of editFields; track field.name) {
            @switch (field.inputType) {
              @case ('textarea') {
                <mat-form-field class="modal-full-width">
                  <mat-label>{{ field.label }}</mat-label>
                  <textarea
                    matInput
                    [(ngModel)]="editInputData[field.name]"
                    [placeholder]="field.placeholder"
                    [required]="field.required"
                    rows="3"
                  ></textarea>
                </mat-form-field>
              }
              @case ('date') {
                <mat-form-field class="modal-full-width">
                  <mat-label>{{ field.label }}</mat-label>
                  <input
                    matInput
                    [matDatepicker]="editFieldDatePicker"
                    [(ngModel)]="editInputData[field.name]"
                    [placeholder]="field.placeholder"
                  />
                  <mat-datepicker-toggle matIconSuffix [for]="editFieldDatePicker"></mat-datepicker-toggle>
                  <mat-datepicker #editFieldDatePicker></mat-datepicker>
                </mat-form-field>
              }
              @default {
                <mat-form-field class="modal-full-width">
                  <mat-label>{{ field.label }}</mat-label>
                  <input
                    matInput
                    [(ngModel)]="editInputData[field.name]"
                    [type]="field.inputType"
                    [placeholder]="field.placeholder"
                    [required]="field.required"
                  />
                </mat-form-field>
              }
            }
          }
        } @else if (editDataConfig) {
          <mat-form-field class="modal-full-width">
            <mat-label>{{ editDataConfig.name }}</mat-label>
            <input
              matInput
              [(ngModel)]="editInputData['value']"
              type="number"
              [placeholder]="'Enter ' + editDataConfig.name + ' (' + editDataConfig.unit + ')'"
            />
          </mat-form-field>
        }

        <mat-form-field class="modal-full-width">
          <mat-label>Optional Note</mat-label>
          <textarea
            matInput
            [(ngModel)]="editNote"
            placeholder="Enter an optional note"
            maxlength="200"
            rows="3"
          ></textarea>
        </mat-form-field>
      }

      @case ('delete-confirm') {
        <p class="confirm-message">Are you sure you want to delete this event?</p>
        <div class="detail-row"><strong>Event:</strong> {{ event.type }}</div>
        <div class="detail-row"><strong>Time:</strong> {{ readableTimestamp }}</div>
      }
    }
  </div>

  <div modal-footer>
    @switch (state) {
      @case ('view') {
        <button matButton="filled" class="modal-button" (click)="startEdit()">Edit</button>
        <button matButton="filled" class="btn-danger modal-button" (click)="startDeleteConfirm()">
          Delete
        </button>
      }
      @case ('edit') {
        <button matButton="filled" class="modal-button" (click)="saveEdit()">Save</button>
        <button matButton="filled" class="btn-secondary modal-button" (click)="cancelAction()">
          Cancel
        </button>
      }
      @case ('delete-confirm') {
        <button matButton="filled" class="btn-danger modal-button" (click)="confirmDelete()">
          Confirm Delete
        </button>
        <button matButton="filled" class="btn-secondary modal-button" (click)="cancelAction()">
          Cancel
        </button>
      }
    }
  </div>
</care-modal>
```

- [ ] **Step 5: Create the component CSS**

Create `libs/care/src/lib/care/modal/event-view-modal/event-view-modal.component.css`:

```css
.modal-full-width {
  width: 100%;
}

/* Mobile-first: scrollable body for edit form */
.view-modal-body {
  max-height: 60vh;
  overflow-y: auto;
}

.detail-row {
  margin-bottom: var(--space-sm);
  line-height: 1.5;
}

.confirm-message {
  margin: 0 0 var(--space-md);
  color: var(--color-text-primary);
}

@media (min-width: 600px) {
  .view-modal-body {
    max-height: 70vh;
  }
}
```

- [ ] **Step 6: Run the spec to confirm it passes**

Run: `npx nx test care --testPathPattern="event-view-modal"`
Expected: All 8 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add libs/care/src/lib/care/modal/event-view-modal/
git commit -m "feat: add EventViewModalComponent with view, edit, and delete-confirm states"
```

---

## Task 6: Migrate DashboardComponent and StatsComponent

**Files:**
- Modify: `libs/care/src/lib/care/pages/dashboard/dashboard.component.ts`
- Modify: `libs/care/src/lib/care/pages/dashboard/dashboard.component.html`
- Modify: `libs/care/src/lib/care/pages/stats/stats.component.ts`
- Modify: `libs/care/src/lib/care/pages/stats/stats.component.html`

- [ ] **Step 1: Update dashboard.component.ts**

In `libs/care/src/lib/care/pages/dashboard/dashboard.component.ts`:

1. Replace `import { EventModalComponent }` with `import { EventViewModalComponent }`.
2. In the `imports` array, replace `EventModalComponent` with `EventViewModalComponent`.
3. Remove the `eventAction` field.
4. Simplify both handler methods:

```typescript
// Remove this field:
// eventAction: 'create' | 'update' | 'delete' | 'view' = 'view';

handleDeleteEvent(event: Event) {
  this.selectedEvent = event;
  this.showEventModal = true;
}

handleViewEvent(event: Event) {
  this.selectedEvent = event;
  this.showEventModal = true;
}
```

- [ ] **Step 2: Update dashboard.component.html**

In `libs/care/src/lib/care/pages/dashboard/dashboard.component.html`, replace the `<care-event-modal>` block:

```html
@if (selectedEvent){
<care-event-view-modal
  [event]="selectedEvent"
  [eventTypes]="eventTypes"
  [(show)]="showEventModal"
  (eventChange)="getLatestEvents()"
></care-event-view-modal>
}
```

- [ ] **Step 3: Update stats.component.ts**

In `libs/care/src/lib/care/pages/stats/stats.component.ts`:

1. Replace `import { EventModalComponent }` with `import { EventViewModalComponent }`.
2. In the `imports` array, replace `EventModalComponent` with `EventViewModalComponent`.
3. Remove the `eventAction` field.
4. Simplify both handler methods to just set the event and show the modal (same as dashboard above).

- [ ] **Step 4: Update stats.component.html**

In `libs/care/src/lib/care/pages/stats/stats.component.html`, replace the `<care-event-modal>` block:

```html
@if (selectedEvent){
<care-event-view-modal
  [event]="selectedEvent"
  [eventTypes]="eventTypes"
  [(show)]="showEventModal"
  (eventChange)="getLatestEvents()"
></care-event-view-modal>
}
```

- [ ] **Step 5: Verify the build compiles**

Run: `npx nx build care`
Expected: Build succeeds with no type errors.

- [ ] **Step 6: Commit**

```bash
git add libs/care/src/lib/care/pages/dashboard/ libs/care/src/lib/care/pages/stats/
git commit -m "refactor: migrate dashboard and stats to EventViewModalComponent"
```

---

## Task 7: Delete EventModalComponent

**Files:**
- Delete: `libs/care/src/lib/care/modal/event-modal/event-modal.component.ts`
- Delete: `libs/care/src/lib/care/modal/event-modal/event-modal.component.html`

- [ ] **Step 1: Delete the event-modal files**

```bash
rm libs/care/src/lib/care/modal/event-modal/event-modal.component.ts
rm libs/care/src/lib/care/modal/event-modal/event-modal.component.html
rmdir libs/care/src/lib/care/modal/event-modal
```

- [ ] **Step 2: Verify nothing still imports event-modal**

```bash
grep -r "event-modal\|EventModalComponent" libs/ --include="*.ts" --include="*.html"
```

Expected: No output. If any files appear, update them to use `EventViewModalComponent`.

- [ ] **Step 3: Verify the full build passes**

Run: `npx nx build care`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Run all care tests**

Run: `npx nx test care`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: delete EventModalComponent, replaced by EventViewModalComponent"
```
