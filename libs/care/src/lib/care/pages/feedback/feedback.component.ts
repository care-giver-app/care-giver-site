import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { AlertComponent } from '../../alert/alert.component';
import { AlertService, FeedbackService } from '@care-giver-site/services';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AlertType } from 'libs/models/src/alert';

@Component({
  selector: 'lib-feedback',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    FormsModule,
    AlertComponent,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css'],
})
export class FeedbackComponent{
  message = '';
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(private alertService: AlertService, private feedbackService: FeedbackService) {}

  async onSubmit(): Promise<void> {
    if (!this.message.trim()) {
      this.alertService.show('Please enter a message before submitting.', AlertType.Failure);
      return;
    }

    this.isSubmitting = true;

    try {
      const observable = await this.feedbackService.submitFeedback(this.message);
      observable.subscribe({
        next: (_response) => {
          this.message = '';
          this.alertService.show('Thank you for your feedback!', AlertType.Success);
          this.isSubmitting = false;
      },
        error: (_error) => {
          this.alertService.show('Failed to submit feedback. Please try again.', AlertType.Failure);
          this.isSubmitting = false;
        }
      });
    } catch (error) {
      this.alertService.show('An unexpected error occurred. Please try again.', AlertType.Failure);
    }
  }
}