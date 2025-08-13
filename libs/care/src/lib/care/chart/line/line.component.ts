import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ChartDataset, Point } from 'chart.js';

@Component({
  selector: 'care-line-chart',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
  ],
  templateUrl: './line.component.html',
  styleUrl: './line.component.css',
})

export class LineChartComponent implements OnInit, OnChanges {
  @Input() datasets!: ChartDataset<'line', (number | Point | null)[]>[];
  @Input() startDate!: string;
  @Input() endDate!: string;
  @Input() fontSize: number = 12;

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  chartOptions: ChartConfiguration<'line'>['options'] = {
    events: ['click', 'touchstart'],
    plugins: {
      tooltip: {
        callbacks: {
          label: context => {
            const day = new Date(context.parsed.x).toLocaleDateString();
            return `${day}`;
          }
        }
      },
    },
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1,
  };

  constructor() { }

  ngOnInit() {
    this.updateChartData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['datasets'] || changes['startDate'] || changes['endDate'] ||
      changes['fontSize']) {
      this.updateChartData();
    }
  }

  onDateRangeChange() {
    this.updateChartData();
  }

  private updateChartData() {
    this.updateAxisRange();
    this.refreshChartOptions();
    this.chart?.update();
  }

  private updateAxisRange() {
    this.chartOptions!.scales = this.chartOptions!.scales || {};
    this.chartOptions!.scales['x'] = {
      type: 'linear',
      min: new Date(this.startDate).setHours(0, 0, 0, 0),
      max: new Date(this.endDate).setHours(23, 59, 59, 999),
      ticks: {
        callback: value => new Date(value as number).toLocaleDateString(),
        font: { size: this.fontSize }
      }
    };
    this.chartOptions!.scales['y'] = {
      ticks: {
        callback: value => `${value} lbs`,
        font: { size: this.fontSize }
      }
    };
  }

  private refreshChartOptions() {
    this.chartOptions = { ...this.chartOptions };
  }

}
