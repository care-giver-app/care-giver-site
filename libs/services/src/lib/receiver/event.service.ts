import { Injectable } from '@angular/core';
import { EventMetadata, Event, User } from '@care-giver-site/models';
import { UserService } from '../user/user.service';

export const EventTypes: EventMetadata[] = [
    {
        type: 'Medication',
        color: {
            primary: '#9b59b6',
            secondary: '#e1bee7',
            secondaryText: '#9b59b6',
        },
        icon: 'assets/medication-icon.png'
    },
    {
        type: 'Bowel Movement',
        color: {
            primary: '#8B4513',
            secondary: '#bcaaa4',
            secondaryText: '#8B4513',
        },
        icon: 'assets/bowel-movement-icon.png'
    },
    {
        type: 'Shower',
        color: {
            primary: '#1e90ff',
            secondary: '#D1E8FF',
            secondaryText: '#1e90ff',
        },
        icon: 'assets/shower-icon.png'
    },
    {
        type: 'Urination',
        color: {
            primary: '#d4ac0d',
            secondary: '#FFF8DC',
            secondaryText: '#d4ac0d',
        },
        icon: 'assets/urination-icon.png'
    },
    {
        type: 'Weight',
        data: {
            name: "Weight",
            unit: "lbs"
        },
        color: {
            primary: '#27ae60',
            secondary: '#d4efdf',
            secondaryText: '#27ae60',
        },
        icon: 'assets/weight-icon.png'
    }
];

@Injectable({
    providedIn: 'root'
})
export class EventService {
    constructor() { }

    getEventColor(type: string): { primary: string, secondary: string, secondaryText: string } {
        const eventType = EventTypes.find(event => event.type === type);
        if (eventType) {
            return eventType.color;
        } else {
            return {
                primary: '#ad2121',
                secondary: '#FAE3E3',
                secondaryText: '#ad2121',
            };
        }
    }

    hasData(event: Event): boolean {
        const eventType = EventTypes.find(e => e.type === event.type);
        return !!(eventType && eventType.data && event.data && event.data.length > 0);
    }

    getDataUnit(event: Event): string | undefined {
        const eventType = EventTypes.find(e => e.type === event.type);
        return eventType && eventType.data ? eventType.data.unit : undefined;
    }

    getDataName(event: Event): string | undefined {
        const eventType = EventTypes.find(e => e.type === event.type);
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