import { Component, AfterViewInit, ViewEncapsulation, Input, SimpleChanges, OnChanges, IterableDiffers, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import * as Chartist from 'chartist';
import * as ctAxisTitle from 'chartist-plugin-axistitle/dist/chartist-plugin-axistitle.min.js';
import * as _ from 'lodash';
import { ChartData } from '../../entities/local/chart-data';
import { Legend } from '../../entities/local/legend';

@Component({
    selector: 'app-bar-chart-stacked',
    templateUrl: 'bar-chart-stacked.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['bar-chart-stacked.component.scss']
})
export class BarChartStackedComponent implements AfterViewInit, OnChanges, OnDestroy {

    @Input() title: string;
    @Input() inputBarChart: ChartData;
    @Input() titleAxisY?: string;
    private iterableDiffer: any;
    private barChart: Chartist.IChartistBarChart;
    public static instanceCounter = 0;
    instanceId = '';
    initialized = false;
    public isClickableLegend: boolean;
    constructor(private router: Router, private _iterableDiffers: IterableDiffers) {
        this.iterableDiffer = this._iterableDiffers.find([]).create(null);
        BarChartStackedComponent.instanceCounter++;
        this.instanceId = 'BarChartStacked' + BarChartStackedComponent.instanceCounter;
    }

    ngOnChanges(changes: SimpleChanges) {
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

            const optionsBarChart = {
                stackBars: true,
                seriesBarDistance: 10,
                axisY: {
                    onlyInteger: true
                },
                axisX: {
                    offset: 40
                },
                height: '251px',
                plugins: [
                    ctAxisTitle({
                        axisY: {
                            axisTitle: this.titleAxisY || ' ',
                            axisClass: 'ct-axis-title',
                            offset: {
                                x: 0,
                                y: 20
                            },
                            textAnchor: 'middle',
                            flipTitle: true
                        }
                    })
                ]
            };

            const responsiveOptionsBarChart: any = [
                ['screen and (max-width: 640px)', {
                    seriesBarDistance: 10,
                    stackBars: true,
                    axisY: {
                        onlyInteger: true
                    },
                    axisX: {
                        offset: 40
                    },
                    height: '251px',
                    plugins: [
                        ctAxisTitle({
                            axisY: {
                                axisTitle: this.titleAxisY || ' ',
                                axisClass: 'ct-axis-title',
                                offset: {
                                    x: 0,
                                    y: 20
                                },
                                textAnchor: 'middle',
                                flipTitle: true
                            }
                        })
                    ]
                }]
            ];

            this.barChart = new Chartist.Bar('#' + this.instanceId, dataPreferences, optionsBarChart, responsiveOptionsBarChart);
            this.startAnimationForBarChart();
        }
    }

    ngAfterViewInit() {
        this.initialized = true;
        this.ngOnChanges(null);
    }

    sendBack(url: string) {
        this.router.navigate([url]);
    }

    onClickLegend(legend: Legend) {
        this.router.navigate([legend.url, legend.params]);
    }

    startAnimationForBarChart() {
        let seq2, delays2, durations2;
        seq2 = 0;
        delays2 = 20;
        durations2 = 500;
        this.barChart.on('draw', function (data) {
            if (data.type === 'bar') {
                seq2++;
                data.element.animate({
                    opacity: {
                        begin: seq2 * delays2,
                        dur: durations2,
                        from: 0,
                        to: 1,
                        easing: 'ease'
                    }
                });
            }
        });
        seq2 = 0;
    }

    ngOnDestroy() {
        this.barChart.off('draw');
        this.barChart.detach();
    }

}
