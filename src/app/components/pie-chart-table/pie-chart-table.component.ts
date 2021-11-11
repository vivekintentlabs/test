import { Component, AfterViewInit, ViewEncapsulation, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { PieSeries } from '../../entities/local/pie-series';
import * as Chartist from 'chartist';
import * as fillDonut from 'chartist-plugin-fill-donut/dist/chartist-plugin-fill-donut.js';

declare var $: any;

@Component({
    selector: 'app-pie-chart-table',
    templateUrl: 'pie-chart-table.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['pie-chart-table.component.css'],
})
export class PieChartTableComponent implements OnChanges, AfterViewInit, OnDestroy {
    @Input() pieChartData: PieSeries;
    @Input() classNames: Array<string>;
    static instanceCounter: number = 0;
    instanceId = '';
    initialized = false;
    private pieChart: any; // Chartist.Pie;

    constructor() {
        PieChartTableComponent.instanceCounter++;
        this.instanceId = 'chartPie' + PieChartTableComponent.instanceCounter;
    }

    ngAfterViewInit() {
        this.initialized = true;
        this.ngOnChanges(null);
    }

    startAnimationForPieChart() {
        this.pieChart.on('draw', function (data) {
            if (data.type === 'slice') {
                const pathLength = data.element._node.getTotalLength();
                data.element.attr({
                    'stroke-dasharray': pathLength + 'px ' + pathLength + 'px'
                });

                const animationDefinition = {
                    'stroke-dashoffset': {
                        id: 'anim' + data.index,
                        dur: 1200,
                        from: -pathLength + 'px',
                        easing: Chartist.Svg.Easing.easeOutQuint,
                        to: '0px',
                        fill: 'freeze',
                    }
                };
                if (data.index !== 0) {
                    animationDefinition['stroke-dashoffset']['begin'] = 'anim' + (data.index - 1) + '.end';
                }
                data.element.attr({
                    'stroke-dashoffset': -pathLength + 'px'
                });
                data.element.animate(animationDefinition, false);
                setTimeout(() => {
                    const temp1 = $('g').find('text');
                    const temp2 = temp1.filter(function () {
                        return this.textContent === '0%';
                    });
                    temp2.remove();
                }, 0);
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.initialized) {
            let dataPreferences;
            if (this.pieChartData && this.pieChartData.data) {
                const labels = [];
                const dataSeries = [];
                for (let i = 0; i < this.pieChartData.data.length; i++) {
                    labels.push(this.pieChartData.data[i].toString());
                    dataSeries.push({ value: this.pieChartData.data[i], className: this.classNames[i] })

                }
                dataPreferences = {
                    labels: labels,
                    series: dataSeries
                };
            } else {
                dataPreferences = {
                    labels: [],
                    series: []
                };
            }
            const curvedOptions = {
                donut: true,
                donutWidth: 30,
                startAngle: 0,
                showLabel: this.pieChartData && this.pieChartData.data.length > 1 ? true : false,
                height: '125px',
                plugins: [
                    fillDonut({
                        items: [{
                            // tslint:disable-next-line:max-line-length
                            content: (this.pieChartData == null || this.pieChartData.total == null) ? '' : '<div class="total-pie"><i class="material-icons md-24">people_outline</i></div>'
                        }]
                    })
                ],
            };
            this.pieChart = new Chartist.Pie('#' + this.instanceId, dataPreferences, curvedOptions);
            this.startAnimationForPieChart();
        }
    }

    ngOnDestroy() {
        this.pieChart.off('draw');
        this.pieChart.detach();
    }

}
