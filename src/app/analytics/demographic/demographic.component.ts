import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { takeUntil } from 'rxjs/operators';

import { ListenerService } from 'app/services/listener.service';
import { DemographicService } from 'app/analytics/demographic/demographic.service';
import { SchoolQuery } from 'app/state/school';

import { Utils } from 'app/common/utils';
import { Keys } from 'app/common/keys';

import { Student } from 'app/entities/student';
import { Demographic } from 'app/entities/local/demographic'
import { School } from 'app/entities/school';

import { DashboardWidgetComponent } from '../dashboard-widget/dashboard-widget.component';

import * as _ from 'lodash';

@Component({
    selector: 'app-demographic',
    templateUrl: 'demographic.component.html',
    styleUrls: ['demographic.component.scss'],
    encapsulation: ViewEncapsulation.None,
})

export class DemographicComponent extends DashboardWidgetComponent implements OnInit, OnDestroy {

    public school: School;

    constructor(
        private demographicService: DemographicService,
        protected listenerService: ListenerService,
        protected schoolQuery: SchoolQuery
    ) {
        super(listenerService, schoolQuery);
        this.listenerService.schoolListStatus().pipe(takeUntil(this.unsubscribe)).subscribe(() => this.schoolChange());
    }

    public ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.demographicService.getData().then(() => {
            this.school = this.demographicService.school;
            this.widgetParams = this.demographicService.campusIsChanged();
            this.loaded = true;
        });
    }

    protected onCampusChanged() {
        this.demographicService.campusId = this.userInfo.campusId || 'all';
        this.widgetParams = this.demographicService.campusIsChanged();
    }

    schoolChange() {
        this.ngOnInit();
    }

    widgetCallBack(students: Student[]) {
        this.intakeYearChanged(students);
    }

    private intakeYearChanged(students: Student[]) {
        const startingYears = Utils.getStartingYearList(students);
        const yearLevels = Utils.getYearLevelList(students);
        const demographics: Demographic[] = this.demographicService.getDemographics(students);

        this.demographicService.calculate(students, demographics, startingYears, yearLevels, Keys.gender);
        this.demographicService.calculate(students, demographics, startingYears, yearLevels, Keys.alumni);
        this.demographicService.calculate(students, demographics, startingYears, yearLevels, Keys.siblings);
        this.demographicService.calculate(students, demographics, startingYears, yearLevels, Keys.religion);
        this.demographicService.calculate(students, demographics, startingYears, yearLevels, Keys.isInternational);
        this.demographicService.calculate(
            students, _.filter(demographics, d => d.isInternational === 'Yes'), startingYears, yearLevels, Keys.countryOfOrigin
        );
        this.demographicService.calculate(students, demographics, startingYears, yearLevels, Keys.boardingType);
    }
}
