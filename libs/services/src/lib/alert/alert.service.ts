import { Injectable } from '@angular/core';
import { AlertType, Alert } from '@care-giver-site/models';

@Injectable({ providedIn: 'root' })
export class AlertService {
    private listeners: ((alert: Alert) => void)[] = [];
    private alertId = 0;

    show(message: string, type: AlertType) {
        const alert: Alert = { id: ++this.alertId, message, type };
        this.listeners.forEach(fn => fn(alert));
    }

    onAlert(fn: (alert: Alert) => void) {
        this.listeners.push(fn);
    }
}