import { Component } from '@angular/core';
import { ControlWidget } from 'ngx-schema-form';

import * as _ from 'lodash';

@Component({
    selector: 'string-widget',
    template: '<input [attr.name]="name" type="hidden" [formControl]="control">'
})
export class MatHiddenWidget extends ControlWidget { }
