import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { PersonalTour } from 'app/entities/personal-tour';
import { Campus } from 'app/entities/campus';
import { EventFilter } from 'app/entities/local/eventFilter';
import { UserInfo } from 'app/entities/userInfo';
import { Contact } from 'app/entities/contact';
import { Student } from 'app/entities/student';

import { Utils } from 'app/common/utils';
import { PersonalTourAttendanceUtils } from 'app/common/attendance-utils';
import { Constants } from 'app/common/constants';
import { LocaleDatePipe } from 'app/common/pipes/locale-date.pipe';

import { HttpService } from 'app/services/http.service';
import { ListenerService } from 'app/services/listener.service';
import { StateService } from 'app/services/state.service';
import { StorageService } from 'app/services/storage.service';
import { LocaleService } from 'app/services/locale.service';

import { BaseTable } from 'app/base-table';

import * as moment from 'moment';
import * as _ from 'lodash';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-personal-tours',
    templateUrl: 'personal-tours.component.html',
    styleUrls: ['./personal-tours.component.scss']
})
export class PersonalToursComponent extends BaseTable<PersonalTour> implements OnInit, OnDestroy {
    public tableId = 'personalTourTable';
    public filterData: Object = { componentName: 'Personal Tours' };
    public filterCriterias: EventFilter = new EventFilter();
    public visibleSelectedCount = 0;

    public personalTours: Array<PersonalTour> = [];
    public filteredPersonalTours: Array<PersonalTour> = [];
    public campuses: Array<Campus> = [];

    public schoolTimeZone = '';
    public userInfo: UserInfo;
    public campusId: number | string;
    public isMultiCampuses: boolean;
    public tableIsLoading: Promise<any> = null;
    private personalTourAttendanceUtils: PersonalTourAttendanceUtils;
    subscrCampusList: Subscription;
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
            'select', 'dateTime', 'assigneeName', 'contacts', 'students', 'attending', 'families', 'checkins', 'actions'
        ];
        this.localeDatePipe = new LocaleDatePipe(this.localeService);
    }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.personalTourAttendanceUtils = new PersonalTourAttendanceUtils();
        this.campusId = (this.userInfo.campusId === null) ? 'all' : this.userInfo.campusId;
        this.filterCriterias.campusId = this.campusId;
        this.tableIsLoading = this.httpService.getAuth('personal-tour').then((data: any) => {
            this.personalTours = data.personalTours;
            this.campuses = data.campuses;
            this.isMultiCampuses = (this.campuses.length > 2) ? true : false;
            if (this.isMultiCampuses) {
                this.displayedColumns.splice(2, 0, 'campus.name');
            }
            this.schoolTimeZone = data.school.timeZoneId;
            _.forEach(this.personalTours, (pt: PersonalTour) => {
                pt.assigneeName = pt.assigneeId !== null ? pt.assignee.lastName + ', ' + pt.assignee.firstName : '';
                pt.time = moment(pt.time, Constants.dateFormats.time).format(this.hm);
                const counters = this.personalTourAttendanceUtils.getEventAttendance(pt.personalTourBookings);
                pt.families = counters.familiesCount;
                pt.attending = counters.totalAttendees;
                pt.checkins = counters.checkedInCount;
                _(pt.personalTourBookings).forEach(item => {
                    _.assign(item, {
                        'attendingsCount': this.personalTourAttendanceUtils.getAttendantByBooking(item),
                        'checkedInCount': this.personalTourAttendanceUtils.getCheckedInAttendance(item),
                    });
                });
            });
            this.setFilterData();
            this.filterCriterias = this.getFilterState(this.filterCriterias);
            this.filterData['criterias'] = this.filterCriterias;
            this.doFilter(this.filterCriterias);
            this.buildTable(this.filteredPersonalTours);
            this.updateTable(this.filteredPersonalTours);
        });
    }

    protected buildTable(personalTours: PersonalTour[]) {
        super.buildTable(personalTours);

        this.dataSource.sortingDataAccessor = (item, property) => {
            const val = _.get(item, property);
            switch (property) {
                case 'dateTime':
                    return Utils.getUnixTimestamp(`${item.date} ${item.time}`, `${this.date} ${this.hm}`);
                case 'checkins':
                case 'families':
                case 'attending':
                    return _.isNumber(val) ? Number(val) : val;
                case 'contacts':
                case 'students':
                    return this.getName(item, property).join('; ');
                default: return _.toLower(val);
            }
        };

        // customization for filter
        this.dataSource.filterPredicate = (data, filter: string) => {
            const values = [];
            this.displayedColumns.forEach(fieldName => {
                let value;
                if (fieldName === 'dateTime') {
                    value = this.localeDatePipe.transform(data['date'], this.dateDelimiter) + ' ' + data['time'];
                } else if (fieldName === 'contacts' || fieldName === 'students') {
                    value = this.getName(data, fieldName);
                } else {
                    value = _.get(data, fieldName);
                }
                if (value) {
                    values.push(_.toLower(value));
                }
            })
            const transformedFilter = filter.trim().toLowerCase();
            return values.find(i => _.includes(i, transformedFilter));
        };
    }

    private getName(pt: PersonalTour, key: string): string[] {
        const names: string[] = [];
        if (!_.isEmpty(pt.personalTourBookings)) {
            pt.personalTourBookings.forEach((ptBooking) => {
                ptBooking[key].forEach((contactOrStudent: Contact | Student) => {
                    names.push(_.toLower(`${contactOrStudent.lastName}, ${contactOrStudent.firstName}`));
                })
            })
        }
        return names;
    }

    campusChange() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = (this.userInfo.campusId === null) ? 'all' : this.userInfo.campusId;
        this.filterCriterias = new EventFilter();
        this.filterCriterias.campusId = this.campusId;
        this.doFilter(this.filterCriterias);
        this.buildTable(this.filteredPersonalTours);
    }

    private setFilterData() {
        const tmp: number[] = _(this.personalTours).uniqBy(e => moment(e.date).year()).map(e => moment(e.date).year()).value();
        this.filterData['years'] = _.orderBy(tmp, ['date'], ['asc']);
    }

    outputFilter(criterias) {
        this.doFilter(criterias);
        this.updateTable(this.filteredPersonalTours);
    }

    doFilter(criterias) {
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = (this.userInfo.campusId === null) ? 'all' : this.userInfo.campusId;
        this.filterCriterias = criterias;
        this.setFilterState(this.filterCriterias);
        this.filterCriterias.campusId = this.campusId;
        let filtered: Array<PersonalTour> = this.personalTours;
        if (this.filterCriterias.year !== 'all') {
            filtered = _.filter(filtered, personalTour => moment(personalTour.date).year() === criterias.year);
        }
        if (this.filterCriterias.campusId !== 'all') {
            filtered = _.filter(filtered, fl => fl.campusId === criterias.campusId);
        }

        if (this.filterCriterias.hidePastEvents) {
            if (this.schoolTimeZone) {
                filtered = Utils.filterFutureEventPersonalTours(filtered, this.campuses) as Array<PersonalTour>;
            }
        }
        this.filteredPersonalTours = filtered;
    }

    private getFilterState(filter: EventFilter) {
        const year = this.stateService.getFilterAsNumber(StateService.personalToursCmpYear, _.isNumber(filter.year) ? filter.year : null);
        if (year) { filter.year = year; }
        filter.hidePastEvents = this.stateService.getFilterAsBoolean(StateService.personalToursCmpHidePastEvents, filter.hidePastEvents);
        return filter;
    }
    private setFilterState(filter: EventFilter) {
        const year = filter.year ? filter.year as number : null;
        this.stateService.setFilterAsNumber(StateService.personalToursCmpYear, (year) ? year : null);
        this.stateService.setFilterAsBoolean(StateService.personalToursCmpHidePastEvents, filter.hidePastEvents);
    }

    removeSelected() {
        const ids = this.getVisibleSelectedIds();
        Utils.multipleDeletedQuestion(ids.length).then((result) => {
            if (result && result.value) {
                this.httpService.postAuth('personal-tour/delete', ids).then(() => {
                    this.deselectItems(ids);
                    this.removePersonalToursFromLocalArrays(ids);
                    Utils.multipleDeletedSuccess();
                }).catch(err => console.log(err));
            }
        });
    }

    deletePersonalTour(id: number) {
        Utils.delete('personal-tour/delete/', id, this.httpService).then((deleted: boolean) => {
            if (deleted) {
                this.deselectItems([id]);
                this.removePersonalToursFromLocalArrays([id]);
            }
        });
    }

    private removePersonalToursFromLocalArrays(ptIds: Array<number>) {
        _.remove(this.personalTours, s => _.includes(ptIds, s.id));
        _.remove(this.filteredPersonalTours, s => _.includes(ptIds, s.id));
        _.remove(this.dataSource.data, s => _.includes(ptIds, s.id));
        this.dataSource.data = _.clone(this.dataSource.data);
        this.paginator.firstPage();
    }

    addPersonalTour() {
        this.router.navigate(['/events/add-personal-tour']);
    }

    editPersonalTour(personalTourId: number) {
        this.router.navigate(['/events/edit-personal-tour', { personalTourId: personalTourId }]);
    }

    editContact(id: number) {
        this.router.navigate([`/${environment.localization.enquiriesUrl}/edit-contact`, { contactId: id }]);
    }

    editStudent(id: number) {
        this.router.navigate([`/${environment.localization.enquiriesUrl}/edit-student`, { studentId: id }]);
    }


    duplicatePersonalTour(id: number) {
        this.router.navigate(['/events/duplicate-personal-tour', { id }]);
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        this.subscrCampusList.unsubscribe();
    }

}
