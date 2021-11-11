import { Component } from '@angular/core';
import { FieldType, list_id } from 'app/common/enums';
import { FilterOptions } from 'app/common/interfaces';
import { Keys } from 'app/common/keys';
import { T } from 'app/common/t';
import { AppFilter } from 'app/entities/app-filter';
import { ListenerService } from 'app/services/listener.service';
import * as _ from 'lodash';
import { BaseEnquiriesFilter } from './base-enquiries-filter';
import { EnquiriesFilterService } from './enquiries-filter.service';

@Component({
    selector: 'app-enquiries-filter-contact',
    templateUrl: 'enquiries-filter.component.html',
    styleUrls: ['./enquiries-filter.component.scss'],
    providers: [EnquiriesFilterService]
})
export class EnquiriesFilterContactComponent extends BaseEnquiriesFilter {

    constructor(
        enquiriesFilterService: EnquiriesFilterService,
        listenerService: ListenerService
    ) {
        super(enquiriesFilterService, listenerService);
    }

    initFilter(filterOptions: FilterOptions) {
        let tmp = null;
        tmp = _(filterOptions.listItems).filter(li => li.listId === list_id.alumni).map(li => this.getFilterOptionObject(li)).value();
        const contactAlumniFiler = new AppFilter(Keys.bfContactAlumniId, T.alumni, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.contact);
        super.initFilter(filterOptions, { contactAlumniFiler });
    }

}
