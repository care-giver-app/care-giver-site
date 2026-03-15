import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'lib-care-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
  standalone: true,
})
export class ModalComponent {
  @Input() show = false;
  @Input() header = '';
  @Output() exit = new EventEmitter<void>();

  onExit() {
    this.exit.emit();
  }
}
