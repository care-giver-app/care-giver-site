
export interface DatabaseEvent {
    type: string;
    name: string;
    data: any;
    dataName: string;
}

export interface EventMetadata {
    type: string;
    name: string;
    dataName: string;
    color: {
        primary: string;
        secondary: string;
        secondaryText: string;
    };
}

export interface Event {
    type: string;
    data: any;
    timestamp: Date;
    user: string;
}
