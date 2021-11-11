import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef, OnDestroy } from '@angular/core';

import { ListenerService } from 'app/services/listener.service';
import { SchoolComponentService } from 'app/analytics/school/school.component.service';
import { SchoolQuery } from 'app/state/school';

import { Utils } from 'app/common/utils';
import { Keys } from 'app/common/keys';

import { YearLevel } from 'app/entities/year-level';
import { Student } from 'app/entities/student';
import { ChartData } from 'app/entities/local/chart-data';

import { DashboardWidgetComponent } from '../dashboard-widget/dashboard-widget.component';

import * as _ from 'lodash';

@Component({
    selector: 'app-analytics-school',
    templateUrl: 'school.component.html',
    styleUrls: ['school.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class AnalyticsSchoolComponent extends DashboardWidgetComponent implements OnInit, OnDestroy {
    public title = 'School of Origin';
    public offsetY = [300, 300];

    public pieChartData = null;
    public barChartStackedData: ChartData = null;
    public barChartStackedHorizontalData: ChartData = null;

    constructor(
        private schoolComponentService: SchoolComponentService,
        listenerService: ListenerService,
        private ref: ChangeDetectorRef,
        schoolQuery: SchoolQuery,
    ) {
        super(listenerService, schoolQuery);
    }

    public ngOnInit() {
        return this.schoolComponentService.getData().then(() => {
            this.userInfo = Utils.getUserInfoFromToken();
            this.widgetParams = this.schoolComponentService.campusIsChanged();

            this.loaded = true;
        });
    }

    protected onCampusChanged() {
        this.schoolComponentService.campusId = this.userInfo.campusId || 'all';
        this.widgetParams = this.schoolComponentService.campusIsChanged();
    }

    widgetCallBack(students: Student[]) {
        const startingYears = Utils.getStartingYearList(students);
        const selectedYearLevels = Utils.getYearLevelList(students);

        this.calculate(students, startingYears, selectedYearLevels);

        this.ref.detectChanges();
    }

    private calculate(students: Student[], startingYears: number[], selectedYearLevels: YearLevel[]) {
        this.pieChartData = this.schoolComponentService.calculateCurrentSchoolClassifications(
            students, startingYears, selectedYearLevels, Keys.currentSchoolClassification);

        this.barChartStackedData = this.schoolComponentService.calculateCurrentSchoolStatuses(
            students, startingYears, selectedYearLevels, Keys.currentSchoolStatus);

        this.barChartStackedHorizontalData = this.schoolComponentService.calculateCurrentSchools(
            students, startingYears, selectedYearLevels, Keys.currentSchool);
    }

}
