import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DatabaseEvent, EventMetadata, Event } from '@care-giver-site/models';
import { EventTypes } from './event.service'
import { AuthService } from '../auth/auth.service';
import { Observable } from 'rxjs';
import { formatRFC3339 } from 'date-fns'

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

    getReceiverData(receiverId: string): Promise<Observable<ReceiverData>> {
        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({
                'Authorization': token,
            });

            const url = `/receiver/${encodeURIComponent(receiverId)}`
            return this.http.get<ReceiverData>(url, { headers: headers });
        })
    }

    addEvent(userId: string, receiverId: string, eventType: EventMetadata, data: any, timestamp: any,): Promise<Observable<any>> {
        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({
                'Authorization': token,
            });
            const requestBody: any = {
                receiverId: receiverId,
                userId: userId,
                eventName: eventType.name.toLowerCase().replace(" ", "_"),
            };

            if (data && eventType.dataName) {
                requestBody["event"] = {
                    [eventType.dataName]: data,
                };
            }

            if (timestamp) {
                requestBody["event"] = {
                    ...requestBody["event"],
                    timestamp: formatRFC3339(timestamp),
                }
            }

            return this.http.post(`/receiver/event`, requestBody, { headers: headers });
        })

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
