import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AppFilter } from '../../../entities/app-filter';
import { FilterValue } from '../interfaces/filter-value';
import { FieldType } from '../../../common/enums';

@Component({
    selector: '[app-filter-switch]',
    templateUrl: './filter-switch.component.html',
    styleUrls: ['./filter-switch.component.scss']
})
export class FilterSwitchComponent {
    @Input() filterConfig: AppFilter;
    @Output() filterDeleted: EventEmitter<string> = new EventEmitter<string>();
    @Output() valueChanged: EventEmitter<FilterValue> = new EventEmitter<FilterValue>();

    fieldType = FieldType;

    constructor() { }

    valueHasChanged(filterResult: FilterValue) {
        this.valueChanged.emit(filterResult);
    }

    deleteFilter(filterId: string) {
        this.filterDeleted.emit(filterId);
    }

}
