import { Component, OnInit, ViewEncapsulation, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';

import { HttpService } from '../../services/http.service';
import { StateService } from '../../services/state.service';
import { ListenerService } from '../../services/listener.service';
import { LocaleService } from 'app/services/locale.service';

import { ListItem } from '../../entities/list-item';
import { Student } from '../../entities/student';
import { Event } from '../../entities/event';
import { PersonalTour } from '../../entities/personal-tour';
import { Campus } from '../../entities/campus';
import { AttendeesByStartingYear } from '../../entities/local/attendees-by-starting-year';
import { ChartData } from '../../entities/local/chart-data';
import { UserInfo } from '../../entities/userInfo';
import { YearLevelList } from 'app/entities/year-level-list';
import { YearLevel } from 'app/entities/year-level';

import { Constants } from 'app/common/constants';
import { EventAttendanceUtils } from 'app/common/attendance-utils';
import { Utils } from 'app/common/utils';
import { T } from 'app/common/t';
import { SchoolQuery } from 'app/state/school';

import * as _ from 'lodash';
import * as moment from 'moment';
import { environment } from 'environments/environment';

declare var $: any;

@Component({
    selector: 'app-analytics-events',
    templateUrl: 'events.component.html',
    styleUrls: ['events.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class AnalyticsEventsComponent implements OnInit, OnDestroy {

    public eventAnalyticsForm: FormGroup = null;
    public loaded = false;
    public eventYears: number[] = [];
    public ptYears: number[] = [];
    public events: Event[] = [];
    public personalTours: PersonalTour[] = [];
    public eventYear: number;
    public ptYear: number;
    private allEvents: Map<number, Event[]> = new Map<number, Event[]>();
    private allPersonalTours: Map<number, PersonalTour[]> = new Map<number, PersonalTour[]>();
    public campuses: Campus[] = [];
    public campusId: number | string = 'all';
    public labels = Constants.months;
    public intakeYears: any[] = [];
    public offsetY = [270, 110];
    public eventTypeList: ListItem[] = [];
    public schoolTourId: number | string = 'all';
    public inputBarChart = null;
    public inputStackedStatusBarChart = null;
    public inputStackedIntakeYearLevelBarChart = null;
    private eventAttendanceUtils: EventAttendanceUtils;
    subscrCampusList: Subscription;
    public userInfo: UserInfo = null;
    public yearLevelList: YearLevelList;
    public yearLevelNames: string[] = [];
    public attendeesByStartingYear: AttendeesByStartingYear[] = [];
    @ViewChild('tableResponsiveAttendees') tableResponsiveAttendees: ElementRef;
    @ViewChild('tableaAttendees') tableaAttendees: ElementRef;
    @ViewChild('yearLevelHeader') yearLevelHeader: ElementRef;
    public headerHeight: number;
    public isResponsive = false;
    public startScroll = 0;
    public scrollwidth = 0;
    public sumStudents = 0;
    public totalAttendees: number[] = [];
    public showScrollTableLeft = false;
    public showScrollTableRight = true;
    locale = '';
    startingMonth$ = this.schoolQuery.startingMonth$;

    private ngUnsubScribe = new Subject();

    constructor(
        private fb: FormBuilder,
        private httpService: HttpService,
        private listenerService: ListenerService,
        private stateService: StateService,
        private localeService: LocaleService,
        private schoolQuery: SchoolQuery,
        private translate: TranslateService
    ) {
        this.subscrCampusList = this.listenerService.campusListStatus().subscribe(() => { this.campusChange(); });
    }

    public ngOnInit() {
        return this.httpService.getAuth('events/analytics').then((result: any) => {
            this.userInfo = Utils.getUserInfoFromToken();
            this.locale = this.localeService.getCurrentLocale();
            this.campusId = (this.userInfo.campusId === null) ? 'all' : this.userInfo.campusId;
            this.campuses = result.campuses;
            this.eventTypeList = result.eventTypeList;
            this.intakeYears = result.intakeYears;
            this.yearLevelList = new YearLevelList(result.yearLevels);
            this.intakeYears = _.sortBy(this.intakeYears);
            if (_.find(this.intakeYears, (item) => item === null)) {
                _.remove(this.intakeYears, (item) => item === null);
                this.intakeYears.push(T.unknown);
            }
            this.eventAttendanceUtils = new EventAttendanceUtils();
            _.forEach(result.events, (event: Event) => {
                const year: number = moment(event.date, Constants.dateFormats.date).year();
                let events = this.allEvents.get(year);
                if (!events) {
                    events = new Array<Event>();
                    this.allEvents.set(year, events);
                }
                const counters = this.eventAttendanceUtils.getEventAttendance(event.bookings);
                event.eventStudents = counters.eventStudents;
                event.attendedStudents = counters.eventAttendedStudents;
                event.totalAttendedStudents = counters.attendedStudentsCount;
                event.checkedInStudents = counters.checkedInStudentsCount;
                event.studentsCount = counters.studentsCount;
                event.contacts = counters.contactsCount;
                event.families = counters.familiesCount;
                event.attending = counters.totalAttendees;
                event.studentsApplicant = counters.studentsApplicant;
                event.studentsInterest = counters.studentsInterest;
                event.studentsEnroled = counters.studentsEnroled;
                event.checkinsPercentage = counters.checkinsPercentage;
                event.checkins = counters.checkedInCount;
                event.otherAttendees = counters.otherAttendees;
                events.push(event);
            });
            _.forEach(result.personalTours, (pt: PersonalTour) => {
                const year: number = moment(pt.date, Constants.dateFormats.date).year();
                let personalTours = this.allPersonalTours.get(year);
                if (!personalTours) {
                    personalTours = new Array<PersonalTour>();
                    this.allPersonalTours.set(year, personalTours);
                }
                personalTours.push(pt);
            });
            this.eventYears = Array.from(this.allEvents.keys());
            this.ptYears = Array.from(this.allPersonalTours.keys());
            this.setSelectedYear();
            this.campusChanged(this.campusId);
        });
    }

    private setSelectedYear() {
        let desiredYear = moment().year();
        if (this.eventYears.length !== 0) {
            desiredYear = this.stateService.getFilterAsNumber(StateService.analyticsEventsCmpEventYear, desiredYear);
            const desiredIntakeYear = _(this.eventYears).sort().find((item: number) => item === desiredYear);
            desiredYear = desiredIntakeYear ? desiredYear : this.eventYears[0];
        }
        this.eventYear = desiredYear;

        const schoolTourIdTmp = this.stateService.getFilterAsNumber(StateService.analyticsEventsCmpEventType, null);
        this.schoolTourId = schoolTourIdTmp || 'all';

        if (this.ptYears.length !== 0) {
            desiredYear = this.stateService.getFilterAsNumber(StateService.analyticsEventsCmpPTYear, moment().year());
            const desiredIntakeYear = _(this.ptYears).sort().find((item: number) => item === desiredYear);
            desiredYear = desiredIntakeYear ? desiredYear : this.ptYears[0];
        }
        this.ptYear = desiredYear;
    }

    ngOnDestroy() {
        this.subscrCampusList.unsubscribe();
        this.ngUnsubScribe.next();
        this.ngUnsubScribe.complete();
    }

    campusChange() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = (this.userInfo.campusId === null) ? 'all' : this.userInfo.campusId;
        this.eventYear = null;
        this.ptYear = null;
        this.schoolTourId = 'all';
        this.setSelectedYear();
        this.campusChanged(this.campusId);
    }

    private createForm() {
        this.eventAnalyticsForm = this.fb.group({
            eventYear: [this.eventYear],
            ptYear: [this.ptYear],
            schoolTourId: [(this.schoolTourId) ? this.schoolTourId : 'all'],
            registrants: ['all']
        });
        this.loaded = true;
    }

    eventYearChanged(year: number) {
        this.eventYear = year;
        this.stateService.setFilterAsNumber(StateService.analyticsEventsCmpEventYear, this.eventYear);
        this.doFilter();
    }

    ptYearChanged(year: number) {
        this.ptYear = year;
        this.stateService.setFilterAsNumber(StateService.analyticsEventsCmpPTYear, this.ptYear);
        this.doFilter();
    }

    initSchoolIntakeYears() {
        this.yearLevelNames = [];
        const yearLevelsForCurrentCampus: YearLevel[] = this.yearLevelList.getAvailableSchoolYearLevelsByCampus(this.campusId);
        yearLevelsForCurrentCampus.forEach(yl => {
            this.yearLevelNames.push(yl.name);
        });
        this.yearLevelNames.push(T.unknown, 'Other');
    }

    campusChanged(campusId: number | string) {
        this.campusId = campusId;
        this.initSchoolIntakeYears();
        this.createForm();
        this.doFilter();
    }

    eventTypeChanged(schoolTourId: number | string) {
        this.schoolTourId = schoolTourId;
        this.stateService.setFilterAsNumber(
            StateService.analyticsEventsCmpEventType, _.isNumber(this.schoolTourId) ? this.schoolTourId : null
        );
        this.doFilter();
    }

    doFilter() {
        this.personalTours = this.allPersonalTours.get(this.ptYear);
        this.events = this.allEvents.get(this.eventYear);
        if (this.campusId !== 'all') {
            this.events = _.filter(this.events, (item: Event) => item.campusId === this.campusId);
            this.personalTours = _.filter(this.personalTours, (item: PersonalTour) => item.campusId === this.campusId);

        }
        const savedSchoolTourId = this.stateService.getFilterAsNumber(StateService.analyticsEventsCmpEventType, null);
        this.schoolTourId = savedSchoolTourId ? savedSchoolTourId : this.schoolTourId;
        if (this.schoolTourId !== 'all') {
            this.events = _.filter(this.events, (item: Event) => item.schoolTourId === this.schoolTourId);
        }
        this.inputBarChart = this.calculateBarChart();
        this.inputStackedStatusBarChart = this.calculateStausBarChartStacked();
        this.inputStackedIntakeYearLevelBarChart = this.calculateIntakeYearLevelBarChartStacked();
        this.initEventAttendeesByStartingYear();
        setTimeout(() => {
            this.checkIsResponsive();
        }, 0);
    }

    private calculateBarChart() {
        const inputBarChart = [];
        _.forEach(this.labels, (month: string) => {
            const count: _.Dictionary<number> = _.countBy(this.events, (e: Event) => {
                return moment(e.date).format(Constants.dateFormats.shortMonth) === month;
            });
            const perMonth = (count.true) || 0;
            inputBarChart.push(perMonth);
        });
        return inputBarChart;
    }

    private calculateStausBarChartStacked() {
        const inputData = [];
        const interest = [];
        const applicant = [];
        const enroled = [];
        const contacts = [];
        const otherAttendees = [];
        const eventLabelsByStatus = [];
        this.events = _.orderBy(this.events, 'date', 'desc');
        _.forEach(this.events, (e: Event) => {
            eventLabelsByStatus.push(
                ((e.schoolTour) ? e.schoolTour.name : T.unknown) + ' ' +
                this.localeService.transformLocaleDate(e.date, Constants.localeFormats.shortDate) +
                ((e.families === 0) ? '' : (e.families === 1) ? ' (' + e.families + ' family)' : ' (' + e.families + ' families)')
            );
            interest.push(e.studentsInterest);
            applicant.push(e.studentsApplicant);
            enroled.push(e.studentsEnroled);
            contacts.push(e.contacts);
            otherAttendees.push(e.otherAttendees);
        });
        inputData.push(interest, applicant, enroled, contacts, otherAttendees);
        const inputBarChart: ChartData = {
            labels: eventLabelsByStatus,
            series: []
        };
        _.forEach(['Interest', 'Applicant', 'Enroled', 'Contacts', 'Other attendees'], (item, key) => {
            inputBarChart.series.push({
                legend: {
                    name: item,
                    url: '',
                    params: null
                },
                className: '',
                data: inputData[key]
            });
        });
        Utils.addClassName(inputBarChart);
        return inputBarChart;
    }

    private calculateIntakeYearLevelBarChartStacked() {
        const inputData: number[][] = Array(this.intakeYears.length);
        for (let counter = 0; counter < inputData.length; counter++) {
            inputData[counter] = new Array<number>();
        }
        const eventLabelsByInatkeYearLevels = [];
        _.forEach(this.events, (e: Event) => {
            eventLabelsByInatkeYearLevels.push(
                ((e.schoolTour) ? e.schoolTour.name : T.unknown) + ' ' +
                this.localeService.transformLocaleDate(e.date, Constants.localeFormats.shortDate)
            );
            _.forEach(this.intakeYears, (item, key) => {
                const count: _.Dictionary<number> = _.countBy(e.eventStudents, (s: Student) => s.sy === item);
                inputData[key].push(count.true !== undefined ? count.true : 0);
            });
        });
        const inputBarChart: ChartData = {
            labels: eventLabelsByInatkeYearLevels,
            series: []
        };
        let title = '';
        this.translate.get('et.intakeYear').pipe(takeUntil(this.ngUnsubScribe)).subscribe((intakeYear: string) => title = `Event Registrants by ${intakeYear}`);
        _.forEach(this.intakeYears, (item, key) => {
            inputBarChart.series.push({
                legend: {
                    name: item,
                    url: (this.userInfo.isSchoolEditorOrHigher()) ? `/${environment.localization.enquiriesUrl}/students` : '',
                    params: (this.userInfo.isSchoolEditorOrHigher()) ? {
                        title,
                        intakeYear: item,
                        campusId: this.campusId
                    } : null
                },
                className: '',
                data: inputData[key]
            });
        });
        Utils.addClassName(inputBarChart);
        return inputBarChart;
    }

    private initEventAttendeesByStartingYear() {
        this.attendeesByStartingYear = [];
        this.sumStudents = 0;
        this.events = _.orderBy(this.events, 'date', 'asc');
        _.forEach(this.events, (event: Event) => {
            const obj: number[] = [];
            _.forEach(this.intakeYears, (y) => {
                let coreIYStudents = 0;
                let temp;
                if (this.eventAnalyticsForm.controls.registrants.value === 'all') {
                    temp = _.filter(event.eventStudents, item => item.sy === (y || T.unknown));
                } else {
                    temp = _.filter(event.attendedStudents, item => item.sy === (y || T.unknown));
                }
                _.forEach(this.yearLevelNames, (ylName) => {
                    if (ylName !== 'Other') {
                        const count: _.Dictionary<number> = _.countBy(temp, (s) => {
                            return s.sIY === ylName;
                        });
                        const countSts = count.true !== undefined ? count.true : 0;
                        coreIYStudents = coreIYStudents + countSts;
                        obj.push(countSts);
                    } else {
                        obj.push(temp.length - coreIYStudents);
                    }
                });
            });

            const totalStudents =
                (this.eventAnalyticsForm.controls.registrants.value === 'all') ? event.studentsCount : event.totalAttendedStudents;

            this.attendeesByStartingYear.push({
                eventName: ((event.schoolTour) ? event.schoolTour.name : T.unknown),
                date: this.localeService.transformLocaleDate(event.date, Constants.localeFormats.shortDate),
                attendees: obj,
                totalStudents
            });
            this.sumStudents += totalStudents;
        });
        if (this.attendeesByStartingYear[0]) {
            this.totalAttendees =
                Array.apply(null, Array(this.attendeesByStartingYear[0].attendees.length)).map(Number.prototype.valueOf, 0);

            _.forEach(this.attendeesByStartingYear, (item: AttendeesByStartingYear) => {
                this.totalAttendees = this.totalAttendees.map((a, i) => a + item.attendees[i]);
            });
        }
    }

    onResize(event) {
        this.checkIsResponsive();
    }

    checkIsResponsive() {
        if (this.tableaAttendees && this.tableaAttendees.nativeElement) {
            this.isResponsive =
                (this.tableaAttendees.nativeElement.offsetWidth === this.tableResponsiveAttendees.nativeElement.offsetWidth) ? false : true;
        }
        if (this.yearLevelHeader && this.yearLevelHeader.nativeElement) {
            this.headerHeight = this.yearLevelHeader.nativeElement.offsetHeight + 1; // add 1 pixel to year levels header get same header
        }
    }

    scrollTableRight() {
        this.scrollwidth = (this.tableaAttendees.nativeElement.offsetWidth - this.tableResponsiveAttendees.nativeElement.offsetWidth);
        if (this.scrollwidth > this.tableResponsiveAttendees.nativeElement.scrollLeft) {
            $('#tableResponsiveAttendees').scrollLeft((this.scrollwidth * 0.5) + this.tableResponsiveAttendees.nativeElement.scrollLeft);
        }
        if (this.tableResponsiveAttendees.nativeElement.scrollLeft === this.scrollwidth) {
            this.showScrollTableRight = false;
        }
        this.showScrollTableLeft = true;
    }

    scrollTableLeft() {
        this.scrollwidth = (this.tableaAttendees.nativeElement.offsetWidth - this.tableResponsiveAttendees.nativeElement.offsetWidth);
        if (this.scrollwidth >= this.tableResponsiveAttendees.nativeElement.scrollLeft) {
            $('#tableResponsiveAttendees').scrollLeft(this.tableResponsiveAttendees.nativeElement.scrollLeft - (this.scrollwidth * 0.5));
        }
        if (this.tableResponsiveAttendees.nativeElement.scrollLeft === 0) {
            this.showScrollTableLeft = false;
        }
        this.showScrollTableRight = true;
    }
}
