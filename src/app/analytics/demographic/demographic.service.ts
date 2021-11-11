import { Injectable } from '@angular/core';

import { HttpService } from '../../services/http.service';
import { AnalyticsService } from '../analytics.service';

import { Keys } from 'app/common/keys';
import { Utils } from 'app/common/utils';
import { T } from 'app/common/t';
import { UniqNames } from 'app/common/uniq-names';

import { School } from 'app/entities/school';
import { Student } from 'app/entities/student';
import { YearLevelList } from 'app/entities/year-level-list';
import { YearLevel } from 'app/entities/year-level';
import { PieChartColData } from 'app/entities/local/pie-chart-col-data';
import { Demographic } from 'app/entities/local/demographic';

import * as _ from 'lodash';
import { environment } from 'environments/environment';
import { ChartService } from 'app/state/chart';

@Injectable({
    providedIn: 'root',
})
export class DemographicService extends AnalyticsService {
    public school: School;

    constructor(
        httpService: HttpService,
        private chartService: ChartService
    ) {
        super(httpService);
        this.uniqName = UniqNames[UniqNames.AnalyticsDemographic];
        this.title = 'Demographics';
        this.icon = 'groups';
    }

    public getData(): Promise<Student[]> {
        this.userInfo = Utils.getUserInfoFromToken();
        return this.httpService.getAuth('schools/get/' + this.userInfo.schoolId).then((schoolData: School) => {
            this.school = schoolData;
            return this.httpService.getAuth('student/demographic/').then((result: any) => {
                this.campusId = this.userInfo.campusId ? this.userInfo.campusId : 'all';
                this.campuses = result.campuses;

                _.forEach(result.demographic.intakeYears, (intakeYear: any) => {
                    if (intakeYear) {
                        this.intakeYears.push({ intakeYear });
                    }
                });

                this.allStudents = result.demographic.studentsJson;
                this.yearLevelList = new YearLevelList(result.demographic.yearLevels);

                return this.allStudents;
            });
        });
    }

    public getDemographics(students: Student[]): Demographic[] {
        const demographics = [];
        _.forEach(students, (student: Student) => {
            demographics.push({
                gender: student.gender ? student.gender.name : T.unknown,
                siblings: student.siblings ? student.siblings.name : T.unknown,
                alumni: student.hasAlumni,
                religion: student.religion ? student.religion.name : T.unknown,
                countryOfOrigin: student.countryOfOrigin ? student.countryOfOrigin.name : T.unknown,
                isInternational: student.isInternational ? 'Yes' : 'No',
                boardingType: student.boardingType ? student.boardingType.name : T.unknown,
                schoolIntakeYear: student.schoolIntakeYear ? student.schoolIntakeYear.name : T.unknown,
                intakeYear: student.startingYear,
                campusId: student.campusId
            });
        });
        return demographics;
    }

    public calculate(
        students: Student[], demographics: Demographic[], startingYears: number[],
        selectedYearLevels: YearLevel[], filter: string
    ) {
        const groupedStudents = _.groupBy(_.filter(demographics, d => _.includes(startingYears, d.intakeYear)), Keys.schoolIntakeYear);
        const selectedYearLevelNames = _.map(selectedYearLevels, yl => yl.name);
        const uniq = this.getLegend(students, filter);

        const inputPieChart: PieChartColData = {
            legends: [],
            labels: selectedYearLevelNames,
            classNames: Utils.getClassNames(_.map(uniq, i => i.name)),
            series: []
        };
        _.forEach(selectedYearLevelNames, (yearLevelName: string) => {
            const studentsForYearLevel: Demographic[] = groupedStudents[yearLevelName];
            const size = studentsForYearLevel == null ? 0 : studentsForYearLevel.length;
            const obj = [];
            const values = [];
            if (size > 0) {
                _.forEach(uniq, (item) => {
                    const count: _.Dictionary<number> = _.countBy(studentsForYearLevel, (sFYL) => {
                        return sFYL[filter] === item.name;
                    });
                    const per = (count.true / size) * 100 || 0;
                    obj.push(Number((per).toFixed(1)));
                    values.push(count.true || 0);
                });
                inputPieChart.series.push({ data: this.roundPercentages(obj, 100), total: size, values });
            } else {
                inputPieChart.series.push({ data: null, total: null, values: null });
            }
        });
        _.forEach(uniq, (item, index) => {
            inputPieChart.legends.push({
                name: item.name,
                url: (this.userInfo.isSchoolEditorOrHigher()) ? `/${environment.localization.enquiriesUrl}/students` : '',
                params: (this.userInfo.isSchoolEditorOrHigher()) ? {
                    title: filter,
                    legendId: item.id || 0,
                    intakeYear: _.map(startingYears, y => y || 0),
                    intakeYearLevels: _.map(selectedYearLevels, yl => yl.id || 0),
                    campusId: this.campusId
                } : null,
                isSelected: true,
                className: inputPieChart.classNames[index]
            });
        });

        this.chartService.addOrUpdate(`${filter}_${this.userInfo.id}`, inputPieChart, { yearLevels: selectedYearLevels, students});
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

    private getLegend(students: Student[], filter: string): any[] {
        if (filter === Keys.isInternational) {
            return _(students).uniqBy(s => s[filter]).map(s => s[filter]).reverse()
                .map(i => ({ id: i ? 1 : 0, name: i ? 'Yes' : 'No' })).value();
        } else if (filter === Keys.countryOfOrigin) {
            return _(students).filter(s => s.isInternational).map(s => s[filter] || { id: null, name: T.unknown })
                .uniqBy(s => s.id).value();
        } else if (filter === Keys.alumni) {
            const uniqByAlumni = _.uniqBy(students, s => s.hasAlumni);
            const legend = [];
            _.forEach(uniqByAlumni, s => {
                legend.push({ id: s.hasAlumni, name: s.hasAlumni });
            })
            return legend;
        } else {
            return _(students).map(s => s[filter] ? s[filter] : { id: null, name: T.unknown })
                .uniqBy(i => i.id).sortBy(s => s.sequence).value();
        }
    }

}
