import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { Event } from '../../entities/event';
import { Constants } from '../../common/constants';
import { Utils } from '../../common/utils';

import * as _ from 'lodash';


@Component({
    selector: 'app-events-summary',
    templateUrl: 'events-summary.component.html',
    styleUrls: ['./events-summary.component.css']

})
export class EventsSummaryComponent implements OnChanges {
    @Input() events: Array<Event>;
    futureEvents: Array<Event> = [];
    displayedEvents: Array<Event> = [];
    hidePast = true;
    userInfo;
    loaded = false;
    dateDelimiter = Constants.localeFormats.dateDelimiter;

    constructor() { }

    ngOnChanges(changes: SimpleChanges) {
        this.futureEvents = _.filter(this.events, event => Utils.isFutureEventOrPersonalTour(event, event.campus.timeZoneId));
        this.updateDataRows();
    }

    updateDataRows() {
        this.displayedEvents = (this.hidePast) ? this.futureEvents : this.events;
        this.displayedEvents = _.orderBy(this.displayedEvents, 'date', 'asc');
    }

    hidePastEvents(value) {
        this.hidePast = value;
        this.updateDataRows();
    }
}
