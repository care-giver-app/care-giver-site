import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventTableComponent } from '../../event-table/event-table.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import { EventModalComponent } from '../../modal/event-modal/event-modal.component';
import {
  ReceiverService,
  AuthService,
  UserService,
  AlertService,
} from '@care-giver-site/services';
import { AlertType } from '@care-giver-site/models';
import { AlertComponent } from '../../alert/alert.component';
import { ChartComponent } from '../../chart/chart.component';
import { ReceiverSelectionComponent } from '../../receiver-selection/receiver-selection.component';
import { ModalComponent } from '../../modal/modal.component';

@Component({
  selector: 'lib-receiver-settings',
  imports: [
    CommonModule,
    NavbarComponent,
    FormsModule,
    EventTableComponent,
    AlertComponent,
    EventModalComponent,
    ChartComponent,
    ReceiverSelectionComponent,
    ModalComponent,
  ],
  templateUrl: './receiver-settings.component.html',
  styleUrl: './receiver-settings.component.css',
})
export class ReceiverSettingsComponent {
  private receiverService = inject(ReceiverService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private alertService = inject(AlertService);

  selectedReceiverId = '';
  userId = '';

  showAddCareGiverModal = false;
  isLoading = true;

  newReceiver = { firstName: '', lastName: '' };
  additionalCareGiverEmail = '';

  onReceiverChange() {
    console.log('Receiver changed:', this.selectedReceiverId);
  }

  submitAddCareGiver() {
    this.authService.getCurrentUserId().then((userId) => {
      if (!this.receiverService.currentReceiverId) {
        this.alertService.show('No receiver selected', AlertType.Failure);
        return;
      }

      this.userService
        .addCareGiver(
          userId,
          this.receiverService.currentReceiverId,
          this.additionalCareGiverEmail
        )
        .then((resp) => {
          if (resp) {
            this.alertService.show(
              'Care Giver added successfully',
              AlertType.Success
            );
          } else {
            this.alertService.show(
              'Error adding care giver. Please try again later.',
              AlertType.Failure
            );
          }
          this.showAddCareGiverModal = false;
          this.additionalCareGiverEmail = '';
        });
    });
  }
}
