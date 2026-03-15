import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MobileDownloadComponent } from './mobile-download.component';

describe('FeedbackComponent', () => {
  let component: MobileDownloadComponent;
  let fixture: ComponentFixture<MobileDownloadComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileDownloadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MobileDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
