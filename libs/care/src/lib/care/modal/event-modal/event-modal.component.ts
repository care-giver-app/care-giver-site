import { Component, Input, SimpleChanges, OnChanges, Output, EventEmitter } from '@angular/core';
import { ModalComponent } from '../modal.component';
import { Event, DataPoint, AlertType } from '@care-giver-site/models';
import { EventService, UserService, ReceiverService, AuthService, AlertService } from '@care-giver-site/services';

@Component({
    selector: 'care-event-modal',
    templateUrl: './event-modal.component.html',
    styleUrl: './event-modal.component.css',
    imports: [ModalComponent]
})
export class EventModalComponent implements OnChanges {
    @Input() event!: Event;
    @Input() eventAction!: 'create' | 'update' | 'delete' | 'view';
    @Input() showModal!: boolean;
    @Output() showModalChange = new EventEmitter<boolean>();
    @Output() eventChange = new EventEmitter<void>();

    eventType: string = '';
    loggedUser: string = '';
    readableTimestamp: string = '';
    data: DataPoint | undefined = undefined;
    dataUnit: string | undefined = undefined;

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
                this.loggedUser = user
            })
            this.readableTimestamp = this.eventService.getReadableTimestamp(this.event);
            if (this.event.data && this.event.data.length > 0) {
                this.data = this.event.data[0];
                this.dataUnit = this.eventService.getDataUnit(this.event);
            }
        }
    }

    closeModal() {
        this.showModal = false;
        this.showModalChange.emit(this.showModal);
    }

    confirmDeleteEvent() {
        this.eventAction = 'delete';
    }

    async deleteEvent() {
        try {
            const currentUserId = await this.authService.getCurrentUserId();
            console.log('Current Receiver ID:', this.receiverService.currentReceiverId);
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