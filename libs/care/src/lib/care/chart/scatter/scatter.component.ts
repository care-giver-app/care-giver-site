import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ChartDataset, Point } from 'chart.js';
import { ChartComponent as ChartInterface } from '../chart.interface';

@Component({
  selector: 'care-timeseries-scatter-chart',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
  ],
  templateUrl: './scatter.component.html',
  styleUrl: './scatter.component.css',
})
export class TimeseriesScatterChartComponent implements OnInit, OnChanges, ChartInterface {
  @Input() datasets!: ChartDataset<'scatter', (number | Point | null)[]>[];
  @Input() startDate!: Date;
  @Input() endDate!: Date;
  @Input() fontSize: number = 12;

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  scatterChartDatasets: ChartConfiguration<'scatter'>['data']['datasets'] = [];

  scatterChartOptions: ChartConfiguration<'scatter'>['options'] = {
    events: ['click', 'touchstart'],
    plugins: {
      tooltip: {
        callbacks: {
          label: context => {
            const day = new Date(context.parsed.x).toLocaleDateString();
            const time = TimeseriesScatterChartComponent.getTimeInAMPM(context.parsed.y);
            return `${day} at ${time}`;
          }
        },
      },
    },
    aspectRatio: 1,
  };

  constructor() { }

  ngOnInit() {
    this.updateChartData();
  }

  ngOnChanges(_changes: SimpleChanges) {
    this.updateChartData();
  }

  getCanvas(): HTMLCanvasElement | null {
    return this.chart?.chart?.canvas ?? null;
  }

  update(): void {
    this.chart?.update();
  }

  private updateChartData() {
    this.scatterChartDatasets = this.datasets
    this.updateAxisRange();
    this.refreshChartOptions();
    this.chart?.update();
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
        callback: value => TimeseriesScatterChartComponent.getTimeInAMPM(Number(value)),
        font: { size: this.fontSize }
      }
    };
  }

  private refreshChartOptions() {
    this.scatterChartOptions = { ...this.scatterChartOptions };
  }

  private static getTimeInAMPM(hourDecimal: number): string {
    const hour = Math.floor(hourDecimal) % 24;
    const minute = Math.round((hourDecimal % 24 - hour) * 60);
    const period = hour < 12 ? 'AM' : 'PM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const minStr = minute.toString().padStart(2, '0');
    return `${hour12}:${minStr} ${period}`;
  }
}
