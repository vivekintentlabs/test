import { Component, Input, Output, OnChanges, EventEmitter, OnDestroy } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ListenerService } from 'app/services/listener.service';

import { IWidgetFilterParams } from 'app/common/interfaces';

import { AppFilter } from 'app/entities/app-filter';

import { FilterValue } from 'app/components/filter-constellation/interfaces/filter-value';

import * as _ from 'lodash';


@Component({
    selector: 'app-widget-filter',
    templateUrl: 'widget-filter.component.html',
    styleUrls: ['./widget-filter.component.scss']
})
export class WidgetFilterComponent implements OnChanges, OnDestroy {
    @Input() params: IWidgetFilterParams;
    @Output() filterIsChanged = new EventEmitter<FilterValue[]>();

    uniqName: string;
    filters: AppFilter[];
    values: FilterValue[];
    useLocalStorage: boolean;

    updateTrigger = false;

    private unsubscribe: Subject<void> = new Subject();

    constructor(listenerService: ListenerService) {
       listenerService.campusListStatus().pipe(takeUntil(this.unsubscribe)).subscribe(() => {
           this.updateTrigger = !this.updateTrigger;
        });
    }

    ngOnChanges() {
        if (this.params) {
            this.useLocalStorage = this.params.useLocalStorage;
            this.uniqName = this.params.uniqName;
            this.filters = this.params.filters;
            this.values = this.params.values;
        }
    }

    onFilterChange(filterValues: FilterValue[]) {
        this.values = filterValues;
        this.filterIsChanged.emit(filterValues);
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

}
