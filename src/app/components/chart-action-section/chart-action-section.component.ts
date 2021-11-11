import { Component, Inject, OnInit } from '@angular/core';
import { ChartActionSectionSetup } from 'app/common/interfaces';
import { ChartWrapperService, CHART_WRAPPER_SERVICE } from 'app/services/chart-wrapper/chart-wrapper-service';
@Component({
    selector: 'app-chart-action-section',
    templateUrl: './chart-action-section.component.html'
})
export class ChartActionSectionComponent implements OnInit {
    chartActionSection: ChartActionSectionSetup;

    constructor(
        @Inject(CHART_WRAPPER_SERVICE) public chartWrapperService: ChartWrapperService
    ) { }

    ngOnInit(): void {
        this.chartActionSection = this.chartWrapperService.getChartActionSectionConfig();
    }
}
