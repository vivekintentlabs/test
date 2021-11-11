import { Component } from '@angular/core';
import { TextAreaWidget } from 'ngx-schema-form';

import * as _ from 'lodash';

@Component({
    selector: 'textarea-widget',
    templateUrl: './textarea-widget.html'
})
export class MatTextAreaWidget extends TextAreaWidget {

    ngAfterViewInit() {
        super.ngAfterViewInit();

        if (this.schema.isRequired && !this.schema.minLength) {
            this.control = _.clone(this.control);
        }
    }

}
