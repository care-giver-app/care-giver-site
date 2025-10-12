import { Component, inject, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertType, Receiver, Relationships } from '@care-giver-site/models'
import { AlertService, AuthService, ReceiverService, UserService } from '@care-giver-site/services'
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ModalComponent } from '../modal/modal.component';


@Component({
  selector: 'care-receiver-selection',
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatIconModule, FormsModule, MatInputModule, MatFormFieldModule, ModalComponent],
  templateUrl: './receiver-selection.component.html',
  styleUrl: './receiver-selection.component.css',
})
export class ReceiverSelectionComponent implements OnInit {
  @Output() receiverChange = new EventEmitter<void>();

  private receiverService = inject(ReceiverService);
  private authService = inject(AuthService);
  private userService = inject(UserService)
  private alertService = inject(AlertService);

  receiver: Receiver | undefined = undefined;
  receivers: Receiver[] = [];
  selectedReceiverId: string = '';
  userId: string = '';

  showAddReceiverModal = false;
  showAddCareGiverModal = false;

  newReceiver = { firstName: '', lastName: '' };
  additionalCareGiverEmail = '';

  ngOnInit() {
    this.fetchReceivers();
  }

  fetchReceivers() {
    this.authService.getCurrentUserId().then((userId) => {
      this.userId = userId;
      this.userService.getUserRelationships(this.userId).then((relationships: Relationships | undefined) => {
        if (relationships) {
          const receiverIds = relationships.relationships.map(r => r.receiverId);
          this.receiverService.getReceivers(
            this.userId,
            receiverIds
          ).then((receivers: Receiver[]) => {
            this.receivers = receivers;
            if (this.receiverService.currentReceiverId) {
              const currentReceiver = this.receivers.find(r => r.receiverId === this.receiverService.currentReceiverId);
              if (currentReceiver) {
                this.selectReceiver(currentReceiver.receiverId);
              }
            } else if (this.receivers.length) {
              this.selectReceiver(this.receivers[0].receiverId);
            }
          })
        }
      })
    });
  }

  selectReceiver(receiverId: string) {
    this.selectedReceiverId = receiverId;
    this.receiver = this.receivers.find(r => r.receiverId === receiverId);
    this.receiverService.setCurrentReceiver(receiverId);
    this.receiverChange.emit();
  }

  getInitials(): string {
    if (this.receiver) {
      const firstInitial = this.receiver.firstName.charAt(0).toUpperCase();
      const lastInitial = this.receiver.lastName.charAt(0).toUpperCase();
      return `${firstInitial}${lastInitial}`;
    }
    return '';
  }


  submitAddReceiver() {
    this.userService.addCareReceiver(this.userId, this.newReceiver.firstName, this.newReceiver.lastName).then((resp) => {
      if (resp) {
        this.alertService.show('Care Receiver added successfully', AlertType.Success);
        this.selectReceiver(resp.receiverId);
      } else {
        this.alertService.show('Error adding care receiver. Please try again later.', AlertType.Failure);
      }
      this.showAddReceiverModal = false;
      this.newReceiver = { firstName: '', lastName: '' };
    })
  }

  submitAddCareGiver() {
    this.userService.addCareGiver(this.userId, this.selectedReceiverId, this.additionalCareGiverEmail).then((resp) => {
      if (resp) {
        this.alertService.show('Care Giver added successfully', AlertType.Success);
      } else {
        this.alertService.show('Error adding care giver. Please try again later.', AlertType.Failure);
      }
      this.showAddCareGiverModal = false;
      this.additionalCareGiverEmail = '';
    })
  }
}

