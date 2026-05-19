export type TrackerKind = 'event' | 'event_with_note' | 'measurement' | 'scheduled';

export interface TrackerField {
    name: string;
    label: string;
    inputType: string;
    required: boolean;
    placeholder?: string;
}

export interface AlertThreshold {
    fieldName: string;
    comparator: string;
    value: number;
    unit?: string;
}

export interface ColorConfig {
    primary: string;
    secondary: string;
}

export interface Tracker {
    trackerId: string;
    receiverId: string;
    name: string;
    kind: TrackerKind;
    fields: TrackerField[];
    alertThresholds?: AlertThreshold[];
    icon: string;
    color: ColorConfig;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface MonitorAlertThresholds {
    yellow: number;
    red: number;
    critical: number;
}

export interface TrackerMonitorConfig {
    alertThresholds?: MonitorAlertThresholds;
    showLastValue?: boolean;
}

export interface TrackerDataConfig {
    name: string;
    unit: string;
}

export interface TrackerGraphConfig {
    type: string;
    title: string;
}

export interface TrackerUpcomingConfig {
    show: boolean;
    lookAheadDays: number;
}

export interface TrackerTemplate {
    name: string;
    kind: TrackerKind;
    fields: TrackerField[];
    icon: string;
    color: ColorConfig;
    hasQuickAdd: boolean;
    monitor?: TrackerMonitorConfig;
    upcoming?: TrackerUpcomingConfig;
    data?: TrackerDataConfig;
    graph?: TrackerGraphConfig;
}

export interface CreateTrackerRequest {
    receiverId: string;
    name: string;
    kind: TrackerKind;
    fields: TrackerField[];
    alertThresholds?: AlertThreshold[];
    icon: string;
    color: ColorConfig;
    isActive: boolean;
}

export interface UpdateTrackerRequest {
    name?: string;
    fields?: TrackerField[];
    alertThresholds?: AlertThreshold[];
    icon?: string;
    color?: ColorConfig;
    isActive?: boolean;
}

export interface TrackerOperationResult {
    success: boolean;
    conflict: boolean;
    tracker?: Tracker;
}
