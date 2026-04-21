export interface FieldConfig {
    name: string;
    label: string;
    inputType: 'text' | 'textarea' | 'number' | 'date';
    required: boolean;
    placeholder: string;
}

export interface EventMetadata {
    type: string;
    data?: {
        name: string;
        unit: string;
    };
    fields?: FieldConfig[];
    color: {
        primary: string;
        secondary: string;
    };
    graph?: {
        type: 'line' | 'scatter';
        title: string;
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
    startTime: string;
    endTime: string;
    type: string;
    data: DataPoint[];
    note?: string;
}

export interface EventRequest {
    receiverId: string;
    userId: string;
    startTime: string;
    endTime: string;
    type: string;
    data?: DataPoint[];
    note?: string;
}
