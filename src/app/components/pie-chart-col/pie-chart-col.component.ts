import { Component, ViewEncapsulation, Input } from '@angular/core';
import { Router } from '@angular/router';

import { PieChartColData } from 'app/entities/local/pie-chart-col-data';
import { Legend } from 'app/entities/local/legend';


@Component({
    selector: 'app-pie-chart-col',
    templateUrl: 'pie-chart-col.component.html',
    styleUrls: ['pie-chart-col.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class PieChartColComponent {

    @Input() title: string;
    @Input() icon: string = 'pie_chart';
    @Input() inputPieChart: PieChartColData;

    constructor(private router: Router) { }

    onClickLegend(legend: Legend) {
        this.router.navigate([legend.url, legend.params]);
    }

}
