import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'care-modal',
    templateUrl: './modal.component.html',
    styleUrl: './modal.component.css',
    standalone: true
})
export class ModalComponent {
    @Input() show = false;
    @Input() header = '';
    @Output() close = new EventEmitter<void>();

    onClose() {
        this.close.emit();
    }
}