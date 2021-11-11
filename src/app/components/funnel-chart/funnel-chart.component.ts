import { Component, Input, ViewChild, OnChanges, Inject } from '@angular/core';
import { ChartWrapperService, CHART_WRAPPER_SERVICE } from 'app/services/chart-wrapper/chart-wrapper-service';

@Component({
    selector: 'app-funnel-chart',
    template: `<zingchart-angular #funnelChart 
                        [height]="250" 
                        [config]="inputFunnelData" output="svg">
               </zingchart-angular>
                `,
})
export class FunnelChartComponent implements OnChanges {
    @Input() inputFunnelData = { series: [], scaleX: { labels: [] }, scaleY: { labels: [] } };
    @ViewChild('funnelChart') funnelChart;

    constructor(
        @Inject(CHART_WRAPPER_SERVICE) private chartWrapperService: ChartWrapperService
    ) { }

    ngOnChanges(): void {
        let widthValue: string;
        if (this.inputFunnelData.scaleX.labels.length == 1) {
            widthValue = "42%";
        }
        else if (this.inputFunnelData.scaleX.labels.length == 2) {
            widthValue = "68%";
        }
        else {
            widthValue = "100%";
        }
        if (this.funnelChart != undefined) {
            this.funnelChart.resize({
                width: widthValue
            })
        }
        if (this.inputFunnelData.scaleX.labels.length > 0) {
            this.chartWrapperService.chartType = this.funnelChart;
        } else {
            this.chartWrapperService.chartType = null;
        }

    }

}
