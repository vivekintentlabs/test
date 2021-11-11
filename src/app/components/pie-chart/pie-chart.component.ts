import { Component, AfterViewInit, ViewEncapsulation, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { PieSeries } from '../../entities/local/pie-series';
import * as Chartist from 'chartist';
import * as fillDonut from 'chartist-plugin-fill-donut/dist/chartist-plugin-fill-donut.js';

declare var $: any;

@Component({
    selector: 'app-pie-chart',
    templateUrl: 'pie-chart.component.html',
    styleUrls: ['pie-chart.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class PieChartComponent implements OnChanges, AfterViewInit, OnDestroy {
    @Input() label: string;
    @Input() pieChartData: PieSeries;
    @Input() customWidth: number = 0;
    @Input() customHeight: number = 0;
    @Input() classNames: Array<string>;
    static instanceCounter: number = 0;
    instanceId = '';
    initialized = false;
    readonly DEFAULT_HEIGHT = 230;
    private pieChart: any; // Chartist.Pie;

    constructor() {
        PieChartComponent.instanceCounter++;
        this.instanceId = 'chartPie' + PieChartComponent.instanceCounter;
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
                    labels.push(this.pieChartData.data[i].toString() + '%');
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
            const _items: any = [{
                content: (this.pieChartData == null || this.pieChartData.total == null)
                    ? '' : '<div class=\'total-pie\'>' + this.pieChartData.total + '</div>'
            }];

            // if custom width and height specified adds rounded background on a pie
            if (this.customWidth && this.customHeight) {
                const minSize = Math.min($('#' + this.instanceId).outerWidth(), this.customHeight);
                const offsetTop = (this.customHeight > minSize) ? (this.customHeight - minSize) / 2 : 0;
                _items.push({
                    'class': 'ct-fill-donut-bg-wrap',
                    'content': '<div class="ct-fill-donut-bg" style="width:' + minSize + 'px;height:' + minSize + 'px;top:' + offsetTop + 'px;margin-left:-' + minSize / 2 + 'px"></div>'
                });
            }
            const curvedOptions = {
                donut: true,
                donutWidth: 35,
                startAngle: 0,
                showLabel: true,
                width: (this.customWidth) ? this.customWidth + 'px' : '100%', // sets custom width
                height: (this.customHeight) ? this.customHeight + 'px' : this.DEFAULT_HEIGHT + 'px', // sets custom height
                plugins: [
                    fillDonut({
                        items: _items,
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
