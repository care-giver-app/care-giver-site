import { Component, Input, OnChanges, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatButtonModule } from '@angular/material/button';
import { ChartComponent as ChartInterface } from './chart.interface';
import { MatIconModule } from '@angular/material/icon';

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
    LineChartComponent,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css',
})
export class ChartComponent implements OnChanges {
  @Input() events: Event[] = [];
  @Input() eventTypes: EventMetadata[] = EventTypes;
  @Input() chartType: 'line' | 'scatter' = 'line';
  @Input() chartTitle: string = 'Event Chart';

  startDate: Date;
  endDate: Date;
  pointSize: number = 7;

  private eventService = inject(EventService);

  @ViewChild(LineChartComponent) lineChart?: LineChartComponent;
  @ViewChild(TimeseriesScatterChartComponent) scatterChart?: TimeseriesScatterChartComponent;

  scatterChartDatasets: ChartConfiguration<'scatter'>['data']['datasets'] = [];
  lineChartDatasets: ChartConfiguration<'line'>['data']['datasets'] = [];

  constructor() {
    this.endDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    this.startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  ngOnChanges(_changes: SimpleChanges) {
    this.updateChartData();
  }

  onDateRangeChange() {
    this.updateChartData();
  }

  downloadChart() {
    const activeChart = this.getActiveChart();
    const canvas = activeChart?.getCanvas();

    if (!canvas) {
      console.error('Chart canvas is not available for download');
      return;
    }

    try {
      const downloadCanvas = this.createDownloadCanvas(canvas);
      const dataUrl = downloadCanvas.toDataURL('image/png');
      const fileName = `${this.chartTitle.toLowerCase().replace(/\s+/g, '-')}-${ChartComponent.getDateString(this.startDate)}-to-${ChartComponent.getDateString(this.endDate)}.png`;

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading chart:', error);
    }
  }

  private createDownloadCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
    const downloadCanvas = document.createElement('canvas');
    const ctx = downloadCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D context for download canvas');
    }

    downloadCanvas.width = sourceCanvas.width;
    downloadCanvas.height = sourceCanvas.height;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

    ctx.drawImage(sourceCanvas, 0, 0);

    return downloadCanvas;
  }

  private getActiveChart(): ChartInterface | undefined {
    switch (this.chartType) {
      case 'line':
        return this.lineChart;
      case 'scatter':
        return this.scatterChart;
      default:
        return undefined;
    }
  }

  private updateChartData() {
    switch (this.chartType) {
      case 'line':
        this.lineChartDatasets = this.buildDatasets();
        break;
      case 'scatter':
        this.scatterChartDatasets = this.buildTimeDatasets();
        break;
    }
    this.getActiveChart()?.update();
  }

  private buildDatasets() {
    return this.buildDataset((e, colorObj) => this.eventToDataPoint(e, colorObj), true);
  }

  private buildTimeDatasets() {
    return this.buildDataset((e, colorObj) => this.eventToTimePoint(e, colorObj), false);
  }

  private buildDataset(
    mappingFn: (e: Event, colorObj: { primary: string; secondary: string }) => any,
    shouldSort: boolean
  ) {
    const eventsByType = this.events.reduce((acc, event) => {
      if (!acc[event.type]) {
        acc[event.type] = [];
      }
      acc[event.type].push(event);
      return acc;
    }, {} as Record<string, Event[]>);

    return this.eventTypes.map(eventType => {
      const colorObj = this.eventService.getEventColor(eventType.type);
      const eventsOfType = eventsByType[eventType.type] || [];
      let points = eventsOfType.map(e => mappingFn(e, colorObj));

      if (shouldSort) {
        points = points.sort((a, b) => a.x - b.x);
      }

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
    const day = new Date(e.timestamp).setHours(0, 0, 0, 0);
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
