import { Component } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { CheckboxWidget } from 'ngx-schema-form';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import * as _ from 'lodash';

@Component({
    selector: 'checkbox-widget',
    templateUrl: './checkbox-widget.html'
})
export class MatCheckboxWidget extends CheckboxWidget {
    private unsubscribe = new Subject<void>();

    ngOnInit() {
        if (this.schema.type === 'array') {
            this.formProperty.valueChanges.pipe(takeUntil(this.unsubscribe)).subscribe(() => {
                if (_.isArray(this.formProperty.value) && this.formProperty.value.length > 0) {
                    this.schema.items.oneOf.forEach(item => {
                        if (this.formProperty.value.includes(item.enum[0]) && !item.includeInList) {
                            item.includeInList = true;
                        }
                    });
                } else {
                    const indexIncludeInList = _.findIndex(this.schema.items.oneOf, item => this.formProperty.value === item.enum[0] && !item.includeInList);
                    if (indexIncludeInList > -1) {
                        this.schema.items.oneOf[indexIncludeInList].includeInList = true;
                    }
                }
            });
        }
    }

    public isRequiredArray() {
        return (this.schema.type === 'array' && this.schema.minItems > 0);
    }

    onCheck(event: MatCheckboxChange) {
        if (event.checked) {
            this.checked[event.source.value] = true;
        } else {
            delete this.checked[event.source.value];
        }

        const fieldType = (this.schema.type === 'array') ? this.schema.items.type : this.schema.type;
        const newValue = fieldType === 'boolean'
            ? event.checked || null
            : Object.keys(this.checked).map(k => ['number' as any, 'integer'].includes(fieldType) ? +k : k);
        this.formProperty.setValue(newValue, false);
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

}
