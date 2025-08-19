import { Component, Input, OnChanges, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Event, EventMetadata } from '@care-giver-site/models';
import { FormsModule } from '@angular/forms';
import { EventTypes, EventService } from '@care-giver-site/services';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core'
import { TimeseriesScatterChartComponent } from './scatter/scatter.component';
import { LineChartComponent } from './line/line.component';

@Component({
  selector: 'care-chart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    TimeseriesScatterChartComponent,
    LineChartComponent
  ],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css',
})
export class ChartComponent implements OnChanges {
  @Input() events: Event[] = [];
  @Input() eventTypes: EventMetadata[] = EventTypes;
  @Input() chartType: 'line' | 'scatter' = 'line';
  @Input() chartTitle: string = 'Event Chart';

  startDate: string;
  endDate: string;
  pointSize: number = 7;

  private eventService = inject(EventService);

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  scatterChartDatasets: ChartConfiguration<'scatter'>['data']['datasets'] = [];

  lineChartDatasets: ChartConfiguration<'line'>['data']['datasets'] = [];

  constructor() {
    this.endDate = ChartComponent.getDateString(new Date(Date.now() + 1 * 24 * 60 * 60 * 1000));
    this.startDate = ChartComponent.getDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['events']) {
      this.updateChartData();
    }
  }

  onDateRangeChange() {
    this.updateChartData();
  }

  private updateChartData() {
    switch (this.chartType) {
      case 'line':
        this.lineChartDatasets = this.events && this.events.length > 0 ? this.buildDatasets() : [{ data: [], label: 'Event Times' }];
        break;
      case 'scatter':
        this.scatterChartDatasets = this.events && this.events.length > 0 ? this.buildTimeDatasets() : [{ data: [], label: 'Event Times' }];
        break;
    }
    this.chart?.update();
  }

  private buildDatasets() {
    return this.eventTypes.map(eventType => {
      const colorObj = this.eventService.getEventColor(eventType.type);
      const points = this.events
        .filter(e => e.type === eventType.type)
        .map(e => this.eventToDataPoint(e, colorObj))
        .sort((a, b) => a.x - b.x);
      return {
        label: eventType.type,
        data: points,
        backgroundColor: colorObj.secondary,
        borderColor: colorObj.primary,
        pointRadius: this.pointSize
      };
    });
  }

  private buildTimeDatasets() {
    return this.eventTypes.map(eventType => {
      const colorObj = this.eventService.getEventColor(eventType.type);
      const points = this.events
        .filter(e => e.type === eventType.type)
        .map(e => this.eventToTimePoint(e, colorObj));
      return {
        label: eventType.type,
        data: points,
        backgroundColor: colorObj.secondary,
        borderColor: colorObj.primary,
        pointRadius: this.pointSize
      };
    });
  }

  private eventToDataPoint(e: Event, colorObj: { primary: string; secondary: string }) {
    const date = new Date(e.timestamp);
    console.log(date)
    return {
      x: date.getTime(),
      y: Number(e.data?.[0]?.value ?? 0),
      pointBackgroundColor: colorObj.secondary,
      pointBorderColor: colorObj.primary,
    };
  }

  private eventToTimePoint(e: Event, colorObj: { primary: string; secondary: string }) {
    const date = new Date(e.timestamp);
    const hours = date.getHours() + date.getMinutes() / 60;
    const day = date.setHours(0, 0, 0, 0);
    return {
      x: day,
      y: hours,
      pointBackgroundColor: colorObj.secondary,
      pointBorderColor: colorObj.primary,
    };
  }

  private static getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
