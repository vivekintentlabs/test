import { Component, Input } from '@angular/core';
import { BaseFilterComponent } from '../base-filter/base-filter.component'
import { AppFilter } from '../../interfaces/app-filter';

// install 'MomentDateAdapter' lib and uncomment DateAdapter provider below befor you use component
// import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepicker } from '@angular/material/datepicker';

import * as moment from 'moment';
import * as _rollupMoment from 'moment';
import { Constants } from 'app/common/constants';

export const MY_FORMATS = {
    parse: {
        dateInput: 'MM-YYYY',
    },
    display: {
        dateInput: 'MM-YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY',
    },
};


@Component({
    selector: '[app-year-month-picker]',
    templateUrl: './year-month-picker.component.html',
    styleUrls: ['./year-month-picker.component.scss'],
    providers: [
        // { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    ],
})
export class YearMonthPickerComponent extends BaseFilterComponent {
    @Input() fieldConfig: AppFilter;

    _value
    @Input('value') set value(value) {
        this._value = (value) ? value : null;
    }

    chosenMonthHandler(normlizedMonth: moment.Moment, datepicker: MatDatepicker<moment.Moment>) {
        this.fieldConfig.value = normlizedMonth.format(Constants.dateFormats.date);
        this.selectionChanged();
        datepicker.close();
    }

    selectionChanged() {
        const outputValue = (this.fieldConfig.value === null) ? null : this.fieldConfig.value;
        this.valueChanged.emit({
            id: this.fieldConfig.id,
            value: outputValue,
            type: this.fieldConfig.type,
            multiple: this.fieldConfig.multiple
        });
    }

    clickClear() {
        this._value = null;
        this.valueChanged.emit({ id: this.fieldConfig.id, value: null, type: this.fieldConfig.type });
    }

}
