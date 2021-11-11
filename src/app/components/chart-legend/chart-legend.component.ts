import { Component, Inject } from '@angular/core';

import { CHART_WRAPPER_SERVICE, ChartWrapperService } from 'app/services/chart-wrapper/chart-wrapper-service';
import { ChartEntity, ChartQuery, ChartService } from 'app/state/chart';
import { Legend } from 'app/entities/local/legend';
import { takeUntil } from 'rxjs/operators';
import { combineLatest, Subject } from 'rxjs';
import * as _ from 'lodash';
import { PieChartColData } from 'app/entities/local/pie-chart-col-data';

@Component({
    selector: 'app-chart-legend',
    templateUrl: 'chart-legend.component.html',
    styleUrls: ['chart-legend.component.scss']
})
export class ChartLegendComponent {
    public legends: Legend[];
    private unsubscribe = new Subject();
    public isLegendSectionVisible;

    constructor(
        @Inject(CHART_WRAPPER_SERVICE) public chartWrapperService: ChartWrapperService,
        protected chartQuery: ChartQuery,
        protected chartService: ChartService
    ) {
        const id = this.chartWrapperService.getChartEntityId();
        const $chartRawData = this.chartQuery.getChartRawDataObservable(id);
        const $hasLegend = this.chartQuery.getLegendObservable(id);

        combineLatest([$chartRawData, $hasLegend]).pipe(takeUntil(this.unsubscribe)).subscribe(([chartRawData, hasLegend]) => {
            this.legends = chartRawData?.legends;
            this.isLegendSectionVisible = hasLegend;
        });
    }

    hideShowLegend(legend: Legend) {
        this.chartService.updateLegend(this.chartWrapperService.getChartEntityId(), legend);
    }
}
