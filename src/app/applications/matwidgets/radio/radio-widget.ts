import { Component } from '@angular/core';
import { RadioWidget } from 'ngx-schema-form';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import * as _ from 'lodash';

@Component({
    selector: 'radio-widget',
    templateUrl: './radio-widget.html'
})
export class MatRadioWidget extends RadioWidget {
    private unsubscribe = new Subject<void>();

    ngOnInit() {
        this.formProperty.valueChanges.pipe(takeUntil(this.unsubscribe)).subscribe(() => {
            const indexIncludeInList = _.findIndex(this.schema.oneOf, item => item.enum[0] === this.formProperty.value && !item.includeInList);
            if (indexIncludeInList > -1) {
                this.schema.oneOf[indexIncludeInList].includeInList = true;
            }
        });
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }
}
