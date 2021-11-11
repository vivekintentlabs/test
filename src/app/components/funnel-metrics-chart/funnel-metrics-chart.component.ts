import { Component, OnInit, ViewEncapsulation, OnDestroy, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ListenerService } from 'app/services/listener.service';
import { FunnelMetricsChartService } from './funnel-metrics-chart.service';

import { Utils } from 'app/common/utils';
import { IWidgetParams } from 'app/common/interfaces';

import { UserInfo } from 'app/entities/userInfo';
import { YearLevel } from 'app/entities/year-level';
import { Student } from 'app/entities/student';
import { ConversionRatio } from 'app/entities/local/conversion-ratios';

import { ZingData } from 'app/entities/local/zing-chart';

import * as _ from 'lodash';
import { CHART_WRAPPER_SERVICE } from 'app/services/chart-wrapper/chart-wrapper-service';
import { FunnelChartWrapperService } from 'app/services/chart-wrapper/funnel-chart-wrapper.service';
import { ChartEntity, ChartQuery } from 'app/state/chart';
import { environment } from 'environments/environment';
import { EntityAction } from '@datorama/akita';

@Component({
    selector: 'app-funnel-metrics-chart',
    templateUrl: 'funnel-metrics-chart.component.html',
    encapsulation: ViewEncapsulation.None,
    providers: [
        { provide: CHART_WRAPPER_SERVICE, useClass: FunnelChartWrapperService }
    ]
})
export class FunnelMetricsChartComponent implements OnInit, OnDestroy {
    public loaded = false;
    public widgetParams: IWidgetParams;

    private userInfo: UserInfo = null;
    private unsubscribe = new Subject();
    public chartButton;
    public chartActionSection;
    private students: Student[];
    private isAggregate: boolean;

    inputFunnelData: ZingData = this.chartWrapperService.getInitialData();

    constructor(
        private funnelMetricsChartService: FunnelMetricsChartService,
        private listenerService: ListenerService,
        translate: TranslateService,
        private chartQuery: ChartQuery,
        @Inject(CHART_WRAPPER_SERVICE) private chartWrapperService: FunnelChartWrapperService
    ) {
        this.listenerService.campusListStatus().pipe(takeUntil(this.unsubscribe)).subscribe(() => this.campusChange());
        translate.get('et.enrolment').subscribe((res: string) => {
            this.inputFunnelData.scaleY.labels = [
                `Total ${environment.localization.enquiriesTitle}`, 'Reached Applicant Stage', 'Reached ' + res + ' Stage'
            ];
        });
        this.chartQuery.getAggregateObservable(this.chartWrapperService.getChartEntityId()).pipe(takeUntil(this.unsubscribe)).subscribe((isAggregated: boolean) => {
            this.isAggregate = isAggregated;
            this.widgetCallBack(this.students);
        });
    }

    public ngOnInit() {
        this.funnelMetricsChartService.getData().then(() => {
            this.userInfo = Utils.getUserInfoFromToken();
            this.widgetParams = this.funnelMetricsChartService.campusIsChanged();
            this.loaded = true;
        });
    }

    campusChange() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.funnelMetricsChartService.campusId = this.userInfo.campusId || 'all';
        this.widgetParams = this.funnelMetricsChartService.campusIsChanged();
    }

    widgetCallBack(students: Student[]) {
        this.students = students;
        const selectedYearLevels = Utils.getYearLevelList(students);
        if (students) { this.chartWrapperService.setFilters(selectedYearLevels, students); }
        this.intakeYearChanged(students, selectedYearLevels);
    }

    schoolChange() {
        this.ngOnInit();
    }

    private intakeYearChanged(students: Student[], selectedYearLevels: YearLevel[]) {
        // We have created a new variable named as funnelChart becuase if we use existing variable of inputFunnelChart then chart
        // is not getting reflected.
        const funnelData: ZingData = this.chartWrapperService.getInitialData();
        const conversionRatios: Map<number, ConversionRatio> = this.funnelMetricsChartService.getCoventionRatios(students);

        if (selectedYearLevels.length) {
            _.forEach(selectedYearLevels, (yearLevel: YearLevel) => {
                funnelData.scaleX.labels.push(yearLevel.name);
                funnelData.scaleX['max-items'] = funnelData.scaleX.labels.length;
                const cr = conversionRatios ? conversionRatios.get(yearLevel.id) : null;
                funnelData.series[0].text = this.inputFunnelData.scaleY.labels[0];
                funnelData.series[1].text = this.inputFunnelData.scaleY.labels[1];
                funnelData.series[2].text = this.inputFunnelData.scaleY.labels[2];

                if (cr) {
                    funnelData.series[0].values.push(cr.interest + cr.enroled + cr.applicant + cr.declined);
                    funnelData.series[1].values.push(cr.enroled + cr.applicant);
                    funnelData.series[2].values.push(cr.enroled);
                } else {
                    funnelData.series[0].values.push(0);
                    funnelData.series[1].values.push(0);
                    funnelData.series[2].values.push(0);
                }
            });
        } else {
            funnelData.series[0].values.push(0);
            funnelData.series[1].values.push(0);
            funnelData.series[2].values.push(0);
        }
        funnelData.scaleY = this.inputFunnelData.scaleY;
        this.inputFunnelData = funnelData;

        if(this.isAggregate) {
            this.setAggregateChart();
        }
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

    setAggregateChart() {
        let funnelData = this.chartWrapperService.getInitialData();
        if (this.inputFunnelData.scaleX.labels.length > 1) {
            this.inputFunnelData.series.forEach((series, key) => {
                let value: number = 0;
                series.values.forEach(values => {
                    value += values
                });
                funnelData.series[key].values.push(value);
            });
            funnelData.series[0].text = this.inputFunnelData.scaleY.labels[0];
            funnelData.series[1].text = this.inputFunnelData.scaleY.labels[1];
            funnelData.series[2].text = this.inputFunnelData.scaleY.labels[2];
            funnelData.scaleX.labels = ['Aggregate'];
            funnelData.scaleY = this.inputFunnelData.scaleY;
            this.inputFunnelData = funnelData;
        }
    }
}
