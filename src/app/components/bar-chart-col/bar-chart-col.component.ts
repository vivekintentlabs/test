import { Component, ViewEncapsulation, Input, IterableDiffers, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChartData } from '../../entities/local/chart-data';
import { Legend } from '../../entities/local/legend';

import * as _ from 'lodash';

@Component({
    selector: 'app-bar-chart-col',
    templateUrl: 'bar-chart-col.component.html',
    styleUrls: ['bar-chart-col.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class BarChartColComponent implements OnInit {

    @Input() title: string;
    @Input() icon: string = 'format_align_left';
    @Input() inputBarChart: ChartData;
    private iterableDiffer: any;
    public isClickableLegend: boolean;

    constructor(private router: Router, private _iterableDiffers: IterableDiffers) { }

    ngOnInit() {
        this.iterableDiffer = this._iterableDiffers.find([]).create(null);
    }

    sendBack(url: string) {
        this.router.navigate([url]);
    }

    onClickLegend(legend: Legend) {
        this.router.navigate([legend.url, legend.params]);
    }

}
