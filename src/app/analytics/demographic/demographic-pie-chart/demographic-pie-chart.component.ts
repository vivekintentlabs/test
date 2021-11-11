import { Component, Inject } from '@angular/core';
import { Constants } from 'app/common/constants';
import { InitChartData } from 'app/common/initChartData';
import { PieChartColData } from 'app/entities/local/pie-chart-col-data';
import { GraphsetData, ZingData } from 'app/entities/local/zing-chart';
import { ChartWrapperService, CHART_WRAPPER_SERVICE } from 'app/services/chart-wrapper/chart-wrapper-service';
import * as _ from 'lodash';
import { ChartQuery } from 'app/state/chart';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


@Component({
    selector: 'app-demographic-pie-chart',
    template: '<app-pie-zing-chart [pieChartInputData]="pieCharts"></app-pie-zing-chart>',
})
export class DemographicPieChartComponent {
    pieCharts: GraphsetData;
    private unsubscribe = new Subject();

    constructor(
        private chartQuery: ChartQuery,
        @Inject(CHART_WRAPPER_SERVICE) public chartWrapperService: ChartWrapperService
    ) { }

    ngOnInit() {
        const id = this.chartWrapperService.getChartEntityId();
        const $chartRawData = this.chartQuery.getChartRawDataObservable(id);
        const $isAggregated = this.chartQuery.getAggregateObservable(id);
        const $hasPlotTotal = this.chartQuery.getPlotObservable(id);

        combineLatest([$chartRawData, $isAggregated, $hasPlotTotal]).pipe(takeUntil(this.unsubscribe)).subscribe(([chartRawData, isAggregated, hasPlotTotal]) => {
            if (chartRawData) {
                if (isAggregated) {
                    this.pieCharts = this.aggregatePieChart(chartRawData, hasPlotTotal);
                } else {
                    this.pieCharts = this.getPieChartData(chartRawData, hasPlotTotal);
                }
            }
        });
    }

    getPieChartData(chartRawData: PieChartColData, hasPlotTotal?: boolean): GraphsetData {
        const pieChartsList: ZingData[] = [];
        this.chartWrapperService.total = 0;
        _.forEach(chartRawData.labels, (label: string, index) => {
            let pieData: ZingData = InitChartData.pieChartInitData();
            if (hasPlotTotal) {
                this.addPlotToInitialData(pieData);
            }
            pieData.title.text = label;

            const tempSeries = [];
            let total = 0;
            _.forEach(chartRawData.series[index].values, (data, index) => {
                if (chartRawData.legends && chartRawData.legends[index]?.isSelected && data > 0) {
                    total += data;
                    pieData.labels[0].text = total.toString();
                    this.chartWrapperService.total += data;
                    tempSeries.push({
                        values: [data],
                        text: chartRawData.legends[index].name,
                        backgroundColor: Constants.ColorsList[chartRawData.classNames[index]],
                        'data-background-color': Constants.ColorsList[chartRawData.classNames[index]]
                    });
                }
            });

            pieData.series = tempSeries;
            if (pieData.series.length > 0) {
                pieChartsList.push(pieData);
            }
        });
        let layout;
        if (!pieChartsList.length) {
            pieChartsList.push(InitChartData.pieChartInitData());
            layout = '1x1'
        } else if (pieChartsList.length == 1) {
            layout = '1x1';
        } else if (hasPlotTotal) {
            layout = pieChartsList.length + 'x1';
        } else {
            layout = Math.ceil((pieChartsList.length || 1) / 2) + 'x2'
        }

        const chartData: GraphsetData = {
            layout,
            graphset: pieChartsList,
            backgroundColor: 'white'
        };
        return chartData;
    }

    public aggregatePieChart(chartRawData: PieChartColData, hasPlotTotal?: boolean): GraphsetData {
        let pieData: ZingData = InitChartData.pieChartInitData();
        if (hasPlotTotal) {
            this.addPlotToInitialData(pieData);
        }
        pieData.title.text = 'Aggregate';
        this.chartWrapperService.total = 0;
        let series = [];
        _.forEach(chartRawData.legends, (legend, legendIndex) => {

            let total = 0;
            _.forEach(chartRawData.labels, (label, labelIndex) => {
                if (chartRawData.legends && chartRawData.legends[legendIndex]?.isSelected &&
                    chartRawData.series[labelIndex]?.values?.length > 0) {
                    total += chartRawData.series[labelIndex].values[legendIndex];
                }
            });

            series.push({
                values: [total],
                text: legend.name,
                backgroundColor: Constants.ColorsList[chartRawData.classNames[legendIndex]],
                'data-background-color': Constants.ColorsList[chartRawData.classNames[legendIndex]]
            });
            this.chartWrapperService.total += total;
        });
        pieData.labels[0].text = this.chartWrapperService.total.toString();
        if (this.chartWrapperService.total > 0) {
            pieData.series = series;
        }

        pieData.labels[0].text = this.chartWrapperService.total.toString();
        if (this.chartWrapperService.total > 0) {
            pieData.series = series;
        }
        let aggregateChartsList: ZingData[] = [];
        if (this.chartWrapperService.total > 0) {
            aggregateChartsList.push(pieData);
        } else {
            aggregateChartsList.push(InitChartData.pieChartInitData());
        }
        const chartData: GraphsetData = {
            layout: "1x1",
            graphset: aggregateChartsList,
            backgroundColor: 'white'
        };
        return chartData;
    }

    private addPlotToInitialData(pieData: ZingData) {
        pieData.plot.valueBox.text = '<div style="text-align: center;margin-bottom: 2px;display: inline-block;border-bottom: 1px solid #616161;width: 100%;">%t</div><br/>%v | %npv% ';
        pieData.plot.valueBox.placement = 'out';
        pieData.plot.valueBox.fontColor = '#616161';
        pieData.plot.tooltip.text = "";
        pieData.width = "100%";
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }
}
