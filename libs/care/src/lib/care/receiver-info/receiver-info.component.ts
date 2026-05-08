import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Receiver } from '@care-giver-site/models';

@Component({
  selector: 'care-receiver-info',
  imports: [CommonModule],
  templateUrl: './receiver-info.component.html',
  styleUrl: './receiver-info.component.css',
})
export class ReceiverInfoComponent {
  @Input() receiver!: Receiver;
}
