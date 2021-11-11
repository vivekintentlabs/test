import { Component, AfterViewInit, ViewEncapsulation, Input, SimpleChanges, OnChanges, IterableDiffers, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ChartData } from '../../entities/local/chart-data';
import { Legend } from '../../entities/local/legend';
import * as Chartist from 'chartist';
import * as ctAxisTitle from 'chartist-plugin-axistitle/dist/chartist-plugin-axistitle.min.js';
import * as _ from 'lodash';

@Component({
    selector: 'app-line-chart',
    templateUrl: 'line-chart.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['line-chart.component.scss']
})
export class LineChartComponent implements AfterViewInit, OnChanges, OnDestroy {

    @Input() inputLineChart: ChartData;
    @Input() titleAxisY: string;
    @Input() titleAxisX: string;
    @Input() labelInterpolationFnc: (value) => string;
    private iterableDiffer: any;
    private lineChart: Chartist.IChartistLineChart;

    static instanceCounter: number = 0;
    instanceId = '';
    initialized = false;

    constructor(private router: Router, private _iterableDiffers: IterableDiffers) {
        this.iterableDiffer = this._iterableDiffers.find([]).create(null);
        LineChartComponent.instanceCounter++;
        this.instanceId = 'LineChartStacked' + LineChartComponent.instanceCounter;
    }

    ngOnChanges(changes: SimpleChanges) {
        let self = this;
        if (this.initialized) {
            let dataPreferences;
            if (this.inputLineChart) {
                const dataSeries = [];
                for (let i = 0; i < this.inputLineChart.series.length; i++) {
                    const obj = { className: this.inputLineChart.series[i].className, data: this.inputLineChart.series[i].data }
                    dataSeries.push(obj);
                }
                dataPreferences = {
                    labels: this.inputLineChart.labels,
                    series: dataSeries
                };
            } else {
                dataPreferences = {
                    labels: [],
                    series: []
                };
            }

            const optionsLineChart = {
                seriesLineDistance: 10,
                stackLines: true,
                axisY: {
                    onlyInteger: true
                },
                axisX: {
                    offset: 40,
                    labelInterpolationFnc: function(value) { //custom override function
                        let fn = self.labelInterpolationFnc;
                        return (fn != null) ? fn(value) : value;
                    }
                },
                height: '251px',
                plugins: [
                    ctAxisTitle({
                        axisY: {
                            axisTitle: this.titleAxisY,
                            axisClass: 'ct-axis-title',
                            offset: {
                                y: 20
                            },
                            textAnchor: 'middle',
                            flipTitle: true
                        },
                        axisX: {
                            axisTitle: this.titleAxisX,
                            axisClass: 'ct-axis-title',
                            offset: {
                                y: 40
                            },
                            textAnchor: 'middle',
                            flipTitle: true
                        },
                    })
                ]
            };
            this.lineChart = new Chartist.Line('#' + this.instanceId, dataPreferences, optionsLineChart);
        }
    }

    ngAfterViewInit() {
        this.initialized = true;
        this.ngOnChanges(null);
    }

    onClickLegend(legend: Legend) {
        this.router.navigate([legend.url, legend.params]);
    }

    ngOnDestroy() {
        this.lineChart.off('draw');
        this.lineChart.detach();
    }

}
