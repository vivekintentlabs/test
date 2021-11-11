import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { EventAttendanceUtils } from '../../common/attendance-utils';

import { Event } from '../../entities/event';

import * as _ from 'lodash';
import { Utils } from '../../common/utils';


@Component({
    selector: 'app-events-attendee-statistics',
    templateUrl: 'events-attendee-statistics.component.html',
    styleUrls: ['./events-attendee-statistics.component.scss']
})
export class EventsAttendeeStatisticsComponent implements OnInit, OnChanges {
    @Input() events: Array<Event>;
    eventAttendanceUtils = new EventAttendanceUtils();
    registrantForm: FormGroup = null;
    counter: Array<Object> = [];
    loaded = false;

    constructor(private fb: FormBuilder, ) { }

    ngOnInit(): void {
        if (this.events) {
            this.calculate();
            this.createForm();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.events) {
            this.calculate();
        }
    }

    private createForm() {
        this.registrantForm = this.fb.group({
            registrants: ['all']
        });
        this.loaded = true;
    }

    public calculate() {
        let eventCount = 0;
        let studentsCount = 0;
        let familiesCount = 0;
        let rsvpCount = 0;
        let checkedInCount = 0;

        const pastEvents = _.filter(this.events, event => Utils.isPastEventOrPersonalTour(event, event.campus.timeZoneId));

        _.forEach(pastEvents, (event: Event) => {
            const tmpCounter = this.eventAttendanceUtils.getEventAttendance(event.bookings);
            if (this.registrantForm && this.registrantForm.value.registrants === 'attended_only') {
                eventCount += tmpCounter.attendedEventCount
                studentsCount += tmpCounter.attendedStudentsCount;
                familiesCount += tmpCounter.attendedFamiliesCount;
                rsvpCount += tmpCounter.attendedRSVPCount;
                checkedInCount += tmpCounter.checkedInCount;
            } else {
                eventCount = pastEvents.length;
                studentsCount += tmpCounter.studentsCount;
                familiesCount += tmpCounter.familiesCount;
                rsvpCount += tmpCounter.totalAttendees;
                checkedInCount += tmpCounter.checkedInCount;
            }
        });
        this.counter = [];
        this.counter.push({ id: 1, name: 'Events', value: eventCount });
        this.counter.push({ id: 2, name: 'Students', value: studentsCount });
        this.counter.push({ id: 3, name: 'Families', value: familiesCount });
        this.counter.push({ id: 4, name: 'RSVP', value: rsvpCount });
        this.counter.push({ id: 5, name: 'Checked In', value: checkedInCount });
    }

}
