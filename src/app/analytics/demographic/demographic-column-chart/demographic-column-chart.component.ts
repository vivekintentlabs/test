import { Component, Inject } from '@angular/core';
import { Constants } from 'app/common/constants';
import { InitChartData } from 'app/common/initChartData';
import { PieChartColData } from 'app/entities/local/pie-chart-col-data';
import { GraphsetData, ZingData } from 'app/entities/local/zing-chart';
import { ChartWrapperService, CHART_WRAPPER_SERVICE } from 'app/services/chart-wrapper/chart-wrapper-service';
import { ChartEntity, ChartQuery } from 'app/state/chart';
import * as _ from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


@Component({
    selector: 'app-demographic-column-chart',
    template: '<app-column-chart [columnChartInputData]="columnCharts" id="columnChartId"></app-column-chart>',
})
export class DemographicColumnChartComponent {
    columnCharts: GraphsetData;
    private unsubscribe = new Subject();

    constructor(
        private chartQuery: ChartQuery,
        @Inject(CHART_WRAPPER_SERVICE) public chartWrapperService: ChartWrapperService
    ) {
        this.chartQuery.selectEntity(this.chartWrapperService.getChartEntityId()).pipe(takeUntil(this.unsubscribe)).subscribe((chartEntity: ChartEntity) => {
            if (chartEntity && chartEntity?.chartType?.type == Constants.ChartTypes.stackedColumnChart) {
                this.columnCharts = this.getStackedColumnChartData(chartEntity.chartRawData, chartEntity.isAggregated, chartEntity.hasPlotTotal);
            }
        });
    }

    public getStackedColumnChartData(chartRawData: PieChartColData, isAggregated: boolean, hasPlotTotal: boolean) {
        const stackedColumnChart = InitChartData.barChartInitData();
        stackedColumnChart.series = [];
        if (hasPlotTotal) {
            stackedColumnChart.plot.valueBox.text = '%total';
            stackedColumnChart.plot.tooltip.visible = false;
        }
        stackedColumnChart.scaleX.labels = isAggregated ? ['Aggregate'] : chartRawData.labels.map(item => item.toString());
        if (stackedColumnChart.scaleX.labels.length > 4) {
            stackedColumnChart.scaleX.item.angle = '-35';
        }
        stackedColumnChart.scaleX['max-items'] = chartRawData.labels.length;
        let highestRange = 0;
        this.chartWrapperService.total = 0;

        _.forEach(chartRawData.legends, (legend, legendIndex) => {
            let series: any = {};
            series.values = [];

            _.forEach(chartRawData.labels, (label, labelIndex) => {
                if (chartRawData.legends[legendIndex]?.isSelected &&
                    chartRawData.series[labelIndex]?.values?.length > 0) {
                    series.values.push(chartRawData.series[labelIndex]?.values[legendIndex]);
                } else {
                    series.values.push(0);
                }
            });

            series.text = legend.name;
            series.backgroundColor = Constants.ColorsList[chartRawData.classNames[legendIndex]];
            series['data-background-color'] = Constants.ColorsList[chartRawData.classNames[legendIndex]];
            stackedColumnChart.series.push(series);
        })

        if (isAggregated) {
            stackedColumnChart.series.forEach(item => {
                item.values = [_.sum(item.values)];
            });
            highestRange = _.sum(stackedColumnChart.series.map(item => _.sum(item.values)));
        } else {
            highestRange = _.sum(stackedColumnChart.series.map(item => _.max(item.values)));
        }
        this.chartWrapperService.total = _.sum(stackedColumnChart.series.map(item => _.sum(item.values)))
        const chartRange = this.calculateBarChartTicks(highestRange);
        stackedColumnChart.scaleY.values = `0:${chartRange.maxValue}:${chartRange.step}`;
        const stackedColumnChartsList: ZingData[] = [];
        if (highestRange > 0) {
            stackedColumnChartsList.push(stackedColumnChart);
        } else {
            stackedColumnChartsList.push(InitChartData.barChartInitData());
        }
        return { graphset: stackedColumnChartsList };
    }

    calculateBarChartTicks(maxValue: number, tick: number = 10) {
        let unorderedStep: number = maxValue / (tick - 1);
        if (unorderedStep > 1) {
            let unorderedStepLog = Math.ceil(Math.log10(unorderedStep) - 1);
            let pow10Log = Math.pow(10, unorderedStepLog);
            let roundStep = Math.ceil(unorderedStep / pow10Log) * pow10Log;
            maxValue = maxValue - (maxValue % roundStep) + (roundStep * 2);
            return { step: roundStep, maxValue };
        } else {
            return { step: 1, maxValue: maxValue + 1 };
        }
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }
}
