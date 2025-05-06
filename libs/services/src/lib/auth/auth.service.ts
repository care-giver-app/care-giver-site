import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import {
    signUp,
    SignUpOutput,
    confirmSignUp,
    ConfirmSignUpOutput,
    autoSignIn,
    signOut,
    signIn,
    SignInOutput
} from '@aws-amplify/auth'


const CLIENT_SECRET = "CLIENT_SECRET";
const CLIENT_ID = "CLIENT_ID";

const oauthEndpoint = "/oauth2/token";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private bearerToken: string | null = null;

    constructor(private http: HttpClient) { }

    getClientSecret(): string {
        return process.env[CLIENT_SECRET] || '';
    }

    getClientId(): string {
        return process.env[CLIENT_ID] || '';
    }

    retrieveBearerToken(): Observable<string> {
        if (this.bearerToken) {
            return of(this.bearerToken);
        }

        const requestBody = `grant_type=client_credentials&client_id=${this.getClientId()}&client_secret=${this.getClientSecret()}&scope=API/full`;

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        return this.http.post<{ access_token: string }>(oauthEndpoint, requestBody, { headers }).pipe(
            tap((response) => {
                this.bearerToken = response.access_token; // Cache the token
            }),
            switchMap((response) => of(response.access_token))
        );
    }

    getBearerToken(): Observable<string> {
        return this.retrieveBearerToken();
    }

    async signInUser(email: string, password: string): Promise<SignInOutput> {
        return await signIn({
            username: email,
            password: password
        })
    }

    async signUpUser(email: string, password: string, firstName: string, lastName: string): Promise<SignUpOutput> {
        return await signUp({
            username: email,
            password: password,
            options: {
                userAttributes: {
                    given_name: firstName,
                    family_name: lastName,
                },
                autoSignIn: true,
            }
        })
    }

    async confirmSignUpUser(username: string, code: string): Promise<ConfirmSignUpOutput> {
        return await confirmSignUp({
            username: username,
            confirmationCode: code,
        })
    }

    signOutUser(): Promise<void> {
        return signOut({
            global: true,
            oauth: {
                redirectUrl: '/auth/'
            }
        })
    }


    async handleNextStep(step: SignUpOutput["nextStep"]) {
        switch (step.signUpStep) {
            case "CONFIRM_SIGN_UP":

            // Redirect end-user to confirm-sign up screen.

            case "COMPLETE_AUTO_SIGN_IN":
                const codeDeliveryDetails = step.codeDeliveryDetails;
                if (codeDeliveryDetails) {
                    // Redirect user to confirm-sign-up with link screen.
                }
                const signInOutput = await autoSignIn();
            // handle sign-in steps
        }
    }


    // handleSignInNextStep(step: SignInOutput["nextStep"]): string {
    //     switch (step.signInStep) {
    //         case "DONE":
    //             return "reroute"
    //         case "CONFIRM_SIGN_UP":
    //             return "confirm"
    //     }
    // }

}