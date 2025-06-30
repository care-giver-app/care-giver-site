export interface User {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    primaryCareReceivers: string[];
    additionalCareReceivers: string[];
}