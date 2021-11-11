import { Component, AfterViewInit, ViewEncapsulation, Input, OnChanges, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { Utils } from 'app/common/utils';

import { UserInfo } from 'app/entities/userInfo';
import { ChartData } from 'app/entities/local/chart-data';
import { Legend } from 'app/entities/local/legend';

import * as Chartist from 'chartist';
import * as _ from 'lodash';


@Component({
    selector: 'app-bar-chart-stacked-horizontal',
    templateUrl: 'bar-chart-stacked-horizontal.component.html',
    styleUrls: ['bar-chart-stacked-horizontal.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class BarChartStackedHorizontalComponent implements AfterViewInit, OnChanges, OnDestroy {
    static instanceCounter = 0;

    @Input() inputBarChart: ChartData;
    @Input() titleAxisX?: string;
    @Input() title: string;
    @Input() offsetY: Array<number>;
    private barChart: any; // Chartist.Bar;
    instanceId = '';
    initialized = false;
    public isClickableLegend: boolean;
    private userInfo: UserInfo;

    constructor(private router: Router) {
        BarChartStackedHorizontalComponent.instanceCounter++;
        this.instanceId = 'BarChartStackedHorizontal' + BarChartStackedHorizontalComponent.instanceCounter;
        this.userInfo = Utils.getUserInfoFromToken();
    }

    ngOnChanges() {
        if (this.initialized) {
            let dataPreferences;
            if (this.inputBarChart) {
                const dataSeries = [];
                for (let i = 0; i < this.inputBarChart.series.length; i++) {
                    const obj = { className: this.inputBarChart.series[i].className, data: this.inputBarChart.series[i].data }
                    dataSeries.push(obj);
                }
                dataPreferences = {
                    labels: this.inputBarChart.labels,
                    series: dataSeries
                };
            } else {
                dataPreferences = {
                    labels: [],
                    series: []
                };
            }
            const height = (this.inputBarChart.labels.length > 2 ? ((this.inputBarChart.labels.length + 1) * 30) : 110);

            const optionsBarChart = {
                stackBars: true,
                horizontalBars: true,
                reverseData: false,
                axisY: {
                    offset: this.offsetY[0]
                },
                axisX: {
                    onlyInteger: true
                },
                height: height,
            };

            const responsiveOptionsBarChart: any = [
                ['screen and (max-width: 640px)', {
                    horizontalBars: true,
                    stackBars: true,
                    reverseData: false,
                    axisY: {
                        offset: this.offsetY[1]
                    },
                    axisX: {
                        onlyInteger: true
                    },
                    height: height,
                }]
            ];

            this.barChart = new Chartist.Bar('#' + this.instanceId, dataPreferences, optionsBarChart, responsiveOptionsBarChart);
        }
    }

    ngAfterViewInit() {
        this.initialized = true;
        this.ngOnChanges();
    }

    sendBack(url: string) {
        this.router.navigate([url]);
    }

    onClickLegend(legend: Legend) {
        this.router.navigate([legend.url, legend.params]);
    }

    ngOnDestroy() {
        this.barChart.off('draw');
        this.barChart.detach();
    }

}
