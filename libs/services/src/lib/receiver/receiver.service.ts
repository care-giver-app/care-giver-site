import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Event, Receiver } from '@care-giver-site/models';
import { AuthService } from '../auth/auth.service';
import { Observable, firstValueFrom } from 'rxjs';
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

    async getReceivers(userId: string, receiverIds: string[]): Promise<Receiver[]> {
        const receiverPromises = receiverIds.map(id =>
            this.getReceiver(id, userId).then(obs => firstValueFrom(obs))
        );
        return Promise.all(receiverPromises);
    }

    getReceiver(receiverId: string, userId: string): Promise<Observable<Receiver>> {
        const cacheKey = `receiverCache_${receiverId}_${userId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const receiver: Receiver = JSON.parse(cached);
                // Return an Observable that emits the cached value
                return Promise.resolve(new Observable<Receiver>(subscriber => {
                    subscriber.next(receiver);
                    subscriber.complete();
                }));
            } catch {
                localStorage.removeItem(cacheKey);
            }
        }
        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({
                'Authorization': token,
            });
            const url = `/receiver/${encodeURIComponent(receiverId)}?userId=${encodeURIComponent(userId)}`;
            const obs = this.http.get<Receiver>(url, { headers: headers });
            obs.subscribe({
                next: (receiver) => {
                    localStorage.setItem(cacheKey, JSON.stringify(receiver));
                }
            });
            return obs;
        });
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
