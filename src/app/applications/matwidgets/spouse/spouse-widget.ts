import { Component, ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ArrayProperty, BindingRegistry, PropertyGroup, SelectWidget } from 'ngx-schema-form';
import { ReplaySubject, Subject } from 'rxjs';
import { pairwise, takeUntil } from 'rxjs/operators';

import { triggerBinding } from '../bindings-registry-helper';

import * as _ from 'lodash';

@Component({
    selector: 'spouse-widget',
    templateUrl: './spouse-widget.html'
})
export class SpouseWidget extends SelectWidget {
    searchCtrl: FormControl = new FormControl();
    filteredList: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
    spouseList: Array<{ id: number, name: string }> = [];

    private lastValue: number;
    private unsubscribe = new Subject<void>();

    constructor(private ref: ChangeDetectorRef, private bindingRegistry: BindingRegistry) {
        super();
    }

    ngOnInit() {
        this.populateFilteredList();
    }

    ngAfterViewInit() {
        super.ngAfterViewInit();
        const parent: PropertyGroup = this.formProperty.parent;
        const parentGuardians: ArrayProperty = parent.getProperty('parentGuardians');
        parentGuardians
            .valueChanges
            .pipe(pairwise(), takeUntil(this.unsubscribe))
            .subscribe(([prev, next]: [any[], any[]]) => {
                if (prev.length !== next.length && next.length < prev.length && next.length >= 1) {
                    const removedParent = _.difference(prev, next).shift();
                    const removedIndex = _.findIndex(prev, item => _.isEqual(item, removedParent));
                    this.spouseList = [];
                    if (removedIndex === this.formProperty.value) {
                        this.formProperty.setValue(null, false);
                    } else if (this.formProperty.value > removedIndex) {
                        this.formProperty.setValue(this.formProperty.value - 1, false);
                    }
                }
                if (next.length > 1) {
                    _.forEach(next, (i, index) => {
                        if (index === 0) return;
                        const name = `${i.lastName ? i.lastName : 'Last Name'}, ${i.firstName ? i.firstName : 'First Name'}`;
                        const potentialSpouse = _.find(this.spouseList, s => s.id === index);
                        if (!potentialSpouse) {
                            this.spouseList.push({ id: index, name });
                        } else {
                            potentialSpouse.name = name;
                        }
                    });
                    this.filterList();
                }
            });
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
        const items = this.spouseList || [];
        this.filteredList.next(
            search ? items.filter(i => i.name.toLowerCase().indexOf(search) > -1) : items.slice()
        );
        this.ref.detectChanges();
    }

    public cancel() {
        this.control.setValue(this.lastValue);
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

}
