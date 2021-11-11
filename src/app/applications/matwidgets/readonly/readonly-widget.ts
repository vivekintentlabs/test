import { Component } from '@angular/core';
import { ObjectLayoutWidget } from 'ngx-schema-form';


@Component({
    selector: 'app-readonly-widget',
    templateUrl: './readonly-widget.html',
    styleUrls: ['readonly-widget.scss']
})
export class ReadonlyWidget extends ObjectLayoutWidget {

    getProperty(fieldId) {
        return this.formProperty.getProperty(fieldId);
    }

}
