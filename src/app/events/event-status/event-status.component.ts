import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { HttpService } from '../../services/http.service';
import { ListenerService } from '../../services/listener.service';
import { StateService } from '../../services/state.service';

import { EventAttendanceUtils } from '../../common/attendance-utils';
import { Utils } from '../../common/utils';
import { Constants } from 'app/common/constants';

import { UserInfo } from '../../entities/userInfo';
import { Event } from '../../entities/event';
import { Campus } from '../../entities/campus';

import * as _ from 'lodash';


@Component({
    selector: 'app-event-status',
    templateUrl: './event-status.component.html',
    styleUrls: ['./event-status.component.css']
})
export class EventStatusComponent implements OnInit, OnDestroy {
    campusId: number | string;
    allEvents: Array<Event> = [];
    events: Array<Event> = [];
    event: Event;
    dash = '- -';
    userInfo: UserInfo = null;
    selected = 0;
    subscrCampusList: Subscription;
    showCampusName: boolean;
    longDate = Constants.localeFormats.longDate;
    private eventAttendanceUtils: EventAttendanceUtils;
    private campuses: Array<Campus>;
    url = '/events/edit-event';
    filter = {};

    constructor(
        private router: Router,
        private httpService: HttpService,
        private listenerService: ListenerService,
        private stateService: StateService
    ) {
        this.subscrCampusList = this.listenerService.campusListStatus().subscribe(() => { this.campusChange(); });
    }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = (this.userInfo.campusId === null) ? 'all' : this.userInfo.campusId;
        this.eventAttendanceUtils = new EventAttendanceUtils();
        this.httpService.getAuth('events/upcomingApprox').then((data: any) => {
            this.events = data.events;
            this.campuses = data.campuses;
            this.allEvents = this.events;
            if (this.events.length > 0) {
                _.forEach(this.events, (event: Event) => {
                    const counters = this.eventAttendanceUtils.getEventAttendance(event.bookings);
                    event.studentsCount = counters.studentsCount;
                    event.families = counters.familiesCount;
                    event.attending = counters.totalAttendees;
                });
                this.selected = this.events[0].id;
                this.campusChanged(this.campusId);
            }
        });
    }

    ngOnDestroy() {
        this.subscrCampusList.unsubscribe();
    }

    campusChange() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = (this.userInfo.campusId === null) ? 'all' : this.userInfo.campusId;
        this.showCampusName = (this.campuses.length > 1 && this.campusId === 'all') ? true : false;
        this.campusChanged(this.campusId);
    }

    onChange() {
        this.event = null;
        this.event = _.find(this.events, e => e.id === this.selected);
        this.filter = { eventId: this.event.id };
        this.stateService.setFilterAsNumber(StateService.eventStatusCmpSelected, this.selected);
    }

    campusChanged(campusId: number | string) {
        this.events = (campusId === 'all') ? this.allEvents : _.filter(this.allEvents, e => e.campusId === campusId);
        this.events = Utils.filterFutureEventPersonalTours(this.events, this.campuses) as Array<Event>;
        this.selected = (this.events.length > 0) ? this.events[0].id : null;
        this.selected = this.stateService.getFilterAsNumber(StateService.eventStatusCmpSelected, this.selected);
        if (this.events.length > 0) {
            const eventExists = _.find(this.events, e => e.id === this.selected);
            this.selected = eventExists ? this.selected : this.events[0].id;
        }
        this.onChange();
    }
}
