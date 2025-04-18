import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CareCalendarComponent } from './calendar.component';

describe('CalendarComponent', () => {
  let component: CareCalendarComponent;
  let fixture: ComponentFixture<CareCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CareCalendarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CareCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
