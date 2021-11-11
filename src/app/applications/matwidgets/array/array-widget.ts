import { Component } from '@angular/core';

import { ArrayWidget } from 'ngx-schema-form';

@Component({
    selector: 'array-widget',
    templateUrl: './array-widget.html'
})
export class MatArrayWidget extends ArrayWidget {
    step = 0;

    addItem() {
        this.step = +this.formProperty.properties.length;
        super.addItem();
    }

}
