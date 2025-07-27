import { Injectable } from '@angular/core';
import { EventMetadata } from '@care-giver-site/models';

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
}