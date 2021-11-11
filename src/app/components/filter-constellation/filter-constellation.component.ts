import { Component, Input, Output, OnChanges, OnDestroy, SimpleChanges, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators/takeUntil';

import { StorageService } from 'app/services/storage.service';
import { ListenerService } from 'app/services/listener.service';

import { StorageAccessor } from 'app/common/storage/storage-accessor';
import { KeyValueCategory } from 'app/common/enums';

import { AppFilter } from './interfaces/app-filter';
import { FilterValue } from './interfaces/filter-value';

import * as _ from 'lodash';

@Component({
    selector: 'app-filter-constellation',
    templateUrl: './filter-constellation.component.html',
    styleUrls: ['./filter-constellation.component.scss']
})
export class FilterConstellationComponent implements OnChanges, OnDestroy {
    @Input() filters: AppFilter[];
    @Input() filterValues: FilterValue[];
    @Input() debugMode: boolean;
    @Input() updateTrigger = false;
    @Input() name: string;
    @Input() useLocalStorage: boolean;

    @Output() filterChanged: EventEmitter<FilterValue[]> = new EventEmitter<FilterValue[]>();
    @Output() resetSearchText = new EventEmitter();

    private updateTriggerPrevValue: boolean;
    private resultingFilterValues: FilterValue[] = [];
    private storageAccessor: StorageAccessor;

    more = true;

    private unsubscribe = new Subject();

    constructor(storageService: StorageService, private listenerService: ListenerService) {
        this.storageAccessor = storageService.getStorageAccessor(KeyValueCategory.CATEGORY_FILTER);
        this.listenerService.campusListStatus().pipe(takeUntil(this.unsubscribe)).subscribe(() => {
            this.resetFilters();
            this.resetSearchText.emit();
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.name) {
            if (changes.filterValues && changes.filterValues.isFirstChange() && this.useLocalStorage) {
                this.getFilter().then(() => {
                    this.ifFilterValueIsChanged(changes);
                });
            } else {
                this.ifFilterValueIsChanged(changes);
            }
        }
    }

    private ifFilterValueIsChanged(changes: SimpleChanges) {
        _.forEach(changes, (propValue, propKey) => {
            this.more = !!(_.find(this.filters, f => !f.mandatory));
            if (propKey === 'filterValues' && this.filterValues) {
                if (!_.isEqual(propValue.currentValue, this.resultingFilterValues) || this.updateTrigger !== this.updateTriggerPrevValue) {
                    this.updateTriggerPrevValue = this.updateTrigger;
                    this.resultingFilterValues = _.cloneDeep(this.filterValues) || [];
                    this.filterValuesChanged();
                }
            }
        });
    }

    onResetFilter() {
        this.resultingFilterValues = [];
        this.resetFilters();
        this.filterValuesChanged();
        this.resetSearchText.emit();
    }

    private resetFilters() {
        _.forEach(this.filters, (filter: AppFilter) => {
            filter.value = null;
            if (!filter.mandatory) { // hide all optional fields
                filter.display = false;
            }
        });
    }

    private filtersChanged() {
        _.forEach(this.resultingFilterValues, (filterValue: FilterValue) => {
            const filter: AppFilter = this.findFilter(filterValue.id);
            if (filter) {
                filter.display = true;
                filter.value = filterValue.value;
            } else {
                console.log('setup error: could not find filter with id: ' + filterValue.id);
            }
        });
    }

    private filterValuesChanged() {
        this.filtersChanged();
        this.emitFilterChange();
    }

    filterIsDeleted(filterId: string) {
        let hadValue = false;
        const foundFilter: AppFilter = this.findFilter(filterId);
        hadValue = this.hasSelectedValue(foundFilter);
        foundFilter.display = false;
        foundFilter.value = null;
        this.removeFilterValue(filterId);
        if (hadValue) {
            this.filterValuesChanged();
        }
    }

    private hasSelectedValue(filter: AppFilter): boolean {
        return !!(
            (_.isArray(filter.value) && !_.isEmpty(filter.value)) ||
            (_.isString(filter.value) && filter.value) ||
            _.isNumber(filter.value) ||
            _.isBoolean(filter.value)
        );
    }

    moreOptionsSelectionChanged(filterIds: string[]) {
        let hadValue = false;
        _.forEach(this.filters, (filter: AppFilter) => {
            if (!filter.mandatory) {
                filter.display = _.includes(filterIds, filter.id);
                if (!filter.display) {
                    if (this.hasSelectedValue(filter)) {
                        hadValue = true;
                    }
                    filter.value = undefined;
                    this.removeFilterValue(filter.id);
                }
            }
        });
        if (hadValue) {
            this.emitFilterChange();
        }
    }

    valueHasChanged(filterResult: FilterValue) {
        this.setFilterValue(filterResult);

        const filter = this.findFilter(filterResult.id);
        filter.value = filterResult.value;
        filter.textValues = filterResult.textValues;

        this.emitFilterChange();
    }

    private emitFilterChange() {
        this.addOrUpdateFilter(this.resultingFilterValues);
        this.filterChanged.emit(this.resultingFilterValues);
    }

    protected setFilterValue(filterResult: FilterValue) {
        const filterValue: FilterValue = this.findFilterValue(filterResult.id);
        if (filterResult.value === undefined) {
            this.removeFilterValue(filterResult.id);
        } else {
            if (filterValue) {
                filterValue.value = filterResult.value;
                filterValue.textValues = filterResult.textValues;
            } else {
                this.resultingFilterValues.push(filterResult);
            }
        }
    }

    protected removeFilterValue(filterId: string) {
        _.remove(this.resultingFilterValues, (filterValue: AppFilter) => filterValue.id === filterId);
    }

    protected findFilterValue(filterId: string): FilterValue {
        const foundFilterValue: FilterValue = _.find(this.resultingFilterValues, (filterValue: AppFilter) =>  filterValue.id === filterId);
        return foundFilterValue;
    }

    protected findFilter(filterId: string): AppFilter {
        const foundFilter: AppFilter = _.find(this.filters, (filter: AppFilter) => filter.id === filterId);
        return foundFilter;
    }

    protected stringify(json: any) {
        return JSON.stringify(json);
    }

    /**
     * Gets filter from the db and calls loadFilterValues() if filter has values
     */
    private getFilter(): Promise<void> {
        return this.storageAccessor.get(this.name).then(filter => {
            if (filter) {
                this.filterValues = filter;
            }
        });
    }

    /**
     * Adds filter into db or updates filter values if this filter is already exists in the db
     * @param filterValues
     */
    private addOrUpdateFilter(filterValues: FilterValue[]): Promise<void> {
        return this.storageAccessor.get(this.name).then(filter => {
            if (filter) {
                return this.storageAccessor.update(this.name, filterValues);
            } else {
                return this.storageAccessor.add(this.name, filterValues);
            }
        });
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

}
