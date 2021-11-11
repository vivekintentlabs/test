import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpService } from 'app/services/http.service';
import { ListenerService } from 'app/services/listener.service';
import { StateService } from 'app/services/state.service';
import { LocaleService } from 'app/services/locale.service';

import { SchoolQuery } from 'app/state/school';

import { Student } from 'app/entities/student';
import { YearLevel } from 'app/entities/year-level';
import { YearLevelList } from 'app/entities/year-level-list';
import { Enquiries } from 'app/entities/local/enquiries';
import { ChartData } from 'app/entities/local/chart-data';

import { Constants } from 'app/common/constants';
import { Utils } from 'app/common/utils';
import { T } from 'app/common/t';

import { DashboardWidgetComponent } from '../../dashboard-widget/dashboard-widget.component';

import * as moment from 'moment';
import * as _ from 'lodash';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-enquiries-students',
    templateUrl: 'students.component.html',
    styleUrls: ['students.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class EnquiriesStudentsComponent extends DashboardWidgetComponent implements OnInit, OnDestroy {

    public environment = environment;
    public enquiriesStudentForm: FormGroup = null;
    public years: number[] = [];
    public students: Enquiries[] = [];
    public selectedYear: number;
    public startingYearSelected: number;
    public startingYears: number[];
    public yearLevels: YearLevelList;
    public selectedYearLevels: YearLevel[];
    public campusId: number | string = 'all';
    public inputBarChart: ChartData = null;
    public inputBarChartSum = null;
    public inputStackedStatusBarChart = null;
    public inputStackedIntakeYearLevelBarChart = null;
    public inputLineChart: ChartData = null;
    public dash = '- -';

    private allStudents: Student[];
    private enquiriesByYear: Map<number, Enquiries[]> = new Map<number, Enquiries[]>();
    public enquiriesForRankingScoreBarChart: Enquiries[] = [];
    public enquiriesForRankingScoreLineChart: Enquiries[] = [];


    constructor(
        private fb: FormBuilder,
        private httpService: HttpService,
        listenerService: ListenerService,
        private stateService: StateService,
        localeService: LocaleService,
        schoolQuery: SchoolQuery,
    ) {
        super(listenerService, schoolQuery);
    }

    public ngOnInit() {
        return this.httpService.getAuth('student/enquiries').then((result: any) => {
            this.userInfo = Utils.getUserInfoFromToken();
            this.campusId = this.userInfo.campusId || 'all';

            this.yearLevels = new YearLevelList(result.enquiries.yearLevels);
            this.allStudents = result.enquiries.students;
            this.initBarChart();
            this.initLineChart();

            this.years = Array.from(this.enquiriesByYear.keys());
            this.startingYears = _.uniq(_.map(this.enquiriesForRankingScoreBarChart, 'student.startingYear')).sort();

            this.setSelectedYear();
            this.campusChanged();
        });
    }

    private initBarChart() {
        _.forEach(this.allStudents, (student: Student) => {
            const year: number = moment(student.createdAt).year();
            let enquiries = this.enquiriesByYear.get(year);
            if (!enquiries) {
                enquiries = new Array<Enquiries>();
                this.enquiriesByYear.set(year, enquiries);
            }

            enquiries.push(this.getEnquiryObj(student));
            this.enquiriesForRankingScoreBarChart.push(this.getEnquiryObj(student));
        });
    }

    private initLineChart() {
        _.forEach(this.allStudents, (student: Student) => {
            this.enquiriesForRankingScoreLineChart.push(this.getEnquiryObj(student));
        });
    }

    private getEnquiryObj(student: Student) {
        return {
            student,
            month: moment(student.createdAt).format(Constants.dateFormats.shortMonth),
            leadSource: student.leadSource ? student.leadSource.name : T.unknown,
            schoolIntakeYear: student.schoolIntakeYear ? student.schoolIntakeYear.name : T.unknown,
            campusId: student.campusId,
            rankingScore: student.score
        };
    }

    private setSelectedYear() {
        let desiredYear = this.stateService.getFilterAsNumber(StateService.analyticsEnquiriesStudentsCmpYear, moment().year());
        if (this.years.length > 0) {
            const desiredIntakeYear = _(this.years).sort().find((item: number) => item === desiredYear);
            desiredYear = desiredIntakeYear ? desiredYear : this.years[0];
        }
        this.selectedYear = desiredYear;
        this.startingYearSelected =
            this.stateService.getFilterAsNumber(StateService.analyticsEnquiriesStudentsCmpStartingYear, moment().year());
    }

    protected onCampusChanged() {
        this.campusId = this.userInfo.campusId || 'all';
        this.selectedYear = null;
        this.startingYearSelected = null;
        this.setSelectedYear();
        this.campusChanged();
    }

    private createForm() {
        this.enquiriesStudentForm = this.fb.group({
            year: [this.selectedYear],
            startingYear: [this.startingYearSelected],
        });
        this.loaded = true;
    }

    yearChanged(year: number) {
        this.selectedYear = year;
        this.doFilter();
        this.stateService.setFilterAsNumber(StateService.analyticsEnquiriesStudentsCmpYear, this.selectedYear);
    }

    startingYearChanged(year: number) {
        this.startingYearSelected = year;
        this.inputLineChart = this.calculateLineChart();
        this.stateService.setFilterAsNumber(StateService.analyticsEnquiriesStudentsCmpStartingYear, this.startingYearSelected);
    }

    campusChanged() {
        this.doFilter();
        this.inputLineChart = this.calculateLineChart();
        this.createForm();
    }

    private initializationLevels(yearLevels: YearLevel[]) {
        this.selectedYearLevels = [];
        const realCampusId: number = (this.campusId === 'all') ? null : +this.campusId;
        _.forEach(yearLevels, (yearLevel: YearLevel) => {
            if (yearLevel.isCore(realCampusId)) {
                if (!_.includes(this.selectedYearLevels, yearLevel)) {
                    this.selectedYearLevels.push(yearLevel);
                }
            }
        });
        this.selectedYearLevels.push({ id: null, name: 'Other' } as YearLevel);
    }

    private doFilter() {
        this.students = this.enquiriesByYear.get(this.selectedYear);
        if (this.campusId !== 'all') {
            this.students = _.filter(this.students, (e: Enquiries) => e.campusId === this.campusId);
        }
        this.initializationLevels(this.yearLevels.getCurrentSchoolYearLevelsByCampus(this.campusId));
        this.inputBarChart = this.calculateBarChart();
        this.sumOfBarCharInputs();
    }

    private sumOfBarCharInputs() {
        const inputBarChartTemp = this.inputBarChart;
        const sum = [];
        _.forEach(inputBarChartTemp.series, item => {
            const sumItem = _.sum(item.data);
            sum.push(sumItem);
        });
        this.inputBarChartSum = _.sum(sum);
    }

    private calculateLineChart() {
        const students = _.filter(this.enquiriesForRankingScoreLineChart, (s: Enquiries) => {
            return (this.campusId !== 'all')
                ? (s.student.campusId === this.campusId && s.student.startingYear === this.startingYearSelected)
                : (s.student.startingYear === this.startingYearSelected);
        });
        const groupedStudentsByScore: any = _.groupBy(students, 'rankingScore');
        const inputData: number[][] = Array(this.selectedYearLevels.length);

        for (let counter = 0; counter < inputData.length; counter++) {
            inputData[counter] = new Array<number>();
        }
        const labelsLineChart = _.keys(groupedStudentsByScore);

        _.forEach(labelsLineChart, (score: string) => {
            let coreIYStudents = 0;
            _.forEach(this.selectedYearLevels, (item, key) => {
                if (item.name !== 'Other') {
                    const count: _.Dictionary<number> = _.countBy(groupedStudentsByScore[score], (s: Enquiries) => {
                        return s.schoolIntakeYear === item.name;
                    });
                    const countSts = count.true || 0;
                    inputData[key].push(countSts);
                    coreIYStudents = coreIYStudents + countSts;
                } else {
                    inputData[key].push(groupedStudentsByScore[score] === undefined ? 0
                        : (groupedStudentsByScore[score].length === 1 && coreIYStudents === 0 ? 1
                            : groupedStudentsByScore[score].length - coreIYStudents));
                }
            });
        });
        const inputLineChart: ChartData = {
            labels: labelsLineChart,
            series: []
        };
        _.forEach(this.selectedYearLevels, (item, key) => {
            inputLineChart.series.push({
                legend: {
                    name: item.name,
                    url: (this.userInfo.isSchoolEditorOrHigher() && item.name !== 'Other') ? `/${environment.localization.enquiriesUrl}/students` : '',
                    params: (this.userInfo.isSchoolEditorOrHigher() && item.name !== 'Other') ? {
                        intakeYear: this.startingYearSelected || 'all',
                        campusId: this.campusId,
                        intakeYearLevels: item.id,
                    } : null
                },
                className: '',
                data: inputData[key]
            });
        });
        Utils.addClassName(inputLineChart);
        return inputLineChart;
    }

    private calculateBarChart() {
        const groupedStudentsByMonth: any = _.groupBy(this.students, 'month');
        const inputData: number[][] = Array(this.selectedYearLevels.length);
        for (let counter = 0; counter < inputData.length; counter++) {
            inputData[counter] = new Array<number>();
        }
        _.forEach(Constants.months, (month: string) => {
            let coreIYStudents = 0;
            _.forEach(this.selectedYearLevels, (item, key) => {
                if (item.name !== 'Other') {
                    const count: _.Dictionary<number> = _.countBy(groupedStudentsByMonth[month], (s: Enquiries) => {
                        return s.schoolIntakeYear === item.name;
                    });
                    const countSts = count.true || 0;
                    inputData[key].push(countSts);
                    coreIYStudents = coreIYStudents + countSts;
                } else {
                    inputData[key].push(groupedStudentsByMonth[month] === undefined ? 0
                        : (groupedStudentsByMonth[month].length === 1 && coreIYStudents === 0 ? 1
                            : groupedStudentsByMonth[month].length - coreIYStudents));
                }
            });
        });
        const inputBarChart: ChartData = {
            labels: Constants.months,
            series: []
        };
        _.forEach(this.selectedYearLevels, (item, key) => {
            inputBarChart.series.push({
                legend: {
                    name: item.name,
                    url: (this.userInfo.isSchoolEditorOrHigher() && item.name !== 'Other') ? `/${environment.localization.enquiriesUrl}/students` : '',
                    params: (this.userInfo.isSchoolEditorOrHigher() && item.name !== 'Other') ? {
                        intakeYear: 'all',
                        campusId: this.campusId,
                        intakeYearLevels: item.id,
                        enquiryYear: this.selectedYear
                    } : null
                },
                className: '',
                data: inputData[key]
            });
        });
        Utils.addClassName(inputBarChart);
        return inputBarChart;
    }
}
