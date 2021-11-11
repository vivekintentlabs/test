import { Component, OnInit, ViewEncapsulation, OnDestroy, ChangeDetectorRef } from '@angular/core';

import { ListenerService } from 'app/services/listener.service';
import { GeographicService } from 'app/analytics/geographic/geographic.service';
import { SchoolQuery } from 'app/state/school';

import { Utils } from 'app/common/utils';
import { Keys } from 'app/common/keys';

import { Campus } from 'app/entities/campus';
import { Geographic } from 'app/entities/local/geographic';
import { Student } from 'app/entities/student';

import { DashboardWidgetComponent } from '../dashboard-widget/dashboard-widget.component';

import * as _ from 'lodash';

@Component({
    selector: 'app-geographic',
    templateUrl: 'geographic.component.html',
    styleUrls: ['geographic.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class GeographicComponent extends DashboardWidgetComponent implements OnInit, OnDestroy {

    public campuses: Campus[] = [];
    public startingYears: number[];
    public selectedYearLevels: object[] = [];
    public locations: _.Dictionary<Geographic[]>;

    constructor(
        private geographicService: GeographicService,
        listenerService: ListenerService,
        private ref: ChangeDetectorRef,
        schoolQuery: SchoolQuery,
    ) {
        super(listenerService, schoolQuery);
    }

    public ngOnInit() {
        return this.geographicService.getData().then(() => {
            this.userInfo = Utils.getUserInfoFromToken();
            this.widgetParams = this.geographicService.campusIsChanged();
            this.campuses = this.geographicService.campuses;

            this.loaded = true;
        });
    }

    protected onCampusChanged() {
        this.geographicService.campusId = this.userInfo.campusId || 'all';
        this.widgetParams = this.geographicService.campusIsChanged();
    }

    widgetCallBack(students: Student[]) {
        this.startingYears = Utils.getStartingYearList(students);
        this.selectedYearLevels = Utils.getYearLevelList(students);

        this.filterLocations(students);
    }

    private filterLocations(students: Student[]) {
        const allLocations = this.geographicService.getLocations(students);
        this.locations = _.groupBy(_.filter(allLocations, s => _.includes(this.startingYears, s.intakeYear)), Keys.schoolIntakeYear);

        this.ref.detectChanges();
    }

}
