import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Event, Receiver } from '@care-giver-site/models';
import { AuthService } from '../auth/auth.service';
import { Observable } from 'rxjs';
import { formatRFC3339 } from 'date-fns'

@Injectable({
    providedIn: 'root'
})
export class ReceiverService {

    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) {
    }

    getReceiver(receiverId: string, userId: string): Promise<Observable<Receiver>> {
        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({
                'Authorization': token,
            });

            const url = `/receiver/${encodeURIComponent(receiverId)}?userId=${encodeURIComponent(userId)}`;
            return this.http.get<Receiver>(url, { headers: headers });
        })
    }

    getReceiverEvents(receiverId: string, userId: string): Promise<Observable<Event[]>> {
        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({
                'Authorization': token,
            });

            const url = `/events/${encodeURIComponent(receiverId)}?userId=${encodeURIComponent(userId)}`;
            return this.http.get<Event[]>(url, { headers: headers });
        })
    }

    addEvent(receiverId: string, userId: string, type: string, data: any, timestamp: any): Promise<Observable<any>> {
        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({
                'Authorization': token,
            });

            const requestBody: any = {
                receiverId: receiverId,
                userId: userId,
                type: type,
            }

            if (data) {
                requestBody["data"] = data
            }

            if (timestamp) {
                requestBody["timestamp"] = formatRFC3339(timestamp)
            }

            return this.http.post(`/event`, requestBody, { headers: headers });
        })
    }

    deleteEvent(receiverId: string, userId: string, eventId: string): Promise<Observable<any>> {
        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({
                'Authorization': token,
            });

            const url = `/event/${encodeURIComponent(eventId)}?userId=${encodeURIComponent(userId)}&receiverId=${encodeURIComponent(receiverId)}`;

            return this.http.delete(url, { headers: headers });
        })
    }

    getEventsOfType(event: Event[], type: string): Event[] {
        return event
            .filter(e => e.type === type)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
}
