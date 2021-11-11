import { Component, Input, Output, EventEmitter, DoCheck } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { AppFilter } from '../interfaces/app-filter';

import * as _ from 'lodash';

@Component({
    selector: '[app-more-options]',
    templateUrl: './more-options.component.html',
    styleUrls: ['./more-options.component.scss']
})
export class MoreOptionsComponent implements DoCheck {
    @Input() filters: AppFilter[];
    @Output() selectionChanged: EventEmitter<string[]> = new EventEmitter<string[]>();

    private filtersCloned;
    filtersGrouped: { name: string, sequence: number, filters: AppFilter[] }[];
    selectedItems = [];
    isGrouped = false;

    ngDoCheck() {
        if (!_.isEqual(this.filtersCloned, this.filters)) {
            this.filtersCloned = _.cloneDeep(this.filters);
            this.selectedItems = [];
            _.forEach(this.filtersCloned, (filter: AppFilter) => {
                if (!filter.mandatory && filter.display) {
                    this.selectedItems.push(filter.id);
                }
            });
            this.filtersGrouped = this.groupFiltersBySection(this.filtersCloned);
        }
    }

    private groupFiltersBySection(filters: AppFilter[]) {
        const groupOrder: string[] = [];
        _.forEach(filters, (filter) => {
            if (!filter.mandatory && filter.section && !_.includes(groupOrder, filter.section)) {
                groupOrder.push(filter.section);
            }
        });
        this.isGrouped = Boolean(groupOrder.length > 1);
        const tmp = _.groupBy(filters, 'section');
        const tmpMapped = _.map(tmp, (item, key) => ({ name: key, sequence: _.findIndex(groupOrder, i => i === key), filters: item }));
        return _.orderBy(tmpMapped, item => item.sequence);
    }

    onSelectionChange(matSelect: MatSelectChange) { // shows all selected items
        if (_.includes(matSelect.value, 'all')) {
            this.selectedItems = _.map(this.filtersCloned, f => f.id);
        }
        if (_.includes(matSelect.value, 'clear')) {
            this.selectedItems = [];
        }
        _.forEach(this.filtersCloned, (filter: AppFilter) => {
            if (!filter.mandatory) {
                if (_.includes(this.selectedItems, filter.id)) {
                    filter.display = true;
                } else {
                    filter.display = false;
                    filter.value = undefined;
                }
            }
        });
        this.selectionChanged.emit(this.selectedItems);
    }

}
