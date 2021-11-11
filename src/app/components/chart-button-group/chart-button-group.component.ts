import { Component, OnInit, Inject } from '@angular/core';
import { Constants } from 'app/common/constants';

import { ChartButtonGroupSetup } from 'app/common/interfaces';
import { ChartWrapperService, CHART_WRAPPER_SERVICE } from 'app/services/chart-wrapper/chart-wrapper-service';
import { ChartService } from 'app/state/chart';
import * as _ from 'lodash';

@Component({
    selector: 'app-chart-button-group',
    templateUrl: './chart-button-group.component.html',
    styleUrls: ['./chart-button-group.component.scss']
})
export class ChartButtonGroupComponent implements OnInit {
    public chartButtonGroup: ChartButtonGroupSetup;
    constants = Constants;

    constructor(
        @Inject(CHART_WRAPPER_SERVICE) public chartWrapperService: ChartWrapperService,
        public chartService: ChartService
    ) { }

    ngOnInit() {
        this.chartButtonGroup = this.chartWrapperService.getChartButtonGroupConfig();
        const chartEntity = this.chartWrapperService.getChartEntity();
        if (this.chartButtonGroup.menuButton.aggregateSection) {
            this.chartButtonGroup.menuButton.aggregateSection.isSelected = chartEntity?.isAggregated ?? false;
        }
    }

    toggleAggregate() {
        this.chartButtonGroup.menuButton.aggregateSection.isSelected = !this.chartButtonGroup.menuButton.aggregateSection.isSelected;
        this.chartWrapperService.setAggregateStatus(this.chartButtonGroup.menuButton.aggregateSection.isSelected);
    }

    toggleLegend() {
        this.chartButtonGroup.menuButton.legendSection.isSelected = !this.chartButtonGroup.menuButton.legendSection.isSelected;
        this.chartService.updateLegendSection(this.chartWrapperService.getChartEntityId());
    }

    toggleTotal() {
        this.chartButtonGroup.menuButton.totalSection.isSelected = !this.chartButtonGroup.menuButton.totalSection.isSelected;
        this.chartWrapperService.setShowTotalStatus(this.chartButtonGroup.menuButton.totalSection.isSelected);
    }

    changeChart(chartType) {
        this.chartButtonGroup.chartTypeMenus.menuIcon = Constants.ChartIcons[chartType.type];
        this.chartWrapperService.setChartTypeStatus(chartType);
    }
}
