import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
    CalendarView,
    CalendarModule,
} from 'angular-calendar';

@Component({
    selector: 'care-calendar-header',
    templateUrl: './calendar-header.component.html',
    imports: [CalendarModule],
})
export class CalendarHeaderComponent {
    @Input() view!: CalendarView;

    @Input() viewDate!: Date;

    @Input() locale: string = 'en';

    @Output() viewChange = new EventEmitter<CalendarView>();

    @Output() viewDateChange = new EventEmitter<Date>();

    CalendarView = CalendarView;
}
