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
    component.isLoading = false;
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
