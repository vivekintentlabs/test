import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Event } from 'app/entities/event';
import { Campus } from 'app/entities/campus';
import { UserInfo } from 'app/entities/userInfo';
import { EventFilter } from 'app/entities/local/eventFilter';

import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { EventAttendanceUtils } from 'app/common/attendance-utils';
import { LocaleDatePipe } from 'app/common/pipes/locale-date.pipe';

import { HttpService } from 'app/services/http.service';
import { ListenerService } from 'app/services/listener.service';
import { StateService } from 'app/services/state.service';
import { StorageService } from 'app/services/storage.service';
import { LocaleService } from 'app/services/locale.service';

import { BaseTable } from 'app/base-table';

import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
    selector: 'app-events',
    templateUrl: 'events.component.html',
    styleUrls: ['./events.component.scss']
})
export class EventsComponent extends BaseTable<Event> implements OnInit, OnDestroy {
    public tableId = 'eventTable';
    public filterData: Object = { componentName: 'Events' };
    public filterCriterias: EventFilter = new EventFilter();
    public visibleSelectedCount = 0;

    public events: Event[] = [];
    public filteredEvents: Event[] = [];
    public campuses: Campus[] = [];

    public schoolTimeZone = '';
    public userInfo: UserInfo;
    public eventAttendanceUtils: EventAttendanceUtils;
    subscrCampusList: Subscription;
    public campusId: number | string;
    public isMultiCampuses: boolean;
    public tableIsLoading: Promise<any> = null;
    dateDelimiter = Constants.localeFormats.dateDelimiter;
    date = Constants.dateFormats.date;
    hm = Constants.dateFormats.hourMinutes;
    private localeDatePipe: LocaleDatePipe;

    constructor(
        private router: Router,
        private httpService: HttpService,
        private listenerService: ListenerService,
        private stateService: StateService,
        private localeService: LocaleService,
        storageService: StorageService
    ) {
        super(storageService);
        this.subscrCampusList = this.listenerService.campusListStatus().subscribe(() => this.campusChange());
        this.displayedColumns = [
            'select', 'dateTime', 'schoolTour.name', 'subTours.length', 'maxNumber', 'studentsCount', 'families',
            'attending', 'registration', 'actions'
        ];
        this.localeDatePipe = new LocaleDatePipe(this.localeService);
    }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = this.userInfo.campusId || 'all';
        this.filterCriterias.campusId = this.campusId;
        this.eventAttendanceUtils = new EventAttendanceUtils();
        this.tableIsLoading = this.httpService.getAuth('events').then((data: any) => {
            this.visibleSelectedCount = 0;
            this.events = data.events;
            this.campuses = data.campuses;
            this.isMultiCampuses = (this.campuses.length > 2) ? true : false;
            if (this.isMultiCampuses) {
                this.displayedColumns.splice(3, 0, 'campus.name');
            }
            this.schoolTimeZone = data.school.timeZoneId;
            _.forEach(this.events, (event: Event) => {
                event.time = moment(event.time, Constants.dateFormats.time).format(this.hm);
                const counters = this.eventAttendanceUtils.getEventAttendance(event.bookings);
                event.studentsCount = counters.studentsCount;
                event.families = counters.familiesCount;
                event.attending = counters.totalAttendees;
            });

            this.setFilterData();
            this.filterCriterias = this.getFilterState(this.filterCriterias);
            this.filterData['criterias'] = this.filterCriterias;
            this.doFilter(this.filterCriterias);
            this.buildTable(this.filteredEvents);
            this.updateTable(this.filteredEvents);
        });
    }

    protected buildTable(events: Event[]) {
        super.buildTable(events);

        this.dataSource.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'dateTime':
                    return Utils.getUnixTimestamp(`${item.date} ${item.time}`, `${this.date} ${this.hm}`);
                case 'maxNumber':
                case 'studentsCount':
                case 'families':
                case 'attending':
                    const val = _.get(item, property);
                    return _.isNumber(val) ? Number(val) : val;
                case 'registration':
                    return item.isFuture ? item.isRegistrationDisabled ? 'Disabled' : 'Enabled' : '-';

                default: return _.toLower(_.get(item, property));
            }
        };

        // customization for filter
        this.dataSource.filterPredicate = (data, filter: string) => {
            const values = [];
            this.displayedColumns.forEach(fieldName => {
                let value;
                if (fieldName === 'dateTime') {
                    value = this.localeDatePipe.transform(data['date'], this.dateDelimiter) + ' ' + data['time'];
                } else {
                    value = _.get(data, fieldName);
                }
                if (value) {
                    values.push(_.toLower(value));
                }
            });
            const transformedFilter = filter.trim().toLowerCase();
            return values.find(i => _.includes(i, transformedFilter));
        };
    }

    campusChange() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = this.userInfo.campusId || 'all';
        this.filterCriterias = new EventFilter();
        this.filterCriterias.campusId = this.campusId;
        this.doFilter(this.filterCriterias);
        this.updateTable(this.filteredEvents);
    }

    private setFilterData() {
        const tmp: number[] = _(this.events).uniqBy(e => moment(e.date).year()).map(e => moment(e.date).year()).value();
        this.filterData['years'] = _.orderBy(tmp, ['date'], ['asc']);
    }

    outputFilter(criterias) {
        this.doFilter(criterias);
        this.updateTable(this.filteredEvents);
    }


    doFilter(criterias) {
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = this.userInfo.campusId || 'all';
        this.filterCriterias = criterias;
        this.setFilterState(this.filterCriterias);
        this.filterCriterias.campusId = this.campusId;
        let filteredEvents: Event[] = this.events;
        if (this.filterCriterias.year !== 'all') {
            filteredEvents = _.filter(filteredEvents, (event: Event) => moment(event.date).year() === criterias.year);
        }
        if (this.filterCriterias.campusId !== 'all') {
            filteredEvents = _.filter(filteredEvents, s => s.campusId === criterias.campusId);
        }

        if (this.filterCriterias.hidePastEvents) {
            if (this.schoolTimeZone) {
                filteredEvents = Utils.filterFutureEventPersonalTours(filteredEvents, this.campuses) as Event[];
            }
        }
        this.filteredEvents = filteredEvents;
    }

    private getFilterState(filter: EventFilter) {
        const year = this.stateService.getFilterAsNumber(StateService.eventsCmpYear, _.isNumber(filter.year) ? filter.year : null);
        if (year) { filter.year = year; }
        filter.hidePastEvents = this.stateService.getFilterAsBoolean(StateService.eventsCmpHidePastEvents, filter.hidePastEvents);
        return filter;
    }

    private setFilterState(filter: EventFilter) {
        const year = filter.year ? filter.year as number : null;
        this.stateService.setFilterAsNumber(StateService.eventsCmpYear, (year) ? year : null);
        this.stateService.setFilterAsBoolean(StateService.eventsCmpHidePastEvents, filter.hidePastEvents);
    }

    removeSelected() {
        const ids = this.getVisibleSelectedIds();
        Utils.multipleDeletedQuestion(ids.length).then((result) => {
            if (result && result.value) {
                this.httpService.postAuth('events/delete', ids).then(() => {
                    this.deselectItems(ids);
                    this.removeEventsFromLocalArrays(ids);
                    Utils.multipleDeletedSuccess();
                }).catch(err => console.log(err));
            }
        });
    }

    private removeEventsFromLocalArrays(eventsIds: number[]) {
        _.remove(this.events, s => _.includes(eventsIds, s.id));
        _.remove(this.filteredEvents, s => _.includes(eventsIds, s.id));
        _.remove(this.dataSource.data, s => _.includes(eventsIds, s.id));
        this.dataSource.data = _.clone(this.dataSource.data);
        this.paginator.firstPage();
    }

    deleteEvent(id: number) {
        Utils.delete('events/delete-event/', id, this.httpService).then((deleted: boolean) => {
            if (deleted) {
                this.deselectItems([id]);
                this.removeEventsFromLocalArrays([id]);
            }
        });
    }

    addEvent() {
        this.router.navigate(['/events/add-event']);
    }

    editEvent(event: Event) {
        this.router.navigate(['/events/edit-event', { eventId: event.id, campusId: event.campusId }]);
    }

    duplicateEvent(id: number) {
        this.router.navigate(['/events/duplicate', { id }]);
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        this.subscrCampusList.unsubscribe();
    }
}
