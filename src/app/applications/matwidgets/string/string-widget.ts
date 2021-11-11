import { Component } from '@angular/core';
import { StringWidget } from 'ngx-schema-form';

import * as _ from 'lodash';

@Component({
    selector: 'string-widget',
    templateUrl: './string-widget.html'
})
export class MatStringWidget extends StringWidget { }
