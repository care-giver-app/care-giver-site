import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { Amplify } from 'aws-amplify';


Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "us-east-2_0JxGIf7SE",
      userPoolClientId: "5406o7mlorvet2i25oq52qqoe1",
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

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
