import { Component, Input, SimpleChanges, OnChanges, Output, EventEmitter } from '@angular/core';
import { ModalComponent } from '../modal.component';
import { Event, DataPoint, AlertType } from '@care-giver-site/models';
import { EventService, UserService, ReceiverService, AuthService, AlertService } from '@care-giver-site/services';
import { MatButtonModule } from '@angular/material/button';

type EventAction = 'create' | 'update' | 'delete' | 'view';

@Component({
    selector: 'care-event-modal',
    templateUrl: './event-modal.component.html',
    styleUrl: './event-modal.component.css',
    imports: [ModalComponent, MatButtonModule]
})
export class EventModalComponent implements OnChanges {
    @Input() event!: Event;
    @Input() eventAction!: EventAction;
    @Input() showModal!: boolean;
    @Output() eventActionChange = new EventEmitter<EventAction>();
    @Output() showModalChange = new EventEmitter<boolean>();
    @Output() eventChange = new EventEmitter<void>();

    eventType = '';
    loggedUser = '';
    readableTimestamp = '';
    dataPoints: DataPoint[] = [];

    constructor(
        private eventService: EventService,
        private userService: UserService,
        private receiverService: ReceiverService,
        private authService: AuthService,
        private alertService: AlertService
    ) { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['event'] && this.event) {
            this.eventType = this.event.type;
            this.userService.getLoggedUser(this.event.userId).then(user => {
                this.loggedUser = user;
            });
            this.readableTimestamp = this.eventService.getReadableTimestamp(this.event);
            this.dataPoints = this.event.data ?? [];
        }
    }

    getFieldLabel(name: string): string {
        const config = this.eventService.getEventConfigs().find(c => c.type === this.event.type);
        return config?.fields?.find(f => f.name === name)?.label ?? name;
    }

    getFieldUnit(name: string): string {
        const config = this.eventService.getEventConfigs().find(c => c.type === this.event.type);
        return config?.data?.name === name ? (config.data.unit ?? '') : '';
    }

    closeModal() {
        this.showModal = false;
        this.showModalChange.emit(this.showModal);
    }

    confirmDeleteEvent() {
        this.eventAction = 'delete';
        this.eventActionChange.emit(this.eventAction);
    }

    async deleteEvent() {
        try {
            const currentUserId = await this.authService.getCurrentUserId();
            const observable = await this.receiverService.deleteEvent(
                this.receiverService.currentReceiverId!,
                currentUserId,
                this.event.eventId,
            );

            observable.subscribe({
                next: () => {
                    this.alertService.show('Event deleted successfully', AlertType.Success);
                    this.eventChange.emit();
                },
                error: (err) => {
                    this.alertService.show('Error deleting event. Please try again later.', AlertType.Failure);
                },
            });
        } catch (error) {
            this.alertService.show('Error deleting event. Please try again later.', AlertType.Failure);
        }
        this.closeModal();
    }
}