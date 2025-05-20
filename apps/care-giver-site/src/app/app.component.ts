import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Amplify } from 'aws-amplify';

if (!process.env['USER_POOL_ID']) {
  throw new Error('USER_POOL_ID is not defined');
}

if (!process.env['USER_POOL_CLIENT_ID']) {
  throw new Error('USER_POOL_CLIENT_ID is not defined');
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env['USER_POOL_ID'],
      userPoolClientId: process.env['USER_POOL_CLIENT_ID'],
      identityPoolId: "",
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: "code",
      userAttributes: {
        email: {
          required: true,
        },
        given_name: {
          required: true,
        },
        family_name: {
          required: true,
        },
      },
      allowGuestAccess: true,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
})

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Care to Sher';
}
