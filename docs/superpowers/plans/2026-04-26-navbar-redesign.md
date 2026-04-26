# Navbar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the per-page navbar + receiver-selection row with a unified shell: a slide-in drawer on mobile and a persistent sidebar on desktop, with a receiver section at the sidebar bottom and a FAB for logging events from any page.

**Architecture:** A new `ShellComponent` wraps all authenticated routes via `MatSidenavContainer`. It owns the top bar (hamburger/logo/user), the sidenav (nav links + receiver section), and the FAB. Pages become pure content components — they no longer embed the navbar or receiver-selection. Reactive subjects on `ReceiverService` allow pages to reload data when the receiver changes or a new event is added.

**Tech Stack:** Angular 20, Angular Material 20 (`MatSidenavModule`, `MatMenuModule`, `MatButtonModule`, `MatIconModule`), Angular CDK `BreakpointObserver`, RxJS `Subject`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `libs/services/src/lib/receiver/receiver.service.ts` | Add `receiverChanged$` and `eventAdded$` subjects |
| Modify | `libs/care/src/lib/care/navbar/navbar.component.ts` | Top bar only: hamburger toggle output, logo, user avatar + sign-out menu |
| Modify | `libs/care/src/lib/care/navbar/navbar.component.html` | Remove nav links; add hamburger button |
| Modify | `libs/care/src/lib/care/navbar/navbar.component.css` | Mobile-only hamburger visibility |
| Modify | `libs/care/src/lib/care/receiver-selection/receiver-selection.component.html` | New sidebar-style "Caring for" UI |
| Modify | `libs/care/src/lib/care/receiver-selection/receiver-selection.component.css` | Sidebar receiver styles |
| Create | `libs/care/src/lib/care/shell/shell.component.ts` | App shell — sidenav, nav links, FAB, quick-log host |
| Create | `libs/care/src/lib/care/shell/shell.component.html` | Shell template |
| Create | `libs/care/src/lib/care/shell/shell.component.css` | Shell styles |
| Create | `libs/care/src/lib/care/shell/shell.component.spec.ts` | Shell smoke test |
| Modify | `libs/care/src/lib/care/pages/dashboard/dashboard.component.ts` | Subscribe to service subjects; remove receiver change handler |
| Modify | `libs/care/src/lib/care/pages/dashboard/dashboard.component.html` | Remove `<care-navbar>` and `<care-receiver-selection>` |
| Modify | `libs/care/src/lib/care/pages/stats/stats.component.ts` | Same receiver-change pattern as dashboard |
| Modify | `libs/care/src/lib/care/pages/stats/stats.component.html` | Remove `<care-navbar>` and `<care-receiver-selection>` |
| Modify | `libs/care/src/lib/care/pages/feedback/feedback.component.ts` | Remove NavbarComponent import |
| Modify | `libs/care/src/lib/care/pages/feedback/feedback.component.html` | Remove `<care-navbar>` |
| Modify | `libs/care/src/index.ts` | Export ShellComponent |
| Modify | `apps/care-giver-site/src/app/app.routes.ts` | Nest authenticated routes under ShellComponent |

---

## Task 1: Add reactive subjects to ReceiverService

Pages currently reload data by listening to an `@Output()` event emitter on `ReceiverSelectionComponent`. Once the receiver selection moves into the shell, pages need a service-level signal instead.

**Files:**
- Modify: `libs/services/src/lib/receiver/receiver.service.ts`

- [ ] **Step 1.1: Write the failing test**

Add a new describe block to a test file. Create `libs/services/src/lib/receiver/receiver.service.spec.ts` if it does not exist.

```typescript
// libs/services/src/lib/receiver/receiver.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReceiverService } from './receiver.service';

describe('ReceiverService reactive subjects', () => {
  let service: ReceiverService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReceiverService],
    });
    service = TestBed.inject(ReceiverService);
  });

  it('emits receiverChanged$ when setCurrentReceiver is called', (done) => {
    service.receiverChanged$.subscribe(() => done());
    service.setCurrentReceiver('receiver-1');
  });

  it('emits eventAdded$ when notifyEventAdded is called', (done) => {
    service.eventAdded$.subscribe(() => done());
    service.notifyEventAdded();
  });
});
```

- [ ] **Step 1.2: Run tests to confirm they fail**

```bash
cd care-giver-site && npx nx test services --testFile=libs/services/src/lib/receiver/receiver.service.spec.ts
```

Expected: FAIL — `receiverChanged$` and `notifyEventAdded` do not exist.

- [ ] **Step 1.3: Add subjects to ReceiverService**

```typescript
// libs/services/src/lib/receiver/receiver.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Event, Receiver, EventRequest } from '@care-giver-site/models';
import { AuthService } from '../auth/auth.service';
import { Observable, firstValueFrom, Subject } from 'rxjs';
import { formatRFC3339 } from 'date-fns';

@Injectable({
    providedIn: 'root'
})
export class ReceiverService {
    currentReceiverId: string | undefined;

    readonly receiverChanged$ = new Subject<void>();
    readonly eventAdded$ = new Subject<void>();

    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) {
        const storedReceiverId = localStorage.getItem('currentReceiverId');
        if (storedReceiverId) {
            this.currentReceiverId = storedReceiverId;
        }
    }

    setCurrentReceiver(receiverId: string) {
        this.currentReceiverId = receiverId;
        localStorage.setItem('currentReceiverId', receiverId);
        this.receiverChanged$.next();
    }

    notifyEventAdded() {
        this.eventAdded$.next();
    }

    // ... all other existing methods unchanged ...
    async getReceivers(userId: string, receiverIds: string[]): Promise<Receiver[]> {
        const receiverPromises = receiverIds.map(id =>
            this.getReceiver(id, userId).then(obs => firstValueFrom(obs))
        );
        return Promise.all(receiverPromises);
    }

    getReceiver(receiverId: string, userId: string): Promise<Observable<Receiver>> {
        const cacheKey = `receiverCache_${receiverId}_${userId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const receiver: Receiver = JSON.parse(cached);
                return Promise.resolve(new Observable<Receiver>(subscriber => {
                    subscriber.next(receiver);
                    subscriber.complete();
                }));
            } catch {
                localStorage.removeItem(cacheKey);
            }
        }
        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({ 'Authorization': token });
            const url = `/receiver/${encodeURIComponent(receiverId)}?userId=${encodeURIComponent(userId)}`;
            const obs = this.http.get<Receiver>(url, { headers });
            obs.subscribe({
                next: (receiver) => {
                    localStorage.setItem(cacheKey, JSON.stringify(receiver));
                }
            });
            return obs;
        });
    }

    getReceiverEvents(receiverId: string, userId: string, startTime?: string, endTime?: string): Promise<Observable<Event[]>> {
        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({ 'Authorization': token });
            let url = `/events/${encodeURIComponent(receiverId)}?userId=${encodeURIComponent(userId)}`;
            if (startTime && endTime) {
                url += `&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
            }
            return this.http.get<Event[]>(url, { headers });
        });
    }

    addEvent(eventRequest: EventRequest): Promise<Observable<any>> {
        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({ 'Authorization': token });
            eventRequest.startTime = formatRFC3339(eventRequest.startTime);
            eventRequest.endTime = formatRFC3339(eventRequest.endTime);
            return this.http.post(`/event`, eventRequest, { headers });
        });
    }

    deleteEvent(receiverId: string, userId: string, eventId: string): Promise<Observable<any>> {
        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({ 'Authorization': token });
            const url = `/event/${encodeURIComponent(eventId)}?userId=${encodeURIComponent(userId)}&receiverId=${encodeURIComponent(receiverId)}`;
            return this.http.delete(url, { headers });
        });
    }

    getEventsOfType(event: Event[], type: string): Event[] {
        return event
            .filter(e => e.type === type)
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    }
}
```

- [ ] **Step 1.4: Run tests to confirm they pass**

```bash
npx nx test services --testFile=libs/services/src/lib/receiver/receiver.service.spec.ts
```

Expected: PASS

- [ ] **Step 1.5: Commit**

```bash
git add libs/services/src/lib/receiver/receiver.service.ts libs/services/src/lib/receiver/receiver.service.spec.ts
git commit -m "feat(services): add receiverChanged$ and eventAdded$ subjects to ReceiverService"
```

---

## Task 2: Refactor NavbarComponent to top-bar only

Remove nav links and receiver-selection from the top bar. The navbar now does: hamburger toggle output (consumed by the shell), logo, and user-avatar sign-out menu.

**Files:**
- Modify: `libs/care/src/lib/care/navbar/navbar.component.ts`
- Modify: `libs/care/src/lib/care/navbar/navbar.component.html`
- Modify: `libs/care/src/lib/care/navbar/navbar.component.css`

- [ ] **Step 2.1: Write the failing test**

```typescript
// libs/care/src/lib/care/navbar/navbar.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits menuToggle when toggleMenu() is called', () => {
    let emitted = false;
    component.menuToggle.subscribe(() => emitted = true);
    component.toggleMenu();
    expect(emitted).toBe(true);
  });

  it('does not render nav links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.navbar-links')).toBeNull();
  });
});
```

- [ ] **Step 2.2: Run tests to confirm they fail**

```bash
npx nx test care --testFile=libs/care/src/lib/care/navbar/navbar.component.spec.ts
```

Expected: FAIL — `menuToggle` does not exist; `.navbar-links` exists.

- [ ] **Step 2.3: Update NavbarComponent TypeScript**

```typescript
// libs/care/src/lib/care/navbar/navbar.component.ts
import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@care-giver-site/services';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'care-navbar',
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatIconModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  @Output() menuToggle = new EventEmitter<void>();

  private authService = inject(AuthService);
  userName = '';

  constructor() {
    this.authService.getUserFirstName().then(name => {
      this.userName = name;
    });
  }

  toggleMenu() {
    this.menuToggle.emit();
  }

  signOut() {
    this.authService.signOutUser().then(() => {
      window.location.reload();
    });
  }
}
```

- [ ] **Step 2.4: Update NavbarComponent template**

```html
<!-- libs/care/src/lib/care/navbar/navbar.component.html -->
<nav class="navbar">
  <div class="navbar-content">
    <button class="hamburger" matIconButton (click)="toggleMenu()" aria-label="Toggle navigation">
      <mat-icon>menu</mat-icon>
    </button>
    <a class="navbar-logo" href="/">
      <img src="assets/caretosher-logo.png" alt="CareToSher" />
    </a>
    <div class="navbar-spacer"></div>
    <button matIconButton [matMenuTriggerFor]="userMenu" aria-label="User menu">
      <mat-icon>account_circle</mat-icon>
    </button>
    <mat-menu #userMenu="matMenu">
      <button mat-menu-item (click)="signOut()">Sign Out</button>
    </mat-menu>
  </div>
</nav>
```

- [ ] **Step 2.5: Update NavbarComponent CSS**

```css
/* libs/care/src/lib/care/navbar/navbar.component.css */
.navbar {
  position: sticky;
  top: 0;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.navbar-content {
  display: flex;
  align-items: center;
  width: 100%;
  height: 56px;
  padding: 0 8px;
}

.hamburger {
  display: flex;
}

.navbar-logo {
  display: flex;
  align-items: center;
  margin-left: 4px;
}

.navbar-logo img {
  height: 44px;
}

.navbar-spacer {
  flex: 1;
}

/* Hide hamburger on desktop — sidenav is always visible */
@media (min-width: 768px) {
  .hamburger {
    display: none;
  }
}
```

- [ ] **Step 2.6: Run tests to confirm they pass**

```bash
npx nx test care --testFile=libs/care/src/lib/care/navbar/navbar.component.spec.ts
```

Expected: PASS

- [ ] **Step 2.7: Commit**

```bash
git add libs/care/src/lib/care/navbar/navbar.component.ts \
        libs/care/src/lib/care/navbar/navbar.component.html \
        libs/care/src/lib/care/navbar/navbar.component.css \
        libs/care/src/lib/care/navbar/navbar.component.spec.ts
git commit -m "feat(navbar): refactor to top-bar only — hamburger output, logo, user avatar"
```

---

## Task 3: Refactor ReceiverSelectionComponent to sidebar style

Replace the mini-fab + swap-icon layout with the "Caring for / [initials] Full Name / tap to switch" sidebar section. All modal logic (add receiver, add care giver) remains unchanged.

**Files:**
- Modify: `libs/care/src/lib/care/receiver-selection/receiver-selection.component.html`
- Modify: `libs/care/src/lib/care/receiver-selection/receiver-selection.component.css`

- [ ] **Step 3.1: Write the failing test**

```typescript
// libs/care/src/lib/care/receiver-selection/receiver-selection.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReceiverSelectionComponent } from './receiver-selection.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ReceiverSelectionComponent', () => {
  let component: ReceiverSelectionComponent;
  let fixture: ComponentFixture<ReceiverSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiverSelectionComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiverSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the "caring-for" label', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.caring-for-label')).not.toBeNull();
  });

  it('does not render the old receiver-selection-container', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.receiver-selection-container')).toBeNull();
  });
});
```

- [ ] **Step 3.2: Run tests to confirm they fail**

```bash
npx nx test care --testFile=libs/care/src/lib/care/receiver-selection/receiver-selection.component.spec.ts
```

Expected: FAIL — `.caring-for-label` does not exist; `.receiver-selection-container` exists.

- [ ] **Step 3.3: Update ReceiverSelectionComponent template**

The TypeScript file (`receiver-selection.component.ts`) does not change — all service calls, modal flags, and `getInitials()` remain identical.

```html
<!-- libs/care/src/lib/care/receiver-selection/receiver-selection.component.html -->
<div class="sidebar-receiver" [matMenuTriggerFor]="changeReceiverMenu">
  @if (isLoading) {
    <div class="receiver-skeleton"></div>
  } @else {
    <div class="caring-for-label">Caring for</div>
    <div class="receiver-row">
      <button
        class="receiver-initials"
        matMiniFab
        [matMenuTriggerFor]="currentReceiverMenu"
        aria-label="Receiver options"
        (click)="$event.stopPropagation()"
      >
        {{ getInitials() }}
      </button>
      <div class="receiver-info">
        <div class="receiver-full-name">
          {{ receiver?.firstName }} {{ receiver?.lastName }}
        </div>
        <div class="receiver-switch-hint">tap to switch</div>
      </div>
    </div>
  }
</div>

<mat-menu #currentReceiverMenu="matMenu">
  <button mat-menu-item (click)="showAddCareGiverModal = true">
    Add Additional Care Giver
  </button>
</mat-menu>

<mat-menu #changeReceiverMenu="matMenu">
  @for (r of receivers; track r.receiverId) {
    <button mat-menu-item (click)="selectReceiver(r.receiverId)">
      <mat-icon>person</mat-icon>{{ r.firstName }} {{ r.lastName }}
    </button>
  }
  <button mat-menu-item (click)="showAddReceiverModal = true">
    <mat-icon>add</mat-icon>New Receiver
  </button>
</mat-menu>

<!-- Add Receiver modal — unchanged -->
<care-modal
  [show]="showAddReceiverModal"
  header="Add Care Receiver"
  (close)="showAddReceiverModal = false"
>
  <div modal-body>
    <form (ngSubmit)="submitAddReceiver()" #addReceiverForm="ngForm">
      <mat-form-field>
        <mat-label>First Name</mat-label>
        <input matInput [(ngModel)]="newReceiver.firstName" name="firstName" required />
      </mat-form-field>
      <mat-form-field>
        <mat-label>Last Name</mat-label>
        <input matInput [(ngModel)]="newReceiver.lastName" name="lastName" required />
      </mat-form-field>
    </form>
  </div>
  <div modal-footer>
    <button matButton="filled" class="modal-button" (click)="submitAddReceiver()">Add</button>
    <button matButton="filled" class="secondary-button modal-button" (click)="showAddReceiverModal = false">Cancel</button>
  </div>
</care-modal>

<!-- Add Care Giver modal — unchanged -->
<care-modal
  [show]="showAddCareGiverModal"
  header="Add Additional Care Giver"
  (close)="showAddCareGiverModal = false"
>
  <div modal-body>
    <form (ngSubmit)="submitAddCareGiver()" #addCareGiverForm="ngForm">
      <mat-form-field>
        <mat-label>Email</mat-label>
        <input matInput [(ngModel)]="additionalCareGiverEmail" name="careGiverEmail" required />
      </mat-form-field>
    </form>
  </div>
  <div modal-footer>
    <button matButton="filled" class="modal-button" (click)="submitAddCareGiver()">Add</button>
    <button matButton="filled" class="secondary-button modal-button" (click)="showAddCareGiverModal = false">Cancel</button>
  </div>
</care-modal>
```

- [ ] **Step 3.4: Update ReceiverSelectionComponent CSS**

```css
/* libs/care/src/lib/care/receiver-selection/receiver-selection.component.css */
.sidebar-receiver {
  padding: 14px 12px;
  cursor: pointer;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  transition: background 0.15s;
}

.sidebar-receiver:hover {
  background: rgba(255, 255, 255, 0.10);
}

.caring-for-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 6px;
}

.receiver-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.receiver-initials {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  font-size: 11px !important;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.2) !important;
  color: #fff !important;
  border: 1.5px solid rgba(255, 255, 255, 0.4) !important;
  flex-shrink: 0;
}

.receiver-info {
  min-width: 0;
}

.receiver-full-name {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.receiver-switch-hint {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 1px;
}

.receiver-skeleton {
  height: 48px;
  border-radius: 8px;
  background: linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.secondary-button {
  background-color: #d3d3d3 !important;
  color: black !important;
}

.modal-button {
  margin: 0.5rem;
}
```

- [ ] **Step 3.5: Run tests to confirm they pass**

```bash
npx nx test care --testFile=libs/care/src/lib/care/receiver-selection/receiver-selection.component.spec.ts
```

Expected: PASS

- [ ] **Step 3.6: Commit**

```bash
git add libs/care/src/lib/care/receiver-selection/receiver-selection.component.html \
        libs/care/src/lib/care/receiver-selection/receiver-selection.component.css \
        libs/care/src/lib/care/receiver-selection/receiver-selection.component.spec.ts
git commit -m "feat(receiver-selection): redesign to sidebar-style caring-for section"
```

---

## Task 4: Create ShellComponent

The shell hosts `MatSidenavContainer` with nav links + receiver section, the top bar (`care-navbar`), a FAB, and a hidden `QuickLogComponent` for the FAB's event-logging modal.

**Files:**
- Create: `libs/care/src/lib/care/shell/shell.component.ts`
- Create: `libs/care/src/lib/care/shell/shell.component.html`
- Create: `libs/care/src/lib/care/shell/shell.component.css`
- Create: `libs/care/src/lib/care/shell/shell.component.spec.ts`

- [ ] **Step 4.1: Write the failing test**

```typescript
// libs/care/src/lib/care/shell/shell.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShellComponent } from './shell.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ShellComponent', () => {
  let component: ShellComponent;
  let fixture: ComponentFixture<ShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent, HttpClientTestingModule, RouterTestingModule, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the sidebar nav items', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.nav-item')).not.toBeNull();
  });

  it('renders the FAB', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.fab')).not.toBeNull();
  });
});
```

- [ ] **Step 4.2: Run test to confirm it fails**

```bash
npx nx test care --testFile=libs/care/src/lib/care/shell/shell.component.spec.ts
```

Expected: FAIL — `ShellComponent` does not exist.

- [ ] **Step 4.3: Create shell.component.ts**

```typescript
// libs/care/src/lib/care/shell/shell.component.ts
import { Component, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';

import { NavbarComponent } from '../navbar/navbar.component';
import { ReceiverSelectionComponent } from '../receiver-selection/receiver-selection.component';
import { QuickLogComponent } from '../quick-log/quick-log.component';
import { EventService, ReceiverService } from '@care-giver-site/services';
import { EventMetadata } from '@care-giver-site/models';

@Component({
  selector: 'care-shell',
  imports: [
    CommonModule,
    RouterModule,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    NavbarComponent,
    ReceiverSelectionComponent,
    QuickLogComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild(QuickLogComponent) quickLog!: QuickLogComponent;

  private breakpointObserver = inject(BreakpointObserver);
  private eventService = inject(EventService);
  private receiverService = inject(ReceiverService);
  private destroy$ = new Subject<void>();

  isMobile = false;
  eventTypes: EventMetadata[] = [];

  ngOnInit() {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
      });

    this.eventService.eventConfigs$
      .pipe(takeUntil(this.destroy$))
      .subscribe(configs => {
        this.eventTypes = configs;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onMenuToggle() {
    this.sidenav.toggle();
  }

  onNavItemClick() {
    if (this.isMobile) {
      this.sidenav.close();
    }
  }

  onLogEventType(meta: EventMetadata) {
    this.quickLog.onButtonClick(meta);
  }

  onNewEvent() {
    this.receiverService.notifyEventAdded();
  }
}
```

- [ ] **Step 4.4: Create shell.component.html**

```html
<!-- libs/care/src/lib/care/shell/shell.component.html -->
<mat-sidenav-container class="shell-container">

  <mat-sidenav
    #sidenav
    [mode]="isMobile ? 'over' : 'side'"
    [opened]="!isMobile"
    class="shell-sidenav"
  >
    <div class="sidenav-header">
      <img src="assets/caretosher-logo.png" alt="CareToSher" class="sidenav-logo" />
    </div>

    <nav class="sidenav-nav">
      <a
        class="nav-item"
        routerLink="/"
        routerLinkActive="nav-item--active"
        [routerLinkActiveOptions]="{ exact: true }"
        (click)="onNavItemClick()"
      >
        <mat-icon class="nav-icon">dashboard</mat-icon>
        <span class="nav-label">Dashboard</span>
      </a>

      <a
        class="nav-item"
        routerLink="/stats"
        routerLinkActive="nav-item--active"
        (click)="onNavItemClick()"
      >
        <mat-icon class="nav-icon">bar_chart</mat-icon>
        <span class="nav-label">Stats</span>
      </a>

      <div class="nav-divider"></div>

      <a
        class="nav-item"
        routerLink="/submit-feedback"
        routerLinkActive="nav-item--active"
        (click)="onNavItemClick()"
      >
        <mat-icon class="nav-icon">feedback</mat-icon>
        <span class="nav-label">Feedback</span>
      </a>
    </nav>

    <div class="sidenav-bottom">
      <care-receiver-selection></care-receiver-selection>
    </div>
  </mat-sidenav>

  <mat-sidenav-content class="shell-content">
    <care-navbar (menuToggle)="onMenuToggle()"></care-navbar>

    <div class="page-content">
      <router-outlet></router-outlet>
    </div>

    <!-- FAB -->
    <button
      class="fab"
      mat-fab
      color="primary"
      aria-label="Log event"
      [matMenuTriggerFor]="fabMenu"
    >
      <mat-icon>add</mat-icon>
    </button>

    <mat-menu #fabMenu="matMenu">
      @for (type of eventTypes; track type.type) {
        <button mat-menu-item (click)="onLogEventType(type)">
          <mat-icon>{{ type.icon }}</mat-icon>
          {{ type.type }}
        </button>
      }
    </mat-menu>

    <!-- QuickLogComponent hosts the event-entry modal; its buttons are hidden -->
    <div class="quick-log-host">
      <care-quick-log
        [eventTypes]="eventTypes"
        (newEvent)="onNewEvent()"
      ></care-quick-log>
    </div>
  </mat-sidenav-content>

</mat-sidenav-container>
```

- [ ] **Step 4.5: Create shell.component.css**

```css
/* libs/care/src/lib/care/shell/shell.component.css */
:host {
  display: block;
  height: 100vh;
}

.shell-container {
  height: 100%;
}

/* ── Sidenav ── */
.shell-sidenav {
  width: 160px;
  background: #1a237e;
  border-right: none;
  display: flex;
  flex-direction: column;
}

.sidenav-header {
  padding: 12px 14px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidenav-logo {
  height: 36px;
}

.sidenav-nav {
  flex: 1;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.9);
}

.nav-item--active {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-weight: 700;
}

.nav-item--active .nav-icon {
  color: #fff;
}

.nav-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.5);
}

.nav-label {
  flex: 1;
}

.nav-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 4px 0;
}

.sidenav-bottom {
  /* Receiver section sits here, styling owned by receiver-selection component */
}

/* ── Content ── */
.shell-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f6fa;
}

.page-content {
  flex: 1;
  overflow-y: auto;
}

/* ── FAB ── */
.fab {
  position: fixed !important;
  bottom: 24px;
  right: 24px;
  z-index: 200;
}

/* ── Hidden quick-log host ── */
.quick-log-host {
  position: absolute;
  visibility: hidden;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}

/* Allow modals inside quick-log-host to be interactive */
.quick-log-host ::ng-deep care-modal {
  visibility: visible;
  pointer-events: all;
}
```

- [ ] **Step 4.6: Run tests to confirm they pass**

```bash
npx nx test care --testFile=libs/care/src/lib/care/shell/shell.component.spec.ts
```

Expected: PASS

- [ ] **Step 4.7: Commit**

```bash
git add libs/care/src/lib/care/shell/shell.component.ts \
        libs/care/src/lib/care/shell/shell.component.html \
        libs/care/src/lib/care/shell/shell.component.css \
        libs/care/src/lib/care/shell/shell.component.spec.ts
git commit -m "feat(shell): create AppShellComponent with sidenav, receiver section, and FAB"
```

---

## Task 5: Export ShellComponent and wire up routes

Export the shell from the care lib public API and make it the parent of all authenticated routes.

**Files:**
- Modify: `libs/care/src/index.ts`
- Modify: `apps/care-giver-site/src/app/app.routes.ts`

- [ ] **Step 5.1: Export ShellComponent from the care lib**

```typescript
// libs/care/src/index.ts
export * from './lib/care/pages/dashboard/dashboard.component';
export * from './lib/care/pages/stats/stats.component';
export * from './lib/care/pages/feedback/feedback.component';
export * from './lib/care/pages/mobile-download/mobile-download.component';
export * from './lib/care/shell/shell.component';
```

- [ ] **Step 5.2: Update app.routes.ts**

```typescript
// apps/care-giver-site/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

export const appRoutes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('@care-giver-site/care').then(m => m.ShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@care-giver-site/care').then(m => m.DashboardComponent),
      },
      {
        path: 'stats',
        loadComponent: () =>
          import('@care-giver-site/care').then(m => m.StatsComponent),
      },
      {
        path: 'submit-feedback',
        loadComponent: () =>
          import('@care-giver-site/care').then(m => m.FeedbackComponent),
      },
    ],
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('@care-giver-site/auth').then(m => m.AuthComponent),
  },
  {
    path: 'mobile-download',
    loadComponent: () =>
      import('@care-giver-site/care').then(m => m.MobileDownloadComponent),
  },
];
```

- [ ] **Step 5.3: Confirm the app builds**

```bash
npx nx build care-giver-site
```

Expected: build succeeds (pages still have their own `<care-navbar>` — that's fine for now, will be removed in Task 6–8).

- [ ] **Step 5.4: Commit**

```bash
git add libs/care/src/index.ts apps/care-giver-site/src/app/app.routes.ts
git commit -m "feat(routing): nest authenticated routes under ShellComponent"
```

---

## Task 6: Strip navbar + receiver-selection from DashboardComponent

The shell now owns the nav UI. The dashboard only needs its own content. It subscribes to `ReceiverService` subjects instead of template events.

**Files:**
- Modify: `libs/care/src/lib/care/pages/dashboard/dashboard.component.ts`
- Modify: `libs/care/src/lib/care/pages/dashboard/dashboard.component.html`
- Modify: `libs/care/src/lib/care/pages/dashboard/dashboard.component.css`

- [ ] **Step 6.1: Update dashboard.component.ts**

```typescript
// libs/care/src/lib/care/pages/dashboard/dashboard.component.ts
import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CareCalendarComponent } from '../../calendar/calendar.component';
import { UpcomingEventsComponent } from '../../upcoming-events/upcoming-events.component';
import { StatusMonitorComponent } from '../../status-monitor/status-monitor.component';
import { QuickLogComponent } from '../../quick-log/quick-log.component';
import { EventModalComponent } from '../../modal/event-modal/event-modal.component';
import { ReceiverService, EventService, AuthService } from '@care-giver-site/services';
import { Event, EventMetadata } from '@care-giver-site/models';
import { AlertComponent } from '../../alert/alert.component';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DailyTimelineComponent } from '../../daily-timeline/daily-timeline.component';

@Component({
  selector: 'lib-dashboard',
  imports: [
    CommonModule,
    CareCalendarComponent,
    FormsModule,
    AlertComponent,
    EventModalComponent,
    MatButtonModule,
    MatProgressSpinnerModule,
    UpcomingEventsComponent,
    StatusMonitorComponent,
    QuickLogComponent,
    DailyTimelineComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(DailyTimelineComponent) private timeline!: DailyTimelineComponent;

  private receiverService = inject(ReceiverService);
  private authService = inject(AuthService);
  private eventService = inject(EventService);
  private destroy$ = new Subject<void>();

  eventTypes: EventMetadata[] = [];
  events: Event[] = [];
  userId = '';

  showEventModal = false;
  showSpinner = true;

  selectedEvent: Event | null = null;
  eventAction: 'create' | 'update' | 'delete' | 'view' = 'view';

  ngOnInit() {
    this.eventService.eventConfigs$.subscribe(configs => {
      this.eventTypes = configs;
    });

    this.receiverService.receiverChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.getLatestEvents());

    this.receiverService.eventAdded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onNewEvent());

    // Load initial data if a receiver is already selected
    if (this.receiverService.currentReceiverId) {
      this.getLatestEvents();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async getLatestEvents() {
    if (!this.receiverService.currentReceiverId) return;

    this.authService.getCurrentUserId().then(async userId => {
      this.userId = userId;
      if (this.receiverService.currentReceiverId && this.userId) {
        const observable = await this.receiverService.getReceiverEvents(
          this.receiverService.currentReceiverId,
          this.userId,
        );
        observable.subscribe((data: Event[]) => {
          this.events = data;
          this.showSpinner = false;
        });
      }
    });
  }

  onNewEvent() {
    this.getLatestEvents();
    this.timeline?.refresh();
  }

  handleDeleteEvent(event: Event) {
    this.selectedEvent = event;
    this.eventAction = 'delete';
    this.showEventModal = true;
  }

  handleViewEvent(event: Event) {
    this.selectedEvent = event;
    this.eventAction = 'view';
    this.showEventModal = true;
  }
}
```

- [ ] **Step 6.2: Update dashboard.component.html**

```html
<!-- libs/care/src/lib/care/pages/dashboard/dashboard.component.html -->
@if (showSpinner) {
  <mat-progress-spinner class="spinner" mode="indeterminate"></mat-progress-spinner>
} @else {
  <div class="dashboard-content">
    <care-upcoming-events [events]="events" [eventTypes]="eventTypes"></care-upcoming-events>
    <care-quick-log [eventTypes]="eventTypes" (newEvent)="onNewEvent()"></care-quick-log>
    <care-status-monitor [events]="events" [eventTypes]="eventTypes"></care-status-monitor>
    <care-daily-timeline></care-daily-timeline>
    <care-calendar
      [events]="events"
      (eventToDelete)="handleDeleteEvent($event)"
      (eventToView)="handleViewEvent($event)"
    ></care-calendar>
  </div>
}

@if (selectedEvent) {
  <care-event-modal
    [event]="selectedEvent"
    [(eventAction)]="eventAction"
    [(showModal)]="showEventModal"
    (eventChange)="getLatestEvents()"
  ></care-event-modal>
}

<care-alert></care-alert>
```

- [ ] **Step 6.3: Update dashboard.component.css** — remove unused selectors

```css
/* libs/care/src/lib/care/pages/dashboard/dashboard.component.css */
.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

.spinner {
  display: block;
  margin: 40px auto;
}

.secondary-button {
  background-color: #d3d3d3 !important;
  color: black !important;
}

.modal-button {
  margin: 0.5rem;
}
```

- [ ] **Step 6.4: Run the app and verify the dashboard renders correctly**

```bash
npx nx serve care-giver-site
```

Open http://localhost:4200. Confirm:
- Sidebar visible on desktop, hamburger visible on mobile
- Dashboard content loads after receiver is selected
- Switching receiver reloads events

- [ ] **Step 6.5: Commit**

```bash
git add libs/care/src/lib/care/pages/dashboard/dashboard.component.ts \
        libs/care/src/lib/care/pages/dashboard/dashboard.component.html \
        libs/care/src/lib/care/pages/dashboard/dashboard.component.css
git commit -m "feat(dashboard): remove embedded navbar and receiver-selection, subscribe to service subjects"
```

---

## Task 7: Strip navbar + receiver-selection from StatsComponent

**Files:**
- Modify: `libs/care/src/lib/care/pages/stats/stats.component.ts`
- Modify: `libs/care/src/lib/care/pages/stats/stats.component.html`

- [ ] **Step 7.1: Update stats.component.ts**

Open `libs/care/src/lib/care/pages/stats/stats.component.ts`. Make these changes:
1. Remove `NavbarComponent` and `ReceiverSelectionComponent` from `imports` array
2. Remove their import statements
3. Add `OnDestroy` to the class
4. Add `private destroy$ = new Subject<void>()` field
5. In `ngOnInit`, subscribe to `receiverService.receiverChanged$` and `receiverService.eventAdded$` the same way as the dashboard

The final `ngOnInit` in StatsComponent should look like:

```typescript
ngOnInit() {
  this.eventService.eventConfigs$.subscribe(configs => {
    this.eventTypes = configs;
    this.eventTypesWithGraphs = configs.filter(c => c.data !== undefined);
  });

  this.receiverService.receiverChanged$
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => this.getLatestEvents());

  this.receiverService.eventAdded$
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => this.getLatestEvents());

  if (this.receiverService.currentReceiverId) {
    this.getLatestEvents();
  }
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

Add `Subject` to the rxjs import and `takeUntil` as well. Add `OnDestroy` to the Angular core import and implement it on the class.

Also remove these fields that are no longer needed (they were for the receiver-selection row):
```
showAddReceiverModal = false;
showAddCareGiverModal = false;
newReceiver = { firstName: '', lastName: '' };
additionalCareGiverEmail = '';
```

And remove `ReceiverService` from `inject` only if it's no longer used. Keep it if `getLatestEvents()` uses `receiverService.currentReceiverId`.

- [ ] **Step 7.2: Update stats.component.html**

Remove `<care-navbar>` and `<care-receiver-selection ...>` from the top of the template. The file should start directly with the page content (event table, charts, etc.).

- [ ] **Step 7.3: Run the app and verify Stats page**

```bash
npx nx serve care-giver-site
```

Navigate to `/stats`. Confirm the sidebar is shown (from the shell), the stats content loads, and switching receivers reloads the data.

- [ ] **Step 7.4: Commit**

```bash
git add libs/care/src/lib/care/pages/stats/stats.component.ts \
        libs/care/src/lib/care/pages/stats/stats.component.html
git commit -m "feat(stats): remove embedded navbar and receiver-selection, subscribe to service subjects"
```

---

## Task 8: Strip navbar from FeedbackComponent

Feedback does not use receiver data, so no subject subscriptions needed — just remove the navbar.

**Files:**
- Modify: `libs/care/src/lib/care/pages/feedback/feedback.component.ts`
- Modify: `libs/care/src/lib/care/pages/feedback/feedback.component.html`

- [ ] **Step 8.1: Update feedback.component.ts**

Remove `NavbarComponent` from `imports` array and remove its import statement.

- [ ] **Step 8.2: Update feedback.component.html**

Remove `<care-navbar></care-navbar>` from the top of the template.

- [ ] **Step 8.3: Run the app and verify Feedback page**

```bash
npx nx serve care-giver-site
```

Navigate to `/submit-feedback`. Confirm the shell sidebar is shown and the feedback form renders correctly.

- [ ] **Step 8.4: Commit**

```bash
git add libs/care/src/lib/care/pages/feedback/feedback.component.ts \
        libs/care/src/lib/care/pages/feedback/feedback.component.html
git commit -m "feat(feedback): remove embedded navbar"
```

---

## Task 9: Final verification and .gitignore update

- [ ] **Step 9.1: Add .superpowers to .gitignore**

```bash
echo '.superpowers/' >> /Users/trevorwilliams/Code/CareGiverApp/care-giver-site/.gitignore
```

- [ ] **Step 9.2: Run full test suite**

```bash
npx nx run-many --target=test --all
```

Expected: all existing tests pass.

- [ ] **Step 9.3: Run the app end-to-end and verify all requirements**

```bash
npx nx serve care-giver-site
```

Checklist:
- [ ] On mobile (< 768px): hamburger visible, sidebar hidden by default, tapping hamburger opens drawer, tapping a nav item closes the drawer
- [ ] On desktop (≥ 768px): sidebar always visible, no hamburger
- [ ] Receiver section at bottom of sidebar shows full name ("Jane Doe") and initials avatar
- [ ] Tapping receiver section opens switcher menu; selecting a different receiver reloads Dashboard and Stats data
- [ ] FAB (+) visible bottom-right on all authenticated pages
- [ ] Tapping FAB opens a mat-menu listing event types
- [ ] Selecting an event type opens the log-event modal
- [ ] Logging an event refreshes the dashboard event list
- [ ] Sign-out still works from the user avatar menu in the top bar

- [ ] **Step 9.4: Final commit**

```bash
git add .gitignore
git commit -m "chore: add .superpowers to .gitignore"
```
