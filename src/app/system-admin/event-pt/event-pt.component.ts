import { Component, AfterViewInit } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';

import { HttpService } from 'app/services/http.service';

import { UserInfo } from 'app/entities/userInfo';
import { Event } from 'app/entities/event';
import { PersonalTour } from 'app/entities/personal-tour';

import * as _ from 'lodash';
import * as moment from 'moment-timezone';

@Component({
    selector: 'app-event-pt',
    templateUrl: 'event-pt.component.html'
})
export class EventPTComponent implements AfterViewInit {

    userInfo: UserInfo = null;
    events: Event[] = [];
    personalTours: PersonalTour[] = [];

    constructor(private httpService: HttpService) { }

    ngAfterViewInit() {
        this.userInfo = Utils.getUserInfoFromToken();
    }

    dateChange(event: MatDatepickerInputEvent<Date>) {
        event.value = event.value;
        const datetemp = moment(event.value);
        const date = datetemp.format(Constants.dateFormats.date);
        this.httpService.getAuth('diagnostic-system/event-pt/' + date).then((data: { events: Event[], personalTours: PersonalTour[] }) => {
            this.events = data.events;
            this.personalTours = data.personalTours;
        });
    }

}
