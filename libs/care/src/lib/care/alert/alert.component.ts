import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertType, Alert } from '@care-giver-site/models';
import { AlertService } from '@care-giver-site/services';

@Component({
  selector: 'care-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css',
})
export class AlertComponent {
  alerts: Alert[] = [];

  constructor(private alertService: AlertService) {
    this.alertService.onAlert((alert) => this.addAlert(alert));
  }

  addAlert(alert: Alert) {
    this.alerts.push(alert);
    setTimeout(() => this.closeAlert(alert.id), 3000);
  }

  closeAlert(id: number) {
    this.alerts = this.alerts.filter(a => a.id !== id);
  }

  getAlertClass(type: AlertType): string {
    switch (type) {
      case AlertType.Success: return 'alert-success';
      case AlertType.Failure: return 'alert-failure';
      case AlertType.Info: return 'alert-info';
      default: return '';
    }
  }
}
