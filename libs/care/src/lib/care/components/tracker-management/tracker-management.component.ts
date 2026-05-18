import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { TrackerService } from '@care-giver-site/services';
import { AlertService } from '@care-giver-site/services';
import {
    Tracker,
    TrackerTemplate,
    CreateTrackerRequest,
    UpdateTrackerRequest,
    AlertType,
} from '@care-giver-site/models';
import { TrackerListItemComponent } from '../tracker-list-item/tracker-list-item.component';
import { TrackerTemplatePickerComponent } from '../tracker-template-picker/tracker-template-picker.component';
import { TrackerFormComponent } from '../tracker-form/tracker-form.component';
import { ModalComponent } from '../../modal/modal.component';

@Component({
  selector: 'care-tracker-management',
  standalone: true,
  imports: [
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    TrackerListItemComponent,
    TrackerTemplatePickerComponent,
    TrackerFormComponent,
    ModalComponent,
  ],
  templateUrl: './tracker-management.component.html',
  styleUrl: './tracker-management.component.css',
})
export class TrackerManagementComponent implements OnInit, OnDestroy {
  @Input({ required: true }) receiverId!: string;
  @Input() isPrimary = false;

  private trackerService = inject(TrackerService);
  private alertService = inject(AlertService);
  private destroy$ = new Subject<void>();

  trackers: Tracker[] = [];
  templates: TrackerTemplate[] = [];
  isLoading = false;
  loadError = false;
  templatesLoading = false;
  templatesError = false;

  showCreateModal = false;
  showEditModal = false;
  createStep: 1 | 2 = 1;
  selectedTemplate: TrackerTemplate | null = null;
  editingTracker: Tracker | null = null;
  deletingTracker: Tracker | null = null;

  nameConflict = false;
  isSaving = false;

  ngOnInit() {
    this.trackerService.trackers$
      .pipe(takeUntil(this.destroy$))
      .subscribe(trackers => (this.trackers = trackers));

    this.loadTrackers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadTrackers() {
    this.isLoading = true;
    this.loadError = false;
    const result = await this.trackerService.getTrackers(this.receiverId);
    this.isLoading = false;
    if (result === undefined) {
      this.loadError = true;
    }
  }

  async openCreateModal() {
    this.showCreateModal = true;
    this.createStep = 1;
    this.selectedTemplate = null;
    this.nameConflict = false;
    this.templatesLoading = true;
    this.templatesError = false;
    const result = await this.trackerService.getTemplates();
    this.templatesLoading = false;
    if (result === undefined) {
      this.templatesError = true;
    } else {
      this.templates = result;
    }
  }

  onTemplateSelected(template: TrackerTemplate | null) {
    this.selectedTemplate = template;
    this.createStep = 2;
    this.nameConflict = false;
  }

  async onCreateSave(event: CreateTrackerRequest | UpdateTrackerRequest) {
    const request = event as CreateTrackerRequest;
    this.isSaving = true;
    this.nameConflict = false;
    const result = await this.trackerService.createTracker({
      ...request,
      receiverId: this.receiverId,
    });
    this.isSaving = false;
    if (result.conflict) {
      this.nameConflict = true;
      return;
    }
    if (result.success) {
      this.alertService.show('Tracker created.', AlertType.Success);
      this.showCreateModal = false;
    } else {
      this.alertService.show('Failed to create tracker. Please try again.', AlertType.Failure);
    }
  }

  onCreateCancel() {
    this.showCreateModal = false;
  }

  async onEditRequested(tracker: Tracker) {
    this.nameConflict = false;
    const fresh = await this.trackerService.getTracker(tracker.trackerId, this.receiverId);
    this.editingTracker = fresh ?? tracker;
    this.showEditModal = true;
  }

  async onEditSave(event: CreateTrackerRequest | UpdateTrackerRequest) {
    if (!this.editingTracker) return;
    const request = event as UpdateTrackerRequest;
    this.isSaving = true;
    this.nameConflict = false;
    const result = await this.trackerService.updateTracker(
      this.editingTracker.trackerId,
      this.receiverId,
      request,
    );
    this.isSaving = false;
    if (result.conflict) {
      this.nameConflict = true;
      return;
    }
    if (result.success) {
      this.showEditModal = false;
      this.editingTracker = null;
    } else {
      this.alertService.show('Failed to update tracker. Please try again.', AlertType.Failure);
    }
  }

  onEditCancel() {
    this.showEditModal = false;
    this.editingTracker = null;
  }

  onDeleteRequested(tracker: Tracker) {
    this.deletingTracker = tracker;
  }

  async confirmDelete() {
    if (!this.deletingTracker) return;
    const success = await this.trackerService.deleteTracker(
      this.deletingTracker.trackerId,
      this.receiverId,
    );
    if (success) {
      this.alertService.show('Tracker deleted.', AlertType.Success);
    } else {
      this.alertService.show('Failed to delete tracker. Please try again.', AlertType.Failure);
    }
    this.deletingTracker = null;
  }

  cancelDelete() {
    this.deletingTracker = null;
  }

  get createInitialValue(): Partial<Tracker> | null {
    if (!this.selectedTemplate) return null;
    return {
      name: this.selectedTemplate.name,
      kind: this.selectedTemplate.kind,
      fields: this.selectedTemplate.fields,
      icon: this.selectedTemplate.icon,
      color: this.selectedTemplate.color,
    };
  }
}
