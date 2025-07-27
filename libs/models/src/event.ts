export interface EventMetadata {
    type: string;
    data?: {
        name: string;
        unit: string;
    }
    color: {
        primary: string;
        secondary: string;
        secondaryText: string;
    };
    icon: string;
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
