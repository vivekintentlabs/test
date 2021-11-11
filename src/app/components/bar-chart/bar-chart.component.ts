import { Component, AfterViewInit, ViewEncapsulation, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import * as Chartist from 'chartist';

@Component({
    selector: 'app-bar-chart',
    templateUrl: 'bar-chart.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['bar-chart.component.css'],
})
export class BarChartComponent implements OnChanges, AfterViewInit, OnDestroy {
    @Input() inputBarChart;
    @Input() labels;
    @Input() title;
    static instanceCounter = 0;
    instanceId = '';
    initialized = false;
    private barChart: any; // Chartist.Bar;

    constructor() {
        BarChartComponent.instanceCounter++;
        this.instanceId = 'chartBar' + BarChartComponent.instanceCounter;
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
                dataPreferences = {
                    labels: this.labels,
                    series: [this.inputBarChart]
                };
            } else {
                dataPreferences = {
                    labels: [],
                    series: []
                };
            }

            const optionsBarChart = {
                seriesBarDistance: 10,
                axisX: {
                    showGrid: false,
                },
                axisY: {
                    onlyInteger: true,
                    offset: 20
                },
                height: '230px'
            };

            const responsiveOptionsBarChart: any = [
                ['screen and (max-width: 640px)', {
                    seriesBarDistance: 10,
                    axisX: {
                        offset: 100,
                        showGrid: false,
                    },
                    axisY: {
                        onlyInteger: true,
                    },
                    height: '230px'
                }]
            ];

            this.barChart = new Chartist.Bar('#' + this.instanceId, dataPreferences, optionsBarChart, responsiveOptionsBarChart);
            this.startAnimationForBarChart();
        }
    }

    ngOnDestroy() {
        this.barChart.off();
        this.barChart.detach();
    }

}
