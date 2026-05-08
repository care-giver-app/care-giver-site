import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';

import { ReceiverService, AuthService, UserService, AlertService } from '@care-giver-site/services';
import { Receiver, CareGiver, AlertType } from '@care-giver-site/models';
import { ReceiverInfoComponent } from '../../receiver-info/receiver-info.component';
import { CareGiverListComponent } from '../../care-giver-list/care-giver-list.component';
import { AlertComponent } from '../../alert/alert.component';

@Component({
  selector: 'lib-receiver-settings',
  imports: [
    MatProgressSpinnerModule,
    ReceiverInfoComponent,
    CareGiverListComponent,
    AlertComponent,
  ],
  templateUrl: './receiver-settings.component.html',
  styleUrl: './receiver-settings.component.css',
})
export class ReceiverSettingsComponent implements OnInit, OnDestroy {
  private receiverService = inject(ReceiverService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private alertService = inject(AlertService);

  @ViewChild(CareGiverListComponent) careGiverList!: CareGiverListComponent;

  private destroy$ = new Subject<void>();

  showSpinner = false;
  receiver: Receiver | undefined = undefined;
  careGivers: CareGiver[] = [];
  isPrimary = false;
  userId = '';

  get hasReceiver(): boolean {
    return !!this.receiverService.currentReceiverId;
  }

  ngOnInit() {
    this.receiverService.receiverChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadData());

    if (this.receiverService.currentReceiverId) {
      this.loadData();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadData() {
    const receiverId = this.receiverService.currentReceiverId;
    if (!receiverId) return;

    this.showSpinner = true;
    this.receiver = undefined;
    this.isPrimary = false;
    this.careGivers = [];

    try {
      this.userId = await this.authService.getCurrentUserId();

      const [relationships, careGivers, receiverObs] = await Promise.all([
        this.userService.getUserRelationships(this.userId),
        this.userService.getCareGiversForReceiver(receiverId),
        this.receiverService.getReceiver(receiverId, this.userId),
      ]);

      // Bail if receiver changed while loading
      if (this.receiverService.currentReceiverId !== receiverId) return;

      this.careGivers = careGivers;

      if (relationships) {
        const rel = relationships.relationships.find(r => r.receiverId === receiverId);
        this.isPrimary = rel?.primaryCareGiver ?? false;
      }

      this.receiver = await firstValueFrom(receiverObs);
    } catch {
      this.alertService.show('Failed to load receiver settings. Please try again.', AlertType.Failure);
    } finally {
      this.showSpinner = false;
    }
  }

  async onAddCareGiver(email: string) {
    const receiverId = this.receiverService.currentReceiverId;
    if (!receiverId || !this.userId) {
      return;
    }

    try {
      const result = await this.userService.addCareGiver(this.userId, receiverId, email);
      if (result) {
        this.alertService.show('Caregiver added successfully.', AlertType.Success);
        this.careGivers = await this.userService.getCareGiversForReceiver(receiverId);
      } else {
        this.alertService.show('Failed to add caregiver. Please try again.', AlertType.Failure);
        this.careGiverList.reopenModal();
      }
    } catch {
      this.alertService.show('Failed to add caregiver. Please try again.', AlertType.Failure);
      this.careGiverList.reopenModal();
    }
  }
}
