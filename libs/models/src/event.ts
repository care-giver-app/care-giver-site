export interface FieldConfig {
    name: string;
    label: string;
    inputType: 'text' | 'textarea' | 'number' | 'date';
    required: boolean;
    placeholder: string;
}

export interface AlertThresholds {
    yellow: number;
    red: number;
    critical: number;
}

export interface MonitorConfig {
    alertThresholds?: AlertThresholds;
    showLastValue?: boolean;
}

export interface UpcomingConfig {
    show: boolean;
    lookAheadDays: number;
}

export interface EventMetadata {
    type: string;
    icon: string;
    color: {
        primary: string;
        secondary: string;
    };
    hasQuickAdd: boolean;
    monitor?: MonitorConfig;
    upcoming?: UpcomingConfig;
    data?: {
        name: string;
        unit: string;
    };
    fields?: FieldConfig[];
    graph?: {
        type: 'line' | 'scatter';
        title: string;
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
