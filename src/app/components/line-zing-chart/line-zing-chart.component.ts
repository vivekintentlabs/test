import { Component, AfterViewInit, Input, DoCheck, NgZone, OnDestroy } from '@angular/core';
import { LineZingChart } from 'app/entities/local/line-zing-chart';

import zingchart from 'zingchart/es6';
import * as _ from 'lodash';

@Component({
    selector: 'app-line-zing-chart',
    template: '<div [id]="instanceId"></div>'
})
export class LineZingChartComponent implements DoCheck, AfterViewInit, OnDestroy {
    static instanceCounter = 0;
    @Input() inputLineZingChart = {series: [], scaleX: { labels: []}, scaleY: { labels: []}, legend: {}};
    instanceId = '';
    initialized = false;
    chart: LineZingChart;
    _inputLineZingChart = {};

    constructor(private zone: NgZone) {
        LineZingChartComponent.instanceCounter++;
        this.instanceId = 'lineZingChart' + LineZingChartComponent.instanceCounter;
        this.chart = new LineZingChart(this.instanceId);
    }

    ngAfterViewInit() {
        this.initialized = true;
        this.zone.runOutsideAngular(() => zingchart.render(this.chart));
    }

    ngDoCheck() {
        if (!_.isEqual(this._inputLineZingChart, this.inputLineZingChart)) {
            this._inputLineZingChart = _.cloneDeep(this.inputLineZingChart);
            this.chart.data.series = this.inputLineZingChart.series;
            this.chart.data.scaleX = this.inputLineZingChart.scaleX;
            this.chart.data.scaleY = this.inputLineZingChart.scaleY;
            this.chart.data.legend = this.inputLineZingChart.legend;
            if (this.initialized) {
                this.zone.runOutsideAngular(() => zingchart.render(this.chart));
            }
        }
    }

    ngOnDestroy() {
        if (this.chart) {
            zingchart.exec(this.chart.id, 'destroy');
        }
    }
}
