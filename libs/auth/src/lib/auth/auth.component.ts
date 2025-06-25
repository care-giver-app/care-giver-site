import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { AmplifyAuthenticatorModule, AuthenticatorService } from '@aws-amplify/ui-angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, UserService } from '@care-giver-site/services';
import { FormsModule } from '@angular/forms';
import { SignInAction, SignUpCodeAction, SignUpAction } from '@care-giver-site/models'

const CONFIRM_SIGN_UP = 'CONFIRM_SIGN_UP'
const DONE = 'DONE'

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
  signUpEmail: string = '';

  signInError: string = '';
  signUpError: string = '';
  signUpCodeError: string = '';

  signUpCodeMessage: string = '';

  passwordsDoNotMatch = false;


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
    this.authService.signInUser(email, password)
      .then((action: SignInAction) => {
        if (action.errorMessage) {
          this.signInError = action.errorMessage;
        } else if (action.output) {
          this.handleSignInNextStep(action.output.nextStep.signInStep, email);
        }
      })
  }

  handleSignInNextStep(nextStep: string, email: string) {
    switch (nextStep) {
      case DONE:
        this.authService.isFirstTimeSignIn().then((isFirstTimeSignIn) => {
          if (isFirstTimeSignIn) {
            this.runFirstTimeSignInExperience();
          }
          this.routeToHome();
        })
        break;
      case CONFIRM_SIGN_UP:
        this.showCodeVerification = true;
        this.signUpEmail = email;
        this.resendSignUpCode();
        break;
    }
  }

  runFirstTimeSignInExperience() {
    this.authService.getSignUpInformation().then((signUpInfo) => {
      this.userService.createUser(
        signUpInfo.firstName,
        signUpInfo.lastName,
        signUpInfo.email
      ).subscribe((resp) => {
        this.authService.addUserId(resp.userId).then(() => {
          this.authService.firstTimeSignInComplete()
        })
      })
    })
  }

  signUp(form: any) {
    const { firstName, lastName, email, password, confirmPassword } = form.value;
    this.passwordsDoNotMatch = password !== confirmPassword;

    if (form.invalid || this.passwordsDoNotMatch) {
      this.signUpError = "Please fill out all required fields correctly.";
      return;
    }

    this.authService.signUpUser(email, password, firstName, lastName).then((action: SignUpAction) => {
      if (action.errorMessage) {
        this.signUpError = action.errorMessage;
      } else if (action.output) {
        this.handleSignUpNextStep(action.output.nextStep.signUpStep, action.output.userId || '', email)
      }
    })

  }

  handleSignUpNextStep(nextStep: string, userAuthId: string, email: string) {
    switch (nextStep) {
      case CONFIRM_SIGN_UP:
        this.showCodeVerification = true;
        this.userId = userAuthId;
        this.signUpEmail = email;
        break;
      case DONE:
        this.routeToHome();
        break;
    }
  }

  verifyCode(form: any) {
    this.signUpCodeMessage = '';
    const { code } = form.value;

    this.authService.confirmSignUpUser(this.userId, code).then((action: SignUpCodeAction) => {
      if (action.errorMessage) {
        this.signUpCodeError = action.errorMessage
      } else if (action.output) {
        this.handleSignUpCodeNextStep(action.output.nextStep.signUpStep)
      }
    })
  }

  handleSignUpCodeNextStep(nextStep: string) {
    switch (nextStep) {
      case CONFIRM_SIGN_UP:
        this.showCodeVerification = true;
        break;
      case DONE:

        this.showCodeVerification = false;
        this.setActiveTab('signIn')
        break;
    }
  }

  resendSignUpCode() {
    this.authService.resendSignUpCode(this.signUpEmail).then((response) => {
      this.showCodeVerification = true;
      this.signUpCodeError = '';
      this.signUpCodeMessage = 'A new verification code has been sent to your email.';
    })
  }

}
