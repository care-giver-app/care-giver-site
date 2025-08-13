import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Event } from '@care-giver-site/models';
import { FormsModule } from '@angular/forms';
import { EventTypes, EventService } from '@care-giver-site/services';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core'

@Component({
  selector: 'care-chart',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    FormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule
  ],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css',
})
export class ChartComponent implements OnInit, OnChanges {
  @Input() events: Event[] = [];

  startDate: string;
  endDate: string;
  fontSize: number = 12;
  pointSize: number = 7;

  private eventService = inject(EventService);

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  scatterChartDatasets: ChartConfiguration<'scatter'>['data']['datasets'] = [
    {
      data: [],
      label: 'Event Times',
    },
  ];

  scatterChartOptions: ChartConfiguration<'scatter'>['options'] = {
    plugins: {
      tooltip: {
        callbacks: {
          label: context => {
            const date = new Date(context.parsed.x);
            const day = ChartComponent.getDateString(date);
            const time = ChartComponent.getTimeInAMPM(context.parsed.y);
            return `${day} at ${time}`;
          }
        }
      }
    },
    responsive: true,
  };

  constructor() {
    this.endDate = ChartComponent.getDateString(new Date(Date.now() + 1 * 24 * 60 * 60 * 1000));
    this.startDate = ChartComponent.getDateString(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
    if (window.innerWidth < 600) {
      this.fontSize = 6;
      this.pointSize = 4;
    }
  }

  ngOnInit() {
    this.updateAxisRange();
    this.scatterChartDatasets[0].pointRadius = this.pointSize;
    this.chart?.update();
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
    this.scatterChartDatasets = this.events && this.events.length > 0 ? this.buildDatasets() : [{ data: [], label: 'Event Times' }];
    this.updateAxisRange();
    this.refreshChartOptions();
    this.chart?.update();
  }

  private buildDatasets() {
    const [start, end] = this.getDateRange();
    return EventTypes.map(eventType => {
      const colorObj = this.eventService.getEventColor(eventType.type);
      const points = this.events
        .filter(e => e.type === eventType.type && this.isInRange(e.timestamp, start, end))
        .map(e => this.eventToPoint(e, colorObj));
      return {
        label: eventType.type,
        data: points,
        backgroundColor: colorObj.secondary,
        borderColor: colorObj.primary,
        pointRadius: this.pointSize
      };
    });
  }

  private eventToPoint(e: Event, colorObj: { primary: string; secondary: string }) {
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

  private getDateRange(): [number, number] {
    const start = new Date(this.startDate).setHours(0, 0, 0, 0);
    console.log('Start date:', new Date(start));
    const end = new Date(this.endDate).setHours(0, 0, 0, 0);
    return [start, end];
  }

  private isInRange(timestamp: string | number | Date, start: number, end: number): boolean {
    const t = new Date(timestamp).getTime();
    return t >= start && t <= end;
  }

  private updateAxisRange() {
    this.scatterChartOptions!.scales = this.scatterChartOptions!.scales || {};
    this.scatterChartOptions!.scales['x'] = {
      min: new Date(this.startDate).setHours(0, 0, 0, 0),
      max: new Date(this.endDate).setHours(0, 0, 0, 0),
      ticks: {
        stepSize: 24 * 60 * 60 * 1000,
        callback: value => new Date(value as number).toLocaleDateString(),
        font: { size: this.fontSize }
      }
    };
    this.scatterChartOptions!.scales['y'] = {
      min: 0,
      max: 24,
      ticks: {
        stepSize: 2,
        callback: value => ChartComponent.getTimeInAMPM(Number(value)),
        font: { size: this.fontSize }
      }
    };
  }

  private refreshChartOptions() {
    this.scatterChartOptions = { ...this.scatterChartOptions };
  }

  private static getTimeInAMPM(hourDecimal: number): string {
    const hour = Math.floor(hourDecimal) % 24;
    const minute = Math.round((hourDecimal - hour) * 60);
    const period = hour < 12 ? 'AM' : 'PM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const minStr = minute.toString().padStart(2, '0');
    return `${hour12}:${minStr} ${period}`;
  }

  private static getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
