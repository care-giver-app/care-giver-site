import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventBoxComponent } from './event-box.component';

describe('CareComponent', () => {
  let component: EventBoxComponent;
  let fixture: ComponentFixture<EventBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventBoxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EventBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
