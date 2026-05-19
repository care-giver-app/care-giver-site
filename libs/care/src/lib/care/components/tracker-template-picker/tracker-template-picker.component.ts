import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { TrackerTemplate } from '@care-giver-site/models';

@Component({
  selector: 'care-tracker-template-picker',
  standalone: true,
  imports: [MatProgressSpinnerModule, MatButtonModule],
  templateUrl: './tracker-template-picker.component.html',
  styleUrl: './tracker-template-picker.component.css',
})
export class TrackerTemplatePickerComponent {
  @Input({ required: true }) templates: TrackerTemplate[] = [];
  @Input() isLoading = false;
  @Input() loadError = false;

  @Output() templateSelected = new EventEmitter<TrackerTemplate | null>();

  selectTemplate(template: TrackerTemplate) {
    this.templateSelected.emit(template);
  }

  selectFromScratch() {
    this.templateSelected.emit(null);
  }
}
