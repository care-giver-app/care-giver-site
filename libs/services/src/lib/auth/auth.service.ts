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
    AuthError,
    resendSignUpCode,
    ResendSignUpCodeOutput,
    ResendSignUpCodeInput,
    updateUserAttribute,
    UpdateUserAttributeInput,
    UpdateUserAttributeOutput,
    getCurrentUser,
} from '@aws-amplify/auth'
import { SignInAction, SignUpCodeAction, SignUpAction, SignUpInfomation } from '@care-giver-site/models'

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

    async signInUser(email: string, password: string): Promise<SignInAction> {
        var output: SignInOutput | undefined = undefined
        var errorMessage: string | undefined = undefined
        try {
            output = await signIn({
                username: email,
                password: password
            });
        } catch (error) {
            if (error instanceof AuthError) {
                errorMessage = error.message
            } else {
                errorMessage = 'An unexpected error occurred during sign-in.'
            }
        }

        return {
            output: output,
            errorMessage: errorMessage
        }
    }

    async signUpUser(email: string, password: string, firstName: string, lastName: string): Promise<SignUpAction> {
        var output: SignUpOutput | undefined = undefined
        var errorMessage: string | undefined = undefined
        try {
            output = await signUp({
                username: email,
                password: password,
                options: {
                    userAttributes: {
                        "given_name": firstName,
                        "family_name": lastName,
                        "custom:first_time_sign_in": "true",
                    },
                    autoSignIn: true,
                }
            })
        } catch (error) {
            if (error instanceof AuthError) {
                errorMessage = error.message
            } else {
                errorMessage = 'An unexpected error occurred during sign-up.'
            }
        }
        return {
            output: output,
            errorMessage: errorMessage
        }
    }

    async confirmSignUpUser(username: string, code: string): Promise<SignUpCodeAction> {
        var output: ConfirmSignUpOutput | undefined = undefined
        var errorMessage: string | undefined = undefined
        try {
            output = await confirmSignUp({
                username: username,
                confirmationCode: code
            });
        } catch (error) {
            if (error instanceof AuthError) {
                errorMessage = error.message
            } else {
                errorMessage = 'An unexpected error occurred during sign-up confirmation.'
            }
        }

        return {
            output: output,
            errorMessage: errorMessage
        }
    }

    signOutUser(): Promise<void> {
        return signOut({
            global: true,
            oauth: {
                redirectUrl: '/auth/'
            }
        })
    }

    resendSignUpCode(email: string): Promise<ResendSignUpCodeOutput> {
        const input: ResendSignUpCodeInput = {
            username: email
        };
        return resendSignUpCode(input);
    }

    getSignUpInformation(): Promise<SignUpInfomation> {
        return fetchUserAttributes().then((attributes) => {
            return {
                email: attributes['email'] || '',
                firstName: attributes['given_name'] || '',
                lastName: attributes['family_name'] || ''
            };
        });
    }

    getCurrentUserId(): Promise<string> {
        return fetchUserAttributes().then((attributes) => {
            return attributes['custom:db_user_id'] || '';
        });
    }

    getUsersFullName(): Promise<string> {
        return fetchUserAttributes().then((attributes) => {
            const firstName = attributes['given_name'] || '';
            const lastName = attributes['family_name'] || '';
            return `${firstName} ${lastName}`.trim();
        });
    }

    getUserFirstName(): Promise<string> {
        return fetchUserAttributes().then((attributes) => {
            return attributes['given_name'] || '';
        });
    }

    addUserId(userId: string): Promise<UpdateUserAttributeOutput> {
        const input: UpdateUserAttributeInput = {
            userAttribute: {
                attributeKey: 'custom:db_user_id',
                value: userId
            }

        }
        return updateUserAttribute(input)
    }

    isFirstTimeSignIn(): Promise<boolean> {
        return fetchUserAttributes().then((attributes) => {
            return attributes['custom:first_time_sign_in'] === 'true';
        });
    }

    firstTimeSignInComplete(): Promise<UpdateUserAttributeOutput> {
        const input: UpdateUserAttributeInput = {
            userAttribute: {
                attributeKey: 'custom:first_time_sign_in',
                value: 'false'
            }

        }
        return updateUserAttribute(input)
    }

    async isLoggedIn(): Promise<boolean> {
        try {
            await getCurrentUser();
            return true;
        } catch (err) {
            return false
        }
    }
}