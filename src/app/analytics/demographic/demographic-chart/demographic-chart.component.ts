import { Component, Injector, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Constants } from 'app/common/constants';
import { Keys } from 'app/common/keys';
import { AlumniChartWrapperService } from 'app/services/chart-wrapper/alumni-chart-wrapper.service';
import { ChartWrapperService, CHART_WRAPPER_SERVICE } from 'app/services/chart-wrapper/chart-wrapper-service';
import { CountryOfOriginChartWrapperService } from 'app/services/chart-wrapper/country-of-origin-chart-wrapper.service';
import { GenderChartWrapperService } from 'app/services/chart-wrapper/gender-chart-wrapper.service';
import { InternationalChartWrapperService } from 'app/services/chart-wrapper/international-chart-wrapper.service';
import { ReligionChartWrapperService } from 'app/services/chart-wrapper/religion-chart-wrapper.service';
import { SiblingsChartWrapperService } from 'app/services/chart-wrapper/siblings-chart-wrapper.service';
import { StudentTypeChartWrapperService } from 'app/services/chart-wrapper/student-type-chart-wrapper.service';
import { ChartQuery, ChartService } from 'app/state/chart';
import { SchoolService } from 'app/state/school';
import * as _ from 'lodash';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';



const DemographicChartWrapperFactory = (demographicPieChartComponent: DemographicChartComponent,
    router: Router, schoolService: SchoolService, chartService: ChartService, chartQuery: ChartQuery): ChartWrapperService => {
    let chartWrapperService;
    switch (demographicPieChartComponent.type) {
        case Keys.gender:
            chartWrapperService = new GenderChartWrapperService(router, schoolService, chartService, chartQuery);
            break;
        case Keys.alumni:
            chartWrapperService = new AlumniChartWrapperService(router, schoolService, chartService, chartQuery);
            break;
        case Keys.siblings:
            chartWrapperService = new SiblingsChartWrapperService(router, schoolService, chartService, chartQuery);
            break;
        case Keys.religion:
            chartWrapperService = new ReligionChartWrapperService(router, schoolService, chartService, chartQuery);
            break;
        case Keys.boardingType:
            chartWrapperService = new StudentTypeChartWrapperService(router, schoolService, chartService, chartQuery);
            break;
        case Keys.isInternational:
            chartWrapperService = new InternationalChartWrapperService(router, schoolService, chartService, chartQuery);
            break;
        case Keys.countryOfOrigin:
            chartWrapperService = new CountryOfOriginChartWrapperService(router, schoolService, chartService, chartQuery);
            break;
    }

    return chartWrapperService;
};

@Component({
    selector: 'app-demographic-chart',
    templateUrl: 'demographic-chart.component.html',
    providers: [
        {
            provide: CHART_WRAPPER_SERVICE,
            useFactory: DemographicChartWrapperFactory,
            deps: [DemographicChartComponent, Router, SchoolService, ChartService, ChartQuery]
        }
    ]
})
export class DemographicChartComponent implements OnInit, OnDestroy {
    @Input() title: string;
    @Input() type: string;
    @Input() icon: string;
    public chartWrapperService: ChartWrapperService;
    private unsubscribe = new Subject();
    isStackedColumnChart: boolean;

    constructor(
        private injector: Injector,
        private chartQuery: ChartQuery
    ) { }

    ngOnInit() {
        this.chartWrapperService = this.injector.get<ChartWrapperService>(CHART_WRAPPER_SERVICE);
        const id = this.chartWrapperService.getChartEntityId();
        const $chartRawData = this.chartQuery.getChartRawDataObservable(id);
        const $chartType = this.chartQuery.getChartTypeObservable(id);
        const $filter = this.chartQuery.getFilterObservable(id);

        combineLatest([$chartRawData, $chartType, $filter]).pipe(takeUntil(this.unsubscribe)).subscribe(([chartRawData, chartType, filter]) => {
            if (chartRawData) {
                if (chartType?.type == Constants.ChartTypes.stackedColumnChart) {
                    this.isStackedColumnChart = true;
                } else {
                    this.isStackedColumnChart = false;
                }
                if (filter) {
                    this.chartWrapperService.setFilters(filter.yearLevels, filter.students,
                        chartRawData.legends, Keys[this.type]);
                }
            }
        });
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }
}
