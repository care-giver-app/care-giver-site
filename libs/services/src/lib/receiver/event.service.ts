import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EventMetadata, Event, User } from '@care-giver-site/models';
import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, filter } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class EventService {
    private readonly EVENT_CONFIGS_CACHE_KEY = 'event_configs_cache'

    private eventConfigsSubject = new BehaviorSubject<EventMetadata[]>([]);
    public eventConfigs$ = this.eventConfigsSubject.asObservable().pipe(
        filter(configs => configs.length > 0)
    );

    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) { 
        this.getEventMetaData().then(obs => {
        obs.subscribe(resp => {
            this.eventConfigsSubject.next(resp);
        });
        })
    }

    getEventConfigs(): EventMetadata[] {
        return this.eventConfigsSubject.value;
    }

    private getEventMetaData(): Promise<Observable<EventMetadata[]>> {
        const cachedData = sessionStorage.getItem(this.EVENT_CONFIGS_CACHE_KEY);
        if (cachedData) {
            return Promise.resolve(of(JSON.parse(cachedData)))
        }

        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({
                'Authorization': token,
            });
            console.log("Retrieved bearer token... Calling get event meta data")
            const url = `/events/configs/`;
            return this.http.get<EventMetadata[]>(url, { headers: headers }).pipe(
                tap(data => {
                    sessionStorage.setItem(this.EVENT_CONFIGS_CACHE_KEY, JSON.stringify(data));
                })
            );
        });
    }

    getEventColor(type: string): { primary: string, secondary: string } {
        const eventType = this.eventConfigsSubject.value.find(event => event.type === type);
        if (eventType) {
            return eventType.color;
        } else {
            return {
                primary: '#ad2121',
                secondary: '#FAE3E3',
            };
        }
    }

    hasData(event: Event): boolean {
        const eventType = this.eventConfigsSubject.value.find(e => e.type === event.type);
        return !!(eventType && eventType.data && event.data && event.data.length > 0);
    }

    getDataUnit(event: Event): string | undefined {
        const eventType = this.eventConfigsSubject.value.find(e => e.type === event.type);
        return eventType && eventType.data ? eventType.data.unit : undefined;
    }

    getDataName(event: Event): string | undefined {
        const eventType = this.eventConfigsSubject.value.find(e => e.type === event.type);
        return eventType && eventType.data ? eventType.data.name : undefined;
    }

    getReadableTimestamp(event: Event): string {
        return this.formatEventTime(new Date(event.timestamp), true);
    }

    getCalendarTimestamp(event: Event): string {
        return this.formatEventTime(new Date(event.timestamp), false);
    }

    private formatEventTime(date: Date, long: boolean): string {
        if (!date) return 'Not Available';
        const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
        const dateOfWeekOptions: Intl.DateTimeFormatOptions = { weekday: long ? 'long' : 'short' };

        const now = new Date();
        const currentYear = now.getFullYear();
        const eventYear = date.getFullYear();

        const isOverAWeekAgo = (now.getTime() - date.getTime()) > (7 * 24 * 60 * 60 * 1000);

        let dateString: string;
        if (long) {
            dateString = date.toLocaleDateString([], { dateStyle: 'long' });
        }
        else {
            if (eventYear === currentYear) {
                dateString = date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
            } else {
                dateString = date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' });
            }
        }

        let dayOfWeekString: string = "";
        if (!isOverAWeekAgo) {
            dayOfWeekString = date.toLocaleDateString([], dateOfWeekOptions);
        }

        if (this.isToday(date)) return `Today at ${date.toLocaleTimeString([], timeOptions)}`;
        if (this.isYesterday(date)) return `Yesterday at ${date.toLocaleTimeString([], timeOptions)}`;

        return `${dayOfWeekString} ${dateString} ${date.toLocaleTimeString([], timeOptions)}`;
    }

    private isToday(date: Date): boolean {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    private isYesterday(date: Date): boolean {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date.toDateString() === yesterday.toDateString();
    }

    getLoggedUser(event: Event, userService: UserService): Promise<string> {
        return userService.getUserData(event.userId).then((user: User | undefined) =>
            user ? `${user.firstName} ${user.lastName}` : "Not Available"
        );
    }
}