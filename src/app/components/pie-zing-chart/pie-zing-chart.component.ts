import { Component, Input, ViewChild, SimpleChanges, OnChanges, Inject } from '@angular/core';
import { Constants } from 'app/common/constants';
import { GraphsetData, ZingData } from 'app/entities/local/zing-chart';
import { ChartWrapperService, CHART_WRAPPER_SERVICE } from 'app/services/chart-wrapper/chart-wrapper-service';
import * as _ from 'lodash';
import { CustomZingChartAngularComponent } from 'zingchart';

@Component({
    selector: 'app-pie-zing-chart',
    template: `<zingchart-angular [height]="height"
                        width="100%" #pieChart
                        [config]="pieChartInputData" output="svg">
                </zingchart-angular>`
})
export class PieZingChartComponent implements OnChanges {
    @Input() pieChartInputData: GraphsetData;
    @ViewChild('pieChart') pieChart: CustomZingChartAngularComponent;
    height: number;
    readonly DEFAULT_HEIGHT_WITHOUT_SHOW_TOTAL = 266;
    readonly DEFAULT_HEIGHT_WITH_SHOW_TOTAL = 356;

    constructor(
        @Inject(CHART_WRAPPER_SERVICE) private chartWrapperService: ChartWrapperService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        const chartEntity = this.chartWrapperService.getChartEntity();
        if (changes.pieChartInputData.currentValue != null) {
            if (chartEntity.hasPlotTotal) {
                this.height = changes.pieChartInputData.currentValue.graphset.length * this.DEFAULT_HEIGHT_WITH_SHOW_TOTAL;
            } else {
                this.height = Math.ceil((changes.pieChartInputData.currentValue.graphset.length || 1) / 2) * this.DEFAULT_HEIGHT_WITHOUT_SHOW_TOTAL;
            }
        }
        if (this.pieChart) {
            this.pieChart.resize({
                height: this.height
            });
        }
        if (changes.pieChartInputData.currentValue && (!chartEntity.chartType || chartEntity.chartType.type == Constants.ChartTypes.pie)) {
            const chartList: ZingData[] = _.filter(changes.pieChartInputData.currentValue.graphset, (g: ZingData) => !g.series.length);
            if (chartList.length) {
                this.chartWrapperService.chartType = null;
            } else {
                this.chartWrapperService.chartType = this.pieChart;
            }
        }
    }
}
