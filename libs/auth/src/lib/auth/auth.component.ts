import { Component } from '@angular/core';
import { Amplify } from 'aws-amplify';
import outputs from '../../../../../amplify_outputs.json';
import { AmplifyAuthenticatorModule, AuthenticatorService } from '@aws-amplify/ui-angular';
import { CommonModule } from '@angular/common';

Amplify.configure(outputs);

@Component({
  selector: 'lib-auth',
  imports: [CommonModule, AmplifyAuthenticatorModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent {
  constructor(public authenticator: AuthenticatorService) {
    Amplify.configure(outputs);
  }
}