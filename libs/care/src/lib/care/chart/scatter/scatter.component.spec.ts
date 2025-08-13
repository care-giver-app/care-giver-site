import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeseriesScatterChartComponent } from './scatter.component';

describe('CommonComponent', () => {
  let component: TimeseriesScatterChartComponent;
  let fixture: ComponentFixture<TimeseriesScatterChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeseriesScatterChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeseriesScatterChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
