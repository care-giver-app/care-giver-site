import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { AmplifyAuthenticatorModule, AuthenticatorService } from '@aws-amplify/ui-angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, UserService } from '@care-giver-site/services';
import { FormsModule } from '@angular/forms';
import { SignInOutput, signOut, autoSignIn } from 'aws-amplify/auth';

const CONFIRM_SIGN_UP = 'CONFIRM_SIGN_UP'
const DONE = 'DONE'
const COMPLETE_AUTO_SIGN_IN = 'COMPLETE_AUTO_SIGN_IN'

@Component({
  selector: 'lib-auth',
  imports: [CommonModule, AmplifyAuthenticatorModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);

  showCodeVerification = false;
  activeTab: 'signIn' | 'signUp' = 'signIn';

  userId: string = '';

  firstName: string = '';
  lastName: string = '';
  email: string = '';

  private router = new Router()
  constructor(public authenticator: AuthenticatorService, private ref: ChangeDetectorRef) {
  }

  routeToHome() {
    this.router.navigate(['/']);
  }

  setActiveTab(tab: 'signIn' | 'signUp') {
    this.activeTab = tab;
  }

  signIn(form: any) {
    const { email, password } = form.value;
    this.authService.signInUser(email, password).then((nextStep) => {
      this.handleSignInNextStep(nextStep, email)
    })
  }

  signUp(form: any) {
    const { firstName, lastName, email, password } = form.value;

    this.authService.signUpUser(
      email,
      password,
      firstName,
      lastName,
    ).then(({ isSignUpComplete, userId, nextStep }) => {
      console.log('Sign up next step:', nextStep);
      switch (nextStep.signUpStep) {
        case CONFIRM_SIGN_UP:
          this.showCodeVerification = true;
          this.userId = userId || '';
          this.firstName = firstName;
          this.lastName = lastName;
          this.email = email;
          break;
        case COMPLETE_AUTO_SIGN_IN:
          autoSignIn().then()
          this.routeToHome();
          break;
        case DONE:
          this.routeToHome();
          break;
      }
    })

  }

  verifyCode(form: any) {
    const { code } = form.value;

    this.authService.confirmSignUpUser(this.userId, code).then(({ nextStep: confirmSignUpNextStep }) => {
      console.log('Confirm sign up next step:', confirmSignUpNextStep);

      switch (confirmSignUpNextStep.signUpStep) {
        case CONFIRM_SIGN_UP:
          this.showCodeVerification = true;
          break;
        case COMPLETE_AUTO_SIGN_IN:
          autoSignIn().then()
          this.userService.createUser(this.firstName, this.lastName, this.email).pipe(
          ).subscribe({
            next: () => {
              this.routeToHome();
            },
            error: (err) => {
              console.error('Error during sign-up:', err);
            }
          });
          this.routeToHome();
          break;
        case DONE:
          this.userService.createUser(this.firstName, this.lastName, this.email).subscribe({
            error: (err) => {
              console.error('Error during sign-up:', err);
            }
          });
          this.routeToHome();
          break;
      }
    })
  }


  handleSignInNextStep(output: SignInOutput, email: string) {
    console.log(output)

    switch (output.nextStep.signInStep) {
      case "DONE":
        this.routeToHome();
        break;
      case "CONFIRM_SIGN_UP":
        this.showCodeVerification = true;
        this.email = email;
    }
  }
}
