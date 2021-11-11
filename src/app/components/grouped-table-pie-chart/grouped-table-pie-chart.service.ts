import { Injectable } from '@angular/core';

import { HttpService } from 'app/services/http.service';
import { AnalyticsService } from 'app/analytics/analytics.service';

import { Utils } from 'app/common/utils';
import { UniqNames } from 'app/common/uniq-names';
import { Keys } from 'app/common/keys';
import { T } from 'app/common/t';

import { YearLevelList } from 'app/entities/year-level-list';
import { Student } from 'app/entities/student';
import { ListItem } from 'app/entities/list-item';

import * as _ from 'lodash';


@Injectable({
    providedIn: 'root'
})
export class GroupedTablePieChartService extends AnalyticsService {
    public stages: ListItem[] = [];

    constructor(httpService: HttpService) {
        super(httpService);
        this.uniqName = UniqNames[UniqNames.GroupedTablePieChart];
        this.filterFields = [Keys.startingYear, Keys.schoolIntakeYearId];
        this.title = T.totalByStage;
        this.icon = 'donut_small';
    }

    public getData(): Promise<Student[]> {
        return this.httpService.getAuth('student/enquiries').then((result: any) => {
            this.userInfo = Utils.getUserInfoFromToken();
            this.campusId = this.userInfo && this.userInfo.campusId || 'all';

            this.campuses = result.campuses;
            this.stages = result.enquiries.stages;
            this.allStudents = result.enquiries.students;
            this.yearLevelList = new YearLevelList(result.enquiries.yearLevels);

            const startingYears = _(this.allStudents).uniqBy(s => s.startingYear).map(s => s.startingYear).value();
            _.forEach(startingYears, (intakeYear: number) => {
                if (intakeYear) {
                    this.intakeYears.push({ intakeYear });
                }
            });

            return this.allStudents;
        });
    }

}
