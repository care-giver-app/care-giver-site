import { Injectable } from '@angular/core';
import {
    signUp,
    SignUpOutput,
    confirmSignUp,
    ConfirmSignUpOutput,
    fetchUserAttributes,
    signOut,
    signIn,
    SignInOutput,
    fetchAuthSession,
} from '@aws-amplify/auth'

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    constructor() { }

    getBearerToken(): Promise<string> {
        return fetchAuthSession().then((session) => {
            return `Bearer ${session.tokens?.accessToken.toString() || ''}`;
        });
    }

    async signInUser(email: string, password: string): Promise<SignInOutput> {
        return await signIn({
            username: email,
            password: password
        })
    }

    async signUpUser(userId: string, email: string, password: string, firstName: string, lastName: string): Promise<SignUpOutput> {
        return signUp({
            username: email,
            password: password,
            options: {
                userAttributes: {
                    "given_name": firstName,
                    "family_name": lastName,
                    "custom:user_id": userId
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

    getCurrentUserId(): Promise<string> {
        return fetchUserAttributes().then((attributes) => {
            return attributes['custom:user_id'] || '';
        });
    }

}