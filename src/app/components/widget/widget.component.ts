import { Component, OnChanges, Input, Output, EventEmitter } from '@angular/core';

import { WidgetService } from 'app/components/widget/widget.service'

import { IWidgetParams, IWidgetFilterParams } from 'app/common/interfaces';

import { Student } from 'app/entities/student';

import { FilterValue } from 'app/components/filter-constellation/interfaces/filter-value';

import * as _ from 'lodash';


@Component({
    selector: 'app-widget',
    templateUrl: 'widget.component.html',
    styleUrls: ['widget.component.scss'],
    providers: [WidgetService],
})
export class WidgetComponent implements OnChanges {
    @Input() params: IWidgetParams;
    @Input() noPadding = false;
    @Output() callBack = new EventEmitter<Student[]>();

    public title;
    public icon;
    public filterParmas: IWidgetFilterParams;

    constructor(private widgetService: WidgetService) { }

    ngOnChanges() {
        if (this.params) {
            this.title = this.params.title || null;
            this.icon = this.params.icon || 'filter_list';
            this.filterParmas = this.widgetService.getFilterParams(this.params);
        }
    }

    onFilterChange(filterValues: FilterValue[]) {
        if (filterValues.length > 0) {
            this.filterParmas.values = filterValues;

            const students = this.widgetService.filterStudents(filterValues);
            this.callBack.emit(students);
        } else {
            const tmp = _.cloneDeep(this.filterParmas);
            tmp.values = this.widgetService.defaultFilterValues;
            this.filterParmas = null;
            this.filterParmas = tmp;
        }
    }

}
