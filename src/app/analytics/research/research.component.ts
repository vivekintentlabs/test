import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';

import { ListenerService } from 'app/services/listener.service';
import { ResearchService } from 'app/analytics/research/research.service';
import { SchoolQuery } from 'app/state/school';

import { Constants } from 'app/common/constants';
import { Utils } from 'app/common/utils';
import { ChartType } from 'app/common/enums';
import { Keys } from 'app/common/keys';
import { T } from 'app/common/t';
import { Chart } from 'app/common/interfaces';

import { Student } from 'app/entities/student';

import { DashboardWidgetComponent } from '../dashboard-widget/dashboard-widget.component';

import * as _ from 'lodash';


@Component({
    selector: 'app-research',
    templateUrl: 'research.component.html',
    styleUrls: ['research.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class ResearchComponent extends DashboardWidgetComponent implements OnInit, OnDestroy {

    public inputBarChartLeadSource;
    public inputBarChartHearAboutUs;
    public inputPieChartHearAboutUs;
    public inputPieChartLeadSource;

    public noItemSelected = Constants.noItemSelected;
    public titleHA = T.hear_about_us;
    public titleLS = T.lead_source;

    public ChartType = ChartType;

    public selectedChartType = ChartType.Bar;
    charts: Chart[] = [
        { type: ChartType.Bar, icon: 'format_align_left', selected: true },
        { type: ChartType.Pie, icon: 'pie_chart', selected: false }
    ];

    constructor(
        private researchService: ResearchService,
        listenerService: ListenerService,
        schoolQuery: SchoolQuery
    ) {
        super(listenerService, schoolQuery);
    }

    public ngOnInit() {
        return this.researchService.getData().then(() => {
            this.userInfo = Utils.getUserInfoFromToken();
            this.widgetParams = this.researchService.campusIsChanged();
            this.loaded = true;
        });
    }

    widgetCallBack(students: Student[]) {
        this.intakeYearChanged(students);
    }

    onChartTypeChange(selectedChartType: number) {
        this.selectedChartType = selectedChartType;
        _.forEach(this.charts, chart => {
            chart.selected = (chart.type === selectedChartType);
        });
    }

    protected onCampusChanged() {
        this.researchService.campusId = this.userInfo.campusId || 'all';
        this.widgetParams = this.researchService.campusIsChanged();
    }

    intakeYearChanged(students: Student[]) {
        const startingYears = Utils.getStartingYearList(students);
        const selectedYearLevels = Utils.getYearLevelList(students);

        this.inputPieChartLeadSource = this.researchService.calculate(students, startingYears, selectedYearLevels, Keys.leadSource);
        this.inputPieChartHearAboutUs = this.researchService.calculate(students, startingYears, selectedYearLevels, Keys.hearAboutUs);
        this.inputBarChartLeadSource = this.researchService.calculateBarChart(students, startingYears, selectedYearLevels, Keys.leadSource);
        this.inputBarChartHearAboutUs =
            this.researchService.calculateBarChart(students, startingYears, selectedYearLevels, Keys.hearAboutUs);
    }

}
