import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

import {
    Tracker,
    TrackerField,
    AlertThreshold,
    ColorConfig,
    TrackerKind,
    CreateTrackerRequest,
    UpdateTrackerRequest,
} from '@care-giver-site/models';

export const TRACKER_COLOR_PRESETS: ColorConfig[] = [
    { primary: '#E74C3C', secondary: '#FADBD8' },
    { primary: '#27AE60', secondary: '#D4EFDF' },
    { primary: '#2980B9', secondary: '#D6EAF8' },
    { primary: '#8E44AD', secondary: '#E8DAEF' },
    { primary: '#E67E22', secondary: '#FDEBD0' },
    { primary: '#16A085', secondary: '#D1F2EB' },
    { primary: '#F1C40F', secondary: '#FEF9E7' },
    { primary: '#7F8C8D', secondary: '#EAECEE' },
];

const TRACKER_KINDS: TrackerKind[] = ['event', 'event_with_note', 'measurement', 'scheduled'];

@Component({
  selector: 'care-tracker-form',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './tracker-form.component.html',
  styleUrl: './tracker-form.component.css',
})
export class TrackerFormComponent implements OnChanges {
  @Input({ required: true }) mode!: 'create' | 'edit';
  @Input() initialValue: Partial<Tracker> | null = null;
  @Input() nameConflict = false;
  @Input() isSaving = false;

  @Output() save = new EventEmitter<CreateTrackerRequest | UpdateTrackerRequest>();
  @Output() cancel = new EventEmitter<void>();

  colorPresets = TRACKER_COLOR_PRESETS;
  kindOptions = TRACKER_KINDS;

  name = '';
  kind: TrackerKind = 'event';
  icon = '';
  selectedColor: ColorConfig = TRACKER_COLOR_PRESETS[0];
  isActive = true;
  fields: TrackerField[] = [];
  alertThresholds: AlertThreshold[] = [];
  validationError: string | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialValue'] && this.initialValue) {
      this.name = this.initialValue.name ?? '';
      this.kind = this.initialValue.kind ?? 'event';
      this.icon = this.initialValue.icon ?? '';
      this.selectedColor = this.initialValue.color ?? TRACKER_COLOR_PRESETS[0];
      this.isActive = this.initialValue.isActive ?? true;
      this.fields = this.initialValue.fields ? [...this.initialValue.fields.map(f => ({ ...f }))] : [];
      this.alertThresholds = this.initialValue.alertThresholds
        ? [...this.initialValue.alertThresholds.map(t => ({ ...t }))]
        : [];
    }
    if (changes['nameConflict'] && !this.nameConflict) {
      // clear conflict when parent resets it
    }
  }

  get showAlertThresholds(): boolean {
    return this.kind === 'measurement';
  }

  addField() {
    this.fields.push({ name: '', label: '', inputType: 'text', required: false });
  }

  removeField(index: number) {
    this.fields.splice(index, 1);
  }

  addThreshold() {
    this.alertThresholds.push({ fieldName: '', comparator: '>=', value: 0 });
  }

  removeThreshold(index: number) {
    this.alertThresholds.splice(index, 1);
  }

  selectColor(color: ColorConfig) {
    this.selectedColor = color;
  }

  isColorSelected(color: ColorConfig): boolean {
    return color.primary === this.selectedColor.primary;
  }

  onSubmit() {
    this.validationError = null;

    if (!this.name.trim()) {
      this.validationError = 'Name is required.';
      return;
    }

    if (this.kind === 'measurement' && this.fields.length === 0) {
      this.validationError = 'Measurement trackers require at least one field.';
      return;
    }

    if (this.mode === 'create') {
      const request: CreateTrackerRequest = {
        receiverId: '',
        name: this.name.trim(),
        kind: this.kind,
        fields: this.fields,
        alertThresholds: this.alertThresholds.length > 0 ? this.alertThresholds : undefined,
        icon: this.icon.trim(),
        color: this.selectedColor,
        isActive: this.isActive,
      };
      this.save.emit(request);
    } else {
      const request: UpdateTrackerRequest = {
        name: this.name.trim(),
        fields: this.fields,
        alertThresholds: this.alertThresholds.length > 0 ? this.alertThresholds : undefined,
        icon: this.icon.trim(),
        color: this.selectedColor,
        isActive: this.isActive,
      };
      this.save.emit(request);
    }
  }
}
