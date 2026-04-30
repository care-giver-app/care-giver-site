import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { ReceiverService, AuthService, AlertService } from '@care-giver-site/services';
import { EventMetadata, EventRequest, DataPoint, AlertType } from '@care-giver-site/models';
import { EventFormModalComponent } from '../modal/event-form-modal/event-form-modal.component';

@Component({
  selector: 'care-quick-log',
  imports: [EventFormModalComponent],
  templateUrl: './quick-log.component.html',
  styleUrl: './quick-log.component.css',
})
export class QuickLogComponent {
  @Input() eventTypes!: EventMetadata[];
  @Output() newEvent = new EventEmitter<void>();

  private receiverService = inject(ReceiverService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  showFormModal = false;
  initialTypes: string[] = [];

  private currentUserId = '';

  constructor() {
    this.authService.getCurrentUserId().then(id => (this.currentUserId = id));
  }

  get quickAddTypes(): EventMetadata[] {
    return this.eventTypes?.filter(e => e.hasQuickAdd) ?? [];
  }

  onButtonClick(meta: EventMetadata) {
    const needsModal = meta.data || (meta.fields && meta.fields.length > 0);
    if (needsModal) {
      this.initialTypes = [meta.type];
      this.showFormModal = true;
    } else {
      this.logEventNow(meta.type);
    }
  }

  private async logEventNow(type: string) {
    const metadata = this.eventTypes.find(e => e.type === type);
    if (!metadata) return;

    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + 30 * 60000).toISOString();

    if (!this.receiverService.currentReceiverId) {
      this.alertService.show('No receiver selected.', AlertType.Failure);
      return;
    }

    const req: EventRequest = {
      receiverId: this.receiverService.currentReceiverId,
      userId: this.currentUserId,
      startTime,
      endTime,
      type,
      data: [],
    };

    try {
      const obs = await this.receiverService.addEvent(req);
      obs.subscribe({
        next: () => {
          this.newEvent.emit();
          this.alertService.show(`${type} logged`, AlertType.Success);
        },
        error: () => this.alertService.show('Error logging event', AlertType.Failure),
      });
    } catch {
      this.alertService.show('Error logging event', AlertType.Failure);
    }
  }
}
