import { Injectable } from '@angular/core'

import { HttpService } from 'app/services/http.service';
import { AnalyticsService } from '../analytics.service';

import { Utils } from 'app/common/utils';
import { UniqNames } from 'app/common/uniq-names';
import { Keys } from 'app/common/keys';
import { T } from 'app/common/t';

import { Student } from 'app/entities/student';
import { YearLevelList } from 'app/entities/year-level-list';
import { YearLevel } from 'app/entities/year-level';
import { PieChartColData } from 'app/entities/local/pie-chart-col-data';
import { ChartData } from 'app/entities/local/chart-data';

import * as _ from 'lodash'
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SchoolComponentService extends AnalyticsService {

    constructor(httpService: HttpService) {
        super(httpService);
        this.uniqName = UniqNames[UniqNames.AnalyticsSchool];
        this.title = 'Schools';
        this.icon = 'import_contacts';
    }

    public getData(): Promise<Student[]> {
        return this.httpService.getAuth('student/analytics-school/').then((result: any) => {
            this.userInfo = Utils.getUserInfoFromToken();
            this.campusId = this.userInfo.campusId || 'all';

            this.campuses = result.campuses;
            _.forEach(result.school.intakeYears, (intakeYear: any) => {
                if (intakeYear) {
                    this.intakeYears.push({ intakeYear: intakeYear });
                }
            });

            this.allStudents = result.school.students;
            this.yearLevelList = new YearLevelList(result.school.yearLevels);

            return this.allStudents;
        });
    }

    public calculateCurrentSchoolClassifications(
        students: Student[], startingYears: number[], selectedYearLevels: YearLevel[], filter: string
    ) {
        const groupedStudents = _.groupBy(_.filter(students, s => _.includes(startingYears, s.startingYear)), Keys.schoolIntakeYearId);
        const uniq = this.getLegend(students, filter);

        const inputPieChart: PieChartColData = {
            legends: [],
            labels: _.map(selectedYearLevels, yl => yl.name),
            classNames: Utils.getClassNames(_.map(uniq, 'name')),
            series: []
        };
        _.forEach(selectedYearLevels, (yearLevel: YearLevel) => {
            const studentsForYearLevel: Student[] = groupedStudents[yearLevel.id];
            const size = studentsForYearLevel ? studentsForYearLevel.length : 0;
            const obj = [];
            if (size > 0) {
                _.forEach(uniq, (item) => {
                    const count: _.Dictionary<number> =
                        _.countBy(studentsForYearLevel, (s) => (_.get(s, filter + 'Id') || null) === item.id);
                    const per = (count.true / size) * 100 || 0;
                    obj.push(Number((per).toFixed(1)));
                });
                inputPieChart.series.push({ data: this.roundPercentages(obj, 100), total: size });
            } else {
                inputPieChart.series.push({ data: null, total: null });
            }
        });
        _.forEach(uniq, (item) => {
            inputPieChart.legends.push({
                name: item.name,
                sequence: item ? item.sequence : null,
                url: (this.userInfo.isSchoolEditorOrHigher()) ? `/${environment.localization.enquiriesUrl}/students` : '',
                params: (this.userInfo.isSchoolEditorOrHigher())
                    ? {
                        title: filter,
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
                if (x === 0) { return 0; }
                return Math.round(x) + z - y;
            }).
            value();
    }

    private getLegend(students: Student[], filter: string) {
        return _(students).map(s => _.get(s, filter) || { id: null, name: T.unknown }).uniqBy(i => i.id).sortBy(s => s.sequence).value();
    }

    public calculateCurrentSchoolStatuses(students: Student[], startingYears: number[], selectedYearLevels: YearLevel[], filter: string) {
        const inputData = [];
        const groupedStudents = _.groupBy(_.filter(students, s => _.includes(startingYears, s.startingYear)), filter + 'Id');
        const uniq = this.getLegend(students, filter);

        if (_.has(groupedStudents, undefined)) {
            groupedStudents['null'] = groupedStudents.undefined;
        }

        _.forEach(uniq, (item) => {
            const studentsForuniq: Student[] = groupedStudents[item.id];
            const obj = [];
            _.forEach(selectedYearLevels, (yearLevel: YearLevel) => {
                const count: _.Dictionary<number> = _.countBy(studentsForuniq, s => s.schoolIntakeYearId === yearLevel.id);
                obj.push(count.true ? count.true : 0);
            })
            inputData.push(obj);
        });
        const inputBarChart: ChartData = {
            labels: _.map(selectedYearLevels, yl => yl.name),
            series: []
        };

        _.forEach(uniq, (item, key) => {
            inputBarChart.series.push({
                legend: {
                    name: item.name,
                    sequence: item ? item.sequence : null,
                    url: (this.userInfo.isSchoolEditorOrHigher()) ? `/${environment.localization.enquiriesUrl}/students` : '',
                    params: (this.userInfo.isSchoolEditorOrHigher())
                        ? {
                            title: filter,
                            legendId: item.id || 0,
                            intakeYear: _.join(_.map(startingYears, i => i || 0), ','),
                            intakeYearLevels: _.join(_.map(selectedYearLevels, yl => yl.id || 0), ','),
                            campusId: this.campusId
                        }
                        : null
                },
                className: '',
                data: inputData[key]
            });
        });
        Utils.addClassName(inputBarChart);
        return inputBarChart;
    }

    public calculateCurrentSchools(students: Student[], startingYears: number[], selectedYearLevels: YearLevel[], filter: string) {
        const inputData = [];
        const groupedStudents = _.groupBy(_.filter(students, s => _.includes(startingYears, s.startingYear)), Keys.schoolIntakeYearId);
        const uniq = _(students).map(s => _.get(s, filter) || { id: null, schoolName: T.unknown })
            .uniqBy(i => i.id).sortBy(s => s.schoolName).reverse().value();

        const statusIds = _(students).uniqBy(s => s.studentStatusId).map((s: Student) => s.studentStatusId).value();
        const stageIds = _(students).filter((s) => !!(s.studentStatus && s.studentStatus.stageId))
            .uniqBy((s: Student) => s.studentStatus.stageId).map((s: Student) => s.studentStatus.stageId).value();

        _.forEach(selectedYearLevels, (yearLevel: YearLevel) => {
            const studentsForYearLevel: Student[] = groupedStudents[yearLevel.id];
            const size = studentsForYearLevel ? studentsForYearLevel.length : 0;
            const obj = [];
            if (size > 0) {
                _.forEach(uniq, (item) => {
                    const count: _.Dictionary<number> = _.countBy(studentsForYearLevel, s => (_.get(s, filter + 'Id')) === item.id);
                    obj.push(count.true ? count.true : 0);
                });
                inputData.push(obj);
            } else {
                inputData.push([0]);
            }
        });
        const inputBarChart: ChartData = {
            labels: _.map(uniq, i => i.schoolName),
            series: []
        };
        _.forEach(selectedYearLevels, (yearLevel: YearLevel, key) => {
            inputBarChart.series.push({
                legend: {
                    name: yearLevel.name,
                    sequence: yearLevel ? yearLevel.sequence : null,
                    url: (this.userInfo.isSchoolEditorOrHigher()) ? `/${environment.localization.enquiriesUrl}/students` : '',
                    params: {
                        intakeYear: startingYears,
                        intakeYearLevels: yearLevel.id || 0,
                        stages: _.join(stageIds, ','),
                        statuses: _.join(statusIds, ','),
                        campusId: this.campusId
                    }
                },
                className: '',
                data: inputData[key]
            });
        });
        Utils.addClassName(inputBarChart);
        inputBarChart.series = _.orderBy(inputBarChart.series, ['legend.sequence'], ['asc']);
        return inputBarChart;
    }

}
