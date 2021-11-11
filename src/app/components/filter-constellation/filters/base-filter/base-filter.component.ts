import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FilterValue } from '../../interfaces/filter-value';
import { AppFilter } from '../../interfaces/app-filter';
import { LocaleService } from 'app/services/locale.service';
import { SchoolQuery } from 'app/state/school';

@Component({
    selector: 'app-base-filter',
    template: ''
})
export class BaseFilterComponent {
    @Input() fieldConfig: AppFilter;
    @Output() filterRemoved: EventEmitter<string> = new EventEmitter<string>();
    @Output() valueChanged: EventEmitter<FilterValue> = new EventEmitter<FilterValue>();

    startingMonth$;

    constructor(
        localeService: LocaleService,
        schoolQuery: SchoolQuery
    ) {
        this.startingMonth$ = schoolQuery.startingMonth$;
    }

    public removeFilter(): void {
        this.filterRemoved.emit(this.fieldConfig.id);
    }

}
