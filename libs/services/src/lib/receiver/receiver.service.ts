// libs/services/src/lib/receiver/receiver.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Event, Receiver, EventRequest } from '@care-giver-site/models';
import { AuthService } from '../auth/auth.service';
import { Observable, firstValueFrom, Subject } from 'rxjs';
import { formatRFC3339 } from 'date-fns';

@Injectable({
    providedIn: 'root'
})
export class ReceiverService {
    currentReceiverId: string | undefined;

    readonly receiverChanged$ = new Subject<void>();
    readonly eventAdded$ = new Subject<void>();

    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) {
        const storedReceiverId = localStorage.getItem('currentReceiverId');
        if (storedReceiverId) {
            this.currentReceiverId = storedReceiverId;
        }
    }

    setCurrentReceiver(receiverId: string) {
        this.currentReceiverId = receiverId;
        localStorage.setItem('currentReceiverId', receiverId);
        this.receiverChanged$.next();
    }

    notifyEventAdded() {
        this.eventAdded$.next();
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
                return Promise.resolve(new Observable<Receiver>(subscriber => {
                    subscriber.next(receiver);
                    subscriber.complete();
                }));
            } catch {
                localStorage.removeItem(cacheKey);
            }
        }
        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({ 'Authorization': token });
            const url = `/receiver/${encodeURIComponent(receiverId)}?userId=${encodeURIComponent(userId)}`;
            const obs = this.http.get<Receiver>(url, { headers });
            obs.subscribe({
                next: (receiver) => {
                    localStorage.setItem(cacheKey, JSON.stringify(receiver));
                }
            });
            return obs;
        });
    }

    getReceiverEvents(receiverId: string, userId: string, startTime?: string, endTime?: string): Promise<Observable<Event[]>> {
        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({ 'Authorization': token });
            let url = `/events/${encodeURIComponent(receiverId)}?userId=${encodeURIComponent(userId)}`;
            if (startTime && endTime) {
                url += `&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
            }
            return this.http.get<Event[]>(url, { headers });
        });
    }

    addEvent(eventRequest: EventRequest): Promise<Observable<any>> {
        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({ 'Authorization': token });
            eventRequest.startTime = formatRFC3339(eventRequest.startTime);
            eventRequest.endTime = formatRFC3339(eventRequest.endTime);
            return this.http.post(`/event`, eventRequest, { headers });
        });
    }

    deleteEvent(receiverId: string, userId: string, eventId: string): Promise<Observable<any>> {
        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({ 'Authorization': token });
            const url = `/event/${encodeURIComponent(eventId)}?userId=${encodeURIComponent(userId)}&receiverId=${encodeURIComponent(receiverId)}`;
            return this.http.delete(url, { headers });
        });
    }

    getEventsOfType(event: Event[], type: string): Event[] {
        return event
            .filter(e => e.type === type)
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    }
}
