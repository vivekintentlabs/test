import { Component } from '@angular/core';
import { SelectWidget } from 'ngx-schema-form';
import { Utils } from 'app/common/utils';

import * as _ from 'lodash';

@Component({
    selector: 'app-year-widget',
    templateUrl: './year-widget.html'
})
export class MatYearWidget extends SelectWidget {

    public rangeOfYears: number[] = [];
    startingMonth: number;

    ngOnInit() {
        this.startingMonth = this.schema.widget.startingMonth;
        this.rangeOfYears = this.generateYears();
    }

    private generateYears() {
        const currentYear = new Date().getFullYear();
        const firstYear = this.formProperty.path.split('/').pop() === 'startingYear' ? Utils.getStartingYear(this.startingMonth) : currentYear;
        const lastYear = firstYear + this.schema.widget.rangeDelta;
        return _.range(firstYear, lastYear);
    }

}
