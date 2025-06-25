import {
    SignUpOutput,
    ConfirmSignUpOutput,
    SignInOutput,
} from '@aws-amplify/auth'

export interface SignInAction {
    output?: SignInOutput;
    errorMessage?: string;
}

export interface SignUpAction {
    output?: SignUpOutput;
    errorMessage?: string;
}

export interface SignUpCodeAction {
    output?: ConfirmSignUpOutput;
    errorMessage?: string;
}

export interface SignUpInfomation {
    email: string;
    firstName: string;
    lastName: string;
}