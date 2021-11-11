import { Component } from '@angular/core';
import { ObjectLayoutWidget } from 'ngx-schema-form';
import * as _ from 'lodash';

@Component({
    selector: 'app-special-select-widget',
    templateUrl: './special-select-widget.html'
})
export class MatSpecialSelectWidget extends ObjectLayoutWidget {

    private getProperty(fieldId: string) {
        return this.formProperty.getProperty(fieldId);
    }

    isVisible(fieldId: string) {
        return this.getProperty(fieldId)._visible;
    }

}
