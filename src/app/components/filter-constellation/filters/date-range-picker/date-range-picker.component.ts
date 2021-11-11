import { Component, Input } from '@angular/core';
import { BaseFilterComponent } from '../base-filter/base-filter.component';
import { Constants } from '../../../../common/constants';
import { AppFilter } from '../../interfaces/app-filter';
import { LocaleService } from 'app/services/locale.service';
import { SchoolQuery } from 'app/state/school';

import * as moment from 'moment';

@Component({
    selector: '[app-date-range-picker]',
    templateUrl: './date-range-picker.component.html',
    styleUrls: ['./date-range-picker.component.scss'],
})
export class DateRangePickerComponent extends BaseFilterComponent {
    @Input() fieldConfig: AppFilter;
    format = Constants.dateFormats.dayMonthYear;
    _value: {startDate: string, endDate: string} | null;
    @Input('value') set value(value) {
        if (value) {
            value.startDate = moment(value.startDate).format(this.localeOptions.format);
            value.endDate = moment(value.endDate).format(this.localeOptions.format);
            this._value = value;
        } else {
            this._value = null;
        }
    }
    ranges: any = {
        'All Dates': [moment('2000-01-01'), moment()],
        'Today': [moment(), moment()],
        'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
        'Last 30 Days': [moment().subtract(29, 'days'), moment()],
        'This Month': [moment().startOf('month'), moment().endOf('month')],
        'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
        'This Year': [moment().startOf('year'), moment().endOf('year')],
        'Last Year': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')]
    };
    localeOptions = {
        format: '',
        separator: ' - ',
        cancelLabel: 'Cancel',
        applyLabel: 'Ok',
        firstDay: 1
    };

    constructor(localeService: LocaleService, schoolQuery: SchoolQuery) {
        super(localeService, schoolQuery);
        this.localeOptions.format = localeService.getFormat(Constants.localeFormats.date);
    }

    dateRangeChanged(result) {
        if (result && result.startDate && result.endDate) {
            const val = { startDate: result.startDate, endDate: result.endDate, format: this.localeOptions.format };
            this.valueChanged.emit({ id: this.fieldConfig.id, value: val, type: this.fieldConfig.type });
        }
    }

    clickClear() {
        this._value = null;
        this.valueChanged.emit({ id: this.fieldConfig.id, value: null, type: this.fieldConfig.type });
    }

}
