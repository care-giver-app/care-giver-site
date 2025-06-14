import { Injectable } from '@angular/core';
import { EventMetadata } from '@care-giver-site/models';

export const EventTypes: EventMetadata[] = [
    {
        type: 'Medication',
        dataName: '',
        color: {
            primary: '#9b59b6',
            secondary: '#e1bee7',
            secondaryText: '#9b59b6',
        }
    },
    {
        type: 'Bowel Movement',
        dataName: '',
        color: {
            primary: '#8B4513',
            secondary: '#bcaaa4',
            secondaryText: '#8B4513',
        }
    },
    {
        type: 'Shower',
        dataName: '',
        color: {
            primary: '#1e90ff',
            secondary: '#D1E8FF',
            secondaryText: '#1e90ff',
        }
    },
    {
        type: 'Urination',
        dataName: '',
        color: {
            primary: '#d4ac0d',
            secondary: '#FFF8DC',
            secondaryText: '#d4ac0d',
        }
    },
    {
        type: 'Weight',
        dataName: 'Weight',
        color: {
            primary: '#27ae60',
            secondary: '#d4efdf',
            secondaryText: '#27ae60',
        }
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
}