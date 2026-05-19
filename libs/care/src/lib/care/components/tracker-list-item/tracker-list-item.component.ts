import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Tracker } from '@care-giver-site/models';

@Component({
  selector: 'care-tracker-list-item',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './tracker-list-item.component.html',
  styleUrl: './tracker-list-item.component.css',
})
export class TrackerListItemComponent {
  @Input({ required: true }) tracker!: Tracker;

  @Output() editRequested = new EventEmitter<Tracker>();
  @Output() deleteRequested = new EventEmitter<Tracker>();
}
