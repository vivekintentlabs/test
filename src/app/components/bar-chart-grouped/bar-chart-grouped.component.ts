import { Component, AfterViewInit, ViewEncapsulation, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import * as Chartist from 'chartist';
import { ChartData } from '../../entities/local/chart-data';

@Component({
    selector: 'app-bar-chart-grouped',
    templateUrl: 'bar-chart-grouped.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['bar-chart-grouped.component.css'],
})
export class BarChartGroupedComponent implements OnChanges, AfterViewInit, OnDestroy {
    static instanceCounter = 0;

    @Input() inputBarChart: ChartData;

    instanceId = '';
    initialized = false;
    private barChart: any; // Chartist.Bar;

    constructor() {
        BarChartGroupedComponent.instanceCounter++;
        this.instanceId = 'groupedBarChart' + BarChartGroupedComponent.instanceCounter;
    }

    ngAfterViewInit() {
        this.initialized = true;
        this.ngOnChanges(null);
    }

    startAnimationForBarChart() {
        let seq2, delays2, durations2;
        seq2 = 0;
        delays2 = 80;
        durations2 = 500;
        this.barChart.on('draw', function (data) {
            if (data.type === 'bar') {
                data.element.attr({
                    style: 'stroke-width: 10px !important'
                });
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
            const height = this.inputBarChart.labels.length > 1 ? (this.inputBarChart.labels.length * 50) : 80;
            const optionsBarChart = {
                horizontalBars: true,
                seriesBarDistance: 10,
                axisX: {
                    onlyInteger: true,
                },
                axisY: {
                    offset: 150
                },
                height: height
            };

            const responsiveOptionsBarChart: any = [
                ['screen and (max-width: 640px)', {
                    horizontalBars: true,
                    seriesBarDistance: 10,
                    axisX: {
                        onlyInteger: true,
                        offset: 50
                    },
                    axisY: {
                        offset: 50
                    },
                    height: height

                }]
            ];

            this.barChart = new Chartist.Bar('#' + this.instanceId, dataPreferences, optionsBarChart, responsiveOptionsBarChart);
            this.startAnimationForBarChart();
        }
    }

    ngOnDestroy() {
        this.barChart.off()
        this.barChart.detach();
    }

}
