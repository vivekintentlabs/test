import { Component, Inject, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Constants } from 'app/common/constants';
import { ZingData } from 'app/entities/local/zing-chart';
import { ChartWrapperService, CHART_WRAPPER_SERVICE } from 'app/services/chart-wrapper/chart-wrapper-service';
import * as _ from 'lodash';

@Component({
    selector: 'app-column-chart',
    template: `<zingchart-angular [height]="height" #columnChart
                    [config]="columnChartInputData" output="canvas">
                </zingchart-angular>
            `
})
export class ColumnChartComponent implements OnChanges {
    @Input() columnChartInputData: any;
    @ViewChild('columnChart') columnChart: any;
    height: number = 266;

    constructor(
        @Inject(CHART_WRAPPER_SERVICE) private chartWrapperService: ChartWrapperService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        const chartEntity = this.chartWrapperService.getChartEntity()
        if (changes.columnChartInputData.currentValue && (chartEntity.chartType && chartEntity.chartType.type == Constants.ChartTypes.stackedColumnChart)) {
            const chartList: ZingData[] = _.filter(changes.columnChartInputData.currentValue.graphset, (g: ZingData) => !g.series.length);
            if (this.columnChart) {
                if (chartList.length) {
                    this.chartWrapperService.chartType = null;
                } else {
                    this.chartWrapperService.chartType = this.columnChart;
                }
                this.columnChart.resize({
                    width: "100%"
                });
            }
        }
    }
}
