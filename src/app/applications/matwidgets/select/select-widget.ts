import { Component, ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BindingRegistry, SelectWidget } from 'ngx-schema-form';
import { ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { triggerBinding } from '../bindings-registry-helper';

import * as _ from 'lodash';

@Component({
    selector: 'select-widget',
    templateUrl: './select-widget.html'
})
export class MatSelectWidget extends SelectWidget {
    searchCtrl: FormControl = new FormControl();
    filteredList: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
    typeArray = 'array';

    private lastValue: number | number[];
    private unsubscribe = new Subject<void>();

    constructor(private ref: ChangeDetectorRef, private bindingRegistry: BindingRegistry) {
        super();
    }

    ngOnInit() {
        this.populateFilteredList();
        this.filterList();
    }

    private populateFilteredList() {
        this.searchCtrl.valueChanges.pipe(takeUntil(this.unsubscribe)).subscribe(() => this.filterList());
        this.formProperty.valueChanges.pipe(takeUntil(this.unsubscribe)).subscribe((event) => {
            triggerBinding(this, 'selectionChange', event, this.bindingRegistry, this.formProperty);
            this.filterList();
        });
    }

    filterList() {
        const search = _.toLower(this.searchCtrl.value);
        const items = (this.schema.type === this.typeArray ? this.schema.items.oneOf : this.schema.oneOf) || [];
        if (_.isArray(this.formProperty.value) && this.formProperty.value.length > 0) {
            items.forEach(item => {
                if (this.formProperty.value.includes(item.enum[0]) && !item.includeInList) {
                    item.includeInList = true;
                }
            });
        } else {
            const indexIncludeInList = _.findIndex(items, item => this.formProperty.value === item.enum[0] && !item.includeInList);
            if (indexIncludeInList > -1) {
                items[indexIncludeInList].includeInList = true;
            }
        }

        this.filteredList.next(
            search ? items.filter(i => i.description.toLowerCase().indexOf(search) > -1) : items.slice()
        );
        this.ref.detectChanges();
    }

    public composePlaceholder() {
        return (this.schema.title || this.schema.placeholder);
    }

    public cancel() {
        this.control.setValue(this.lastValue);
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

}
