export interface EventMetadata {
    type: string;
    dataName: string;
    color: {
        primary: string;
        secondary: string;
        secondaryText: string;
    };
}

export interface DataPoint {
    name: string;
    value: string;
}

export interface Event {
    receiverId: string;
    eventId: string;
    userId: string;
    timestamp: string;
    type: string;
    data: DataPoint[];
}
