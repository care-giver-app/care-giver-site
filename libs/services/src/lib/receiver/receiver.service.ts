import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { DatabaseEvent, EventMetadata, Event } from '@care-giver-site/models';
import { EventTypes } from './event.service'
import { AuthService } from '../auth/auth.service';
import { Observable, switchMap } from 'rxjs';

export interface ReceiverData {
    receiverId: string;
    firstName: string;
    lastName: string;
    medications: DatabaseEvent[];
    bowelMovements: DatabaseEvent[];
    showers: DatabaseEvent[];
    urinations: DatabaseEvent[];
    weights: DatabaseEvent[];
}


@Injectable({
    providedIn: 'root'
})
export class ReceiverService {

    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) {
    }

    getReceiverData(receiverId: string): Observable<ReceiverData> {
        return this.authService.getBearerToken().pipe(
            switchMap((token) => {
                const headers: HttpHeaders = new HttpHeaders({
                    'Authorization': `Bearer ${token}`,
                });

                return this.http.get<ReceiverData>(`/receiver/${encodeURIComponent(receiverId)}`, { headers: headers });
            })
        );
    }

    addEvent(receiverId: string, eventType: EventMetadata, data: any): Observable<any> {
        return this.authService.getBearerToken().pipe(
            switchMap((token) => {
                const requestBody: any = {
                    receiverId: receiverId,
                    userId: "User#af61b247-cd63-414a-9e23-776177954e35",
                    eventName: eventType.name.toLowerCase().replace(" ", "_"),
                };

                if (data && eventType.dataName) {
                    requestBody["event"] = {
                        [eventType.dataName]: data,
                    };
                }

                const headers: HttpHeaders = new HttpHeaders({
                    'Authorization': `Bearer ${token}`,
                });

                return this.http.post(`/receiver/event`, requestBody, { headers: headers });
            })
        );
    }

    getLastEvent(receiver: ReceiverData, type: string): Event | null {
        const eventType: EventMetadata | undefined = EventTypes.find(et => et.type === type);
        if (!eventType) {
            return null;
        }

        let events = (receiver as any)[eventType?.type];
        if (events && events.length > 0) {
            const latestEvent = events[events.length - 1];
            const timestamp = new Date(latestEvent.timestamp);

            const latestEventData = {
                type: eventType?.name,
                data: {} as Record<string, any>,
                timestamp: timestamp,
                user: latestEvent.userId
            }

            if (eventType.dataName) {
                latestEventData.data[eventType.dataName] = latestEvent[eventType.dataName];
            }

            return latestEventData as Event;
        }
        return null
    }

    getAllEvents(receiver: ReceiverData): DatabaseEvent[] {
        let events: DatabaseEvent[] = [];

        for (const eventType of EventTypes) {
            const eventsOfType = (receiver as any)[eventType.type];
            if (Array.isArray(eventsOfType)) {
                for (const event of eventsOfType) {
                    events.push({
                        type: eventType.type,
                        name: eventType.name,
                        data: event,
                        dataName: eventType.dataName
                    });
                }
            }
        }

        return events;
    }
}
