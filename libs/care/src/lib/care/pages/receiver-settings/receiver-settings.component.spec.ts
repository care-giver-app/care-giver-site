import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReceiverSettingsComponent } from './receiver-settings.component';

describe('CareComponent', () => {
  let component: ReceiverSettingsComponent;
  let fixture: ComponentFixture<ReceiverSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiverSettingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiverSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
