import { Component } from '@angular/core';
import { ControlWidget } from 'ngx-schema-form';

import { Constants } from 'app/common/constants';
import * as moment from 'moment';

@Component({
    selector: 'app-date-widget',
    templateUrl: './date-widget.html'
})
export class DateWidget extends ControlWidget {

    onDateChange(event: moment.Moment) {
        this.control.setValue(event?.format(Constants.dateFormats.date) || '');
    }

}
