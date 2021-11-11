import { Component, Inject } from '@angular/core';

import { ChartWrapperService, CHART_WRAPPER_SERVICE } from 'app/services/chart-wrapper/chart-wrapper-service';

@Component({
  selector: 'app-chart-wrapper',
  templateUrl: './chart-wrapper.component.html',
  styleUrls: ['./chart-wrapper.component.scss']
})
export class ChartwrapperComponent {
  constructor(
    @Inject(CHART_WRAPPER_SERVICE) public chartWrapperService: ChartWrapperService
  ) { }
}
