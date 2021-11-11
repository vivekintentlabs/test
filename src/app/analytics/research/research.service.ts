import { Injectable } from '@angular/core'

import { HttpService } from '../../services/http.service';
import { AnalyticsService } from '../analytics.service';

import { Keys } from 'app/common/keys';
import { Utils } from 'app/common/utils';
import { T } from 'app/common/t';
import { UniqNames } from 'app/common/uniq-names';

import { Student } from 'app/entities/student';
import { YearLevelList } from 'app/entities/year-level-list';
import { YearLevel } from 'app/entities/year-level';
import { ChartData } from 'app/entities/local/chart-data';
import { PieChartColData } from 'app/entities/local/pie-chart-col-data';

import * as _ from 'lodash'
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ResearchService extends AnalyticsService {

    constructor(httpService: HttpService) {
        super(httpService);
        this.uniqName = UniqNames[UniqNames.AnalyticsResearch];
        this.title = 'Research';
        this.icon = 'analytics';
    }

    public getData(): Promise<Student[]> {
        return this.httpService.getAuth('student/activity/').then((result: any) => {
            this.userInfo = Utils.getUserInfoFromToken();
            this.campusId = this.userInfo && this.userInfo.campusId ? this.userInfo.campusId : 'all';
            this.campuses = result.campuses;

            _.forEach(result.activity.intakeYears, (intakeYear: any) => {
                if (intakeYear) {
                    this.intakeYears.push({ intakeYear: intakeYear });
                }
            });

            this.allStudents = result.activity.studentsJson;
            this.yearLevelList = new YearLevelList(result.activity.yearLevels);

            return this.allStudents;
        });
    }

    calculate(students: Student[], startingYears: number[], selectedYearLevels: YearLevel[], filter: string) {
        const uniq = this.getLegend(students, filter);
        const groupedStudents: any = _.groupBy(students, Keys.schoolIntakeYearId);

        const inputPieChart: PieChartColData = {
            legends: [],
            labels: _.map(selectedYearLevels, yl => yl.name),
            classNames: Utils.getClassNames(_.map(uniq, i => i.name)),
            series: []
        };
        _.forEach(selectedYearLevels, (yl: YearLevel) => {
            const group = groupedStudents[yl.id];
            if (group && group.length > 0) {
                const countList = [];
                _.forEach(uniq, (item) => {
                    const filtered = (item.id)
                        ? _.filter(group, sFYL => sFYL[filter] && sFYL[filter].id === item.id)
                        : _.filter(group, sFYL => !sFYL[filter]);
                    const per = (filtered.length / group.length) * 100 || 0;
                    countList.push(Number((per).toFixed(1)));
                });
                inputPieChart.series.push({ data: this.roundPercentages(countList, 100), total: group.length });
            } else {
                inputPieChart.series.push({ data: null, total: null });
            }
        });
        _.forEach(uniq, (item) => {
            inputPieChart.legends.push({
                name: item.name,
                url: (this.userInfo.isSchoolEditorOrHigher()) ? `/${environment.localization.enquiriesUrl}/students` : '',
                params: (this.userInfo.isSchoolEditorOrHigher())
                    ? {
                        title: (filter === Keys.leadSource) ? Keys.leadSource : Keys.hearAboutUs,
                        legendId: item.id || 0,
                        intakeYear: _.join(_.map(startingYears, i => i || 0), ','),
                        intakeYearLevels: _.join(_.map(selectedYearLevels, yl => yl.id || 0), ','),
                        campusId: this.campusId
                    }
                    : null
            });
        });
        return inputPieChart;
    }

    private roundPercentages(l, target) {
        const off: number = target - _.reduce(l, (acc, x: number) => acc + Math.round(x), 0);
        let lastSubstraction;
        let lastButOneSubstraction;
        return _.chain(l).
            map((x: number, i: number) => {
                lastSubstraction = (i >= (l.length + off)) && !lastButOneSubstraction;
                lastButOneSubstraction = (l[i + 1] === 0 && i + 1 >= (l.length + off) && !(i >= (l.length + off)));
                const y: number = (lastSubstraction || lastButOneSubstraction) ? 1 : 0;
                const z: number = off > i ? 1 : 0;
                const b: number = l.length > 3 && (l[1] && l[0]) === 0 && l[l.length - 1] !== 0 && (i + 1 === (l.length - 1)) ? 1 : 0;

                return (x === 0) ? 0 : Math.round(x) + z - y;
            }).
            value();
    }

    private getLegend(students: Student[], filter: string): any[] {
        return _(students).map(s => s[filter] ? s[filter] : { id: null, name: T.unknown }).uniqBy(i => i.id).value() || [];
    }

    calculateBarChart(students: Student[], startingYears: number[], selectedYearLevels: YearLevel[], filter: string) {
        const groupedStudents: any = _.groupBy(students, Keys.schoolIntakeYearId);
        const uniq = this.getLegend(students, filter);

        const inputData: Array<{ ylId: string, value: any[] }> = [];
        _.forEach(groupedStudents, (group: Student[], key) => {
            if (group.length > 0) {
                const countList = [];
                _.forEach(uniq, (item) => {
                    const filtered = (item.id)
                        ? _.filter(group, sFYL => sFYL[filter] && sFYL[filter].id === item.id)
                        : _.filter(group, sFYL => !sFYL[filter]);

                    countList.push(filtered.length);
                });
                inputData.push({ ylId: key, value: countList });
            } else {
                inputData.push({ ylId: key, value: [0] });
            }
        });

        const inputBarChart: ChartData = {
            labels: _.map(uniq, i => i.name),
            series: []
        };

        const statusIds = _(students).uniqBy(s => s.studentStatusId).map((s: Student) => s.studentStatusId).value();

        const stageIds = _(students).filter((s) => !!(s.studentStatus && s.studentStatus.stageId))
            .uniqBy((s: Student) => s.studentStatus.stageId).map((s: Student) => s.studentStatus.stageId).value();

        _.forEach(selectedYearLevels, (yl) => {
            const tmpData = (yl.id !== null) ? _.find(inputData, i => +i.ylId === yl.id) : _.find(inputData, i => i.ylId === 'null');

            inputBarChart.series.push({
                legend: {
                    name: yl.name,
                    sequence: yl.sequence,
                    url: (this.userInfo.isSchoolEditorOrHigher()) ? `/${environment.localization.enquiriesUrl}/students` : '',
                    params: (this.userInfo.isSchoolEditorOrHigher()) ? {
                        title: (filter === Keys.leadSource) ? Keys.leadSource : Keys.hearAboutUs,
                        intakeYear: _.join(_.map(startingYears, i => i || 0), ','),
                        intakeYearLevels: yl.id || 0,
                        stages: _.join(stageIds, ','),
                        statuses: _.join(statusIds, ','),
                        campusId: this.campusId
                    } : null
                },
                className: '',
                data: tmpData ? tmpData.value : [0]
            })
        });
        inputBarChart.series = _.orderBy(inputBarChart.series, ['legend.sequence'], ['asc']);
        Utils.addClassName(inputBarChart);
        return inputBarChart;
    }

}
