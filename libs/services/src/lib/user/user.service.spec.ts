import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { CareGiver } from '@care-giver-site/models';

const mockAuthService = {
  getBearerToken: () => Promise.resolve('Bearer test-token'),
};

describe('UserService.getCareGiversForReceiver', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('returns caregivers on success', fakeAsync(() => {
    const mockCareGivers: CareGiver[] = [
      { userId: 'User#123', firstName: 'Jane', lastName: 'Smith', isPrimary: true },
    ];

    let result: CareGiver[] | undefined;
    service.getCareGiversForReceiver('Receiver#123', 'User#123').then(r => (result = r));

    flushMicrotasks();

    const req = httpMock.expectOne('/receiver/care-givers/Receiver%23123?userId=User%23123');
    expect(req.request.method).toBe('GET');
    req.flush({ careGivers: mockCareGivers, status: 'success' });

    flushMicrotasks();
    expect(result).toEqual(mockCareGivers);
  }));

  it('throws on error', fakeAsync(() => {
    let caughtError: unknown;
    service.getCareGiversForReceiver('Receiver#123', 'User#123').catch(err => (caughtError = err));

    flushMicrotasks();

    const req = httpMock.expectOne('/receiver/care-givers/Receiver%23123?userId=User%23123');
    req.error(new ProgressEvent('error'));

    flushMicrotasks();
    expect(caughtError).toBeDefined();
  }));
});
