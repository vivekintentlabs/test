import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'events-count-view',
    templateUrl: 'events-count-view.component.html'
})
export class EventsCountViewComponent implements OnInit {
    @Input() students: number;
    @Input() families: number;
    @Input() attending: number;
    @Input() checkedIn: number;
    @Input() vertical: boolean;
    @Input() isYellow: boolean;
    @Input() isRed: boolean;

    constructor() { }

    public ngOnInit() {
        this.students = this.students || 0;
        this.families = this.families || 0;
        this.attending = this.attending || 0;
        this.checkedIn = this.checkedIn || 0;
    }

}
