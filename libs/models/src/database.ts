
export interface DatabaseEvent {
    type: string;
    name: string;
    data: any;
    dataName: string;
}

export interface DatabaseType {
    type: string;
    name: string;
    dataName: string;
}

export interface Event {
    type: string;
    data: any;
    timestamp: string;
    user: string;
}
