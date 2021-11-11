import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { HttpService } from 'app/services/http.service';
import { StateService } from 'app/services/state.service';
import { ListenerService } from 'app/services/listener.service';
import { StorageService } from 'app/services/storage.service';
import { LocaleService } from 'app/services/locale.service';

import { Constants } from 'app/common/constants';
import { Utils } from 'app/common/utils';
import { Keys } from 'app/common/keys';
import { LocalDatePipe } from 'app/common/pipes/date.pipe';

import { ActivityLog } from 'app/entities/activityLog';
import { Prospectus } from 'app/entities/local/prospectus';
import { UserInfo } from 'app/entities/userInfo';
import { Campus } from 'app/entities/campus';

import { BaseTable } from 'app/base-table';

import * as moment from 'moment';
import * as _ from 'lodash';
import { environment } from 'environments/environment';

declare var $: any;

@Component({
    selector: 'app-prospectuses',
    templateUrl: 'prospectuses.component.html',
    styleUrls: ['prospectuses.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class ProspectusesComponent extends BaseTable<Prospectus> implements OnInit, OnDestroy {
    campusId: number | string;
    prospectusesForm: FormGroup;
    allProspectuses: Array<Prospectus> = [];
    prospectuses: Array<Prospectus> = [];
    startYear: number;
    years: Array<Object> = [];
    loaded = false;
    dash = '- -';
    inputBarChart = null;
    labels = Constants.months;
    campuses: Array<Campus> = [];
    userInfo: UserInfo = null;
    subscrCampusList: Subscription;
    totalCount = 0;
    dateDelimiter = Constants.localeFormats.dateDelimiter;
    public tableId = 'prospectusesTable';
    private localDatePipe: LocalDatePipe;
    schoolTimeZone: string;
    date = Constants.localeFormats.date;

    constructor(
        private fb: FormBuilder,
        private httpService: HttpService,
        private router: Router,
        private ref: ChangeDetectorRef,
        private listenerService: ListenerService,
        private stateService: StateService,
        storageService: StorageService,
        private localeService: LocaleService,
    ) {
        super(storageService);
        this.displayedColumns = ['createdAt', 'contactName', 'leadSourceName', 'actions'];
        this.subscrCampusList = this.listenerService.campusListStatus().subscribe(() => this.campusChange());
        this.localDatePipe = new LocalDatePipe(this.localeService);
    }

    public ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = (this.userInfo.campusId === null) ? 'all' : this.userInfo.campusId;
        return this.httpService.getAuth('activity-log/prospectuses/').then((result: any) => {
            this.campuses = result.campuses;
            this.schoolTimeZone = _.head(this.campuses).school.timeZoneId;
            _.forEach(result.prospectuses, (al: ActivityLog) => {
                const date: moment.Moment = moment(al.date);
                _.forEach(al.student.contactRelationships, (relationship) => {
                    this.allProspectuses.push({
                        year: date.year(),
                        date: al.date,
                        month: date.format(Constants.dateFormats.shortMonth),
                        contact: relationship[Keys.contact],
                        createdAt: al.date,
                        leadSource: al.leadSource,
                        studentId: al.student.id,
                        campusId: al.student.campusId
                    });
                });
            });

            _(this.allProspectuses).uniqBy(prospectus => prospectus.year).forEach(item => this.years.push({ year: item.year }));
            this.years = _.orderBy(this.years, 'year', 'asc');
            this.campusChanged(this.campusId);
            Utils.DetectChanges(this.ref);
            this.buildTable(this.prospectuses)
        });
    }

    protected buildTable(prospectuses) {
        prospectuses.forEach(p => {
            p.contactName = p.contact.lastName + ', ' + p.contact.firstName;
            p.leadSourceName = p.leadSource ? p.leadSource.name : ''
        });
        super.buildTable(prospectuses, true);
        this.updateTable(prospectuses);

        this.dataSource.filterPredicate = (data, filter: string) => {
            const values = [];
            this.displayedColumns.forEach(fieldName => {
                let value;
                if (fieldName === 'createdAt') {
                    value = this.localDatePipe.transform(data['createdAt'], this.schoolTimeZone).slice(0, 10);
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

    private setSelectedCurrentYear() {
        let desiredYear = moment().year();
        desiredYear = this.stateService.getFilterAsNumber(StateService.analyticsEnquiriesPospectusesCmpYear, desiredYear);
        if (this.years.length > 0) {
            const desiredIntakeYear = _(this.years).find((item) => item['year'] === desiredYear);
            desiredYear = desiredIntakeYear ? desiredYear : this.years[0]['year'];
        }
        this.startYear = desiredYear;
    }

    ngOnDestroy() {
        this.subscrCampusList.unsubscribe();
    }

    campusChange() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = (this.userInfo.campusId === null) ? 'all' : this.userInfo.campusId;
        this.startYear = null;
        this.campusChanged(this.campusId);
        this.buildTable(this.prospectuses)
    }

    private createForm() {
        this.prospectusesForm = this.fb.group({ year: [this.startYear] });
        this.loaded = true;
    }

    yearChanged(year: number) {
        this.startYear = year;
        this.stateService.setFilterAsNumber(StateService.analyticsEnquiriesPospectusesCmpYear, this.startYear);
        this.campusChanged(this.campusId);
        this.buildTable(this.prospectuses)
    }

    private filterByYear() {
        this.prospectuses = _.filter(this.allProspectuses, p => p.year === this.startYear);
    }

    campusChanged(campusId: number | string) {
        this.setSelectedCurrentYear();
        this.filterByYear();
        if (campusId !== 'all') {
            this.prospectuses = _.filter(this.prospectuses, (item: Prospectus) => item.campusId === campusId);
        }
        this.totalCount = this.prospectuses.length;
        this.inputBarChart = this.calculate(this.startYear);
        this.createForm();
    }

    private calculate(value: number) {
        const inputBarChart: Array<number> = [];
        _.forEach(Constants.months, (month: string) => {
            const count: _.Dictionary<number> = _.countBy(this.prospectuses, (p: Prospectus) => p.month === month);
            const perMonth = (count.true) || 0;
            inputBarChart.push(perMonth);
        });
        return inputBarChart;
    }

    goToStudent(id: number) {
        this.router.navigate([`/${environment.localization.enquiriesUrl}/edit-student`, { studentId: id }]);
    }

}
