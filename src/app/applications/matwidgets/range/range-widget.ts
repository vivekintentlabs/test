import { Component } from '@angular/core';
import { RangeWidget } from 'ngx-schema-form';

import * as _ from 'lodash';

@Component({
    selector: 'range-widget',
    templateUrl: './range-widget.html'
})
export class MatRangeWidget extends RangeWidget { }
