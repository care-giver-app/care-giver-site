export interface User {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
}

export interface Relationship {
    userId: string;
    receiverId: string;
    primaryCareGiver: boolean;
    emailNotifications: boolean;
}

export interface Relationships {
    relationships: Relationship[];
}