import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CareGiver } from '@care-giver-site/models';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'care-care-giver-list',
  imports: [FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, ModalComponent],
  templateUrl: './care-giver-list.component.html',
  styleUrl: './care-giver-list.component.css',
})
export class CareGiverListComponent {
  @Input() careGivers: CareGiver[] = [];
  @Input() isPrimary = false;
  @Output() addCareGiver = new EventEmitter<string>();

  showAddModal = false;
  newCareGiverEmail = '';

  submitAddCareGiver() {
    if (!this.newCareGiverEmail.trim()) return;
    this.addCareGiver.emit(this.newCareGiverEmail.trim());
    this.showAddModal = false;
    this.newCareGiverEmail = '';
  }
}
