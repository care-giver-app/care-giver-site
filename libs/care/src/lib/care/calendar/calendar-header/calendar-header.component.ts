import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
    CalendarView,
    CalendarModule,
} from 'angular-calendar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'care-calendar-header',
    templateUrl: './calendar-header.component.html',
    styleUrl: './calendar-header.component.css',
    imports: [CalendarModule, MatButtonToggleModule, MatIconModule, MatButtonModule],
})
export class CalendarHeaderComponent {
    @Input() view!: CalendarView;

    @Input() viewDate!: Date;

    @Input() locale: string = 'en';

    @Output() viewChange = new EventEmitter<CalendarView>();

    @Output() viewDateChange = new EventEmitter<Date>();

    CalendarView = CalendarView;

    onToggleView(event: any) {
        this.viewChange.emit(event.value);
    }
}
