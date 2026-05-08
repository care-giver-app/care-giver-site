import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import { By } from '@angular/platform-browser';

import { ReceiverSettingsComponent } from './receiver-settings.component';
import { ReceiverService, AuthService, UserService, AlertService } from '@care-giver-site/services';

const mockReceiverService = {
  currentReceiverId: undefined as string | undefined,
  receiverChanged$: new Subject<void>(),
  getReceiver: jest.fn(),
};

const mockAuthService = {
  getCurrentUserId: jest.fn().mockResolvedValue('user-1'),
};

const mockUserService = {
  getUserRelationships: jest.fn().mockResolvedValue(undefined),
  getCareGiversForReceiver: jest.fn().mockResolvedValue([]),
  addCareGiver: jest.fn(),
};

const mockAlertService = {
  show: jest.fn(),
  onAlert: jest.fn(),
};

describe('ReceiverSettingsComponent', () => {
  let component: ReceiverSettingsComponent;
  let fixture: ComponentFixture<ReceiverSettingsComponent>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReceiverService.currentReceiverId = undefined;
    mockReceiverService.receiverChanged$ = new Subject<void>();
    mockAuthService.getCurrentUserId.mockResolvedValue('user-1');
    mockUserService.getUserRelationships.mockResolvedValue(undefined);
    mockUserService.getCareGiversForReceiver.mockResolvedValue([]);
    mockReceiverService.getReceiver.mockResolvedValue({ subscribe: () => {} });
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiverSettingsComponent, NoopAnimationsModule],
      providers: [
        { provide: ReceiverService, useValue: mockReceiverService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
        { provide: AlertService, useValue: mockAlertService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiverSettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show "select a receiver" message when no receiver is selected', () => {
    // currentReceiverId is undefined — no receiver selected
    fixture.detectChanges();

    const nativeEl: HTMLElement = fixture.nativeElement;
    expect(nativeEl.textContent?.toLowerCase()).toContain('select a receiver');
  });

  it('should show mat-progress-spinner while loading', () => {
    // Set a receiverId so loading begins
    mockReceiverService.currentReceiverId = 'receiver-1';

    // Make promises that never resolve so spinner stays visible
    mockUserService.getUserRelationships.mockReturnValue(new Promise(() => {}));
    mockUserService.getCareGiversForReceiver.mockReturnValue(new Promise(() => {}));
    mockReceiverService.getReceiver.mockReturnValue(new Promise(() => {}));

    fixture.detectChanges();

    const spinner = fixture.debugElement.query(By.css('mat-progress-spinner'));
    expect(spinner).toBeTruthy();
  });
});
