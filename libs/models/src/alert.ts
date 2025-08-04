export enum AlertType {
    Success = 'success',
    Failure = 'failure',
    Info = 'info'
}

export interface Alert {
    id: number;
    message: string;
    type: AlertType;
}