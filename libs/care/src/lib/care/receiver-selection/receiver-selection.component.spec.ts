import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReceiverSelectionComponent } from './receiver-selection.component';

describe('ReceiverSelectionComponent', () => {
  let component: ReceiverSelectionComponent;
  let fixture: ComponentFixture<ReceiverSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiverSelectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiverSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
