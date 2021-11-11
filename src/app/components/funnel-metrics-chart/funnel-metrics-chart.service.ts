import { Injectable } from '@angular/core';

import { HttpService } from 'app/services/http.service';
import { AnalyticsService } from 'app/analytics/analytics.service';

import { Utils } from 'app/common/utils';
import { UniqNames } from 'app/common/uniq-names';
import { Keys } from 'app/common/keys';
import { T } from 'app/common/t';

import { YearLevelList } from 'app/entities/year-level-list';
import { Student } from 'app/entities/student';
import { ConversionRatio } from 'app/entities/local/conversion-ratios';

import * as _ from 'lodash';


@Injectable({
    providedIn: 'root'
})
export class FunnelMetricsChartService extends AnalyticsService {

    constructor(httpService: HttpService) {
        super(httpService);
        this.uniqName = UniqNames[UniqNames.FunnelMetricsChart];
        this.filterFields = [Keys.startingYear, Keys.schoolIntakeYearId];
        this.title = T.funnelMetrics;
    }

    public getData(): Promise<Student[]> {
        return this.httpService.getAuth('student/funnel-metrics').then((result: any) => {
            this.userInfo = Utils.getUserInfoFromToken();
            this.campusId = this.userInfo.campusId || 'all';

            this.campuses = result.campuses;
            _.forEach(result.funnelMetrics.intakeYears, (intakeYear: number) => {
                if (intakeYear) {
                    this.intakeYears.push({ intakeYear });
                }
            });

            this.allStudents = result.funnelMetrics.students;
            this.yearLevelList = new YearLevelList(result.funnelMetrics.yearLevels);

            return this.allStudents;
        });
    }

    public getCoventionRatios(students: Student[]): Map<number, ConversionRatio> {
        const conversionRatios = new Map<number, ConversionRatio>();
        const orderedStudents = _.orderBy(students, 'schoolIntakeYear.name', 'asc');

        _.forEach(orderedStudents, (student: Student) => {
            const ylName = student.schoolIntakeYear ? student.schoolIntakeYear.name : T.unknown;
            const stageName = (student.studentStatus && student.studentStatus.stage) ? student.studentStatus.stage.name : null;

            let conversionRatio: ConversionRatio = conversionRatios.get(student.schoolIntakeYearId);

            if (!conversionRatio) {
                conversionRatio = new ConversionRatio();
            }
            conversionRatio.addStudentCount(stageName, student.schoolIntakeYearId, ylName);
            conversionRatios.set(student.schoolIntakeYearId, conversionRatio);
        });
        return conversionRatios;
    }

}
