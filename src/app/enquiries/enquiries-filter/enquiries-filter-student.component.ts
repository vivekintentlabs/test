import { Component } from '@angular/core';
import { EnquiriesFilterService } from './enquiries-filter.service';
import { ListenerService } from 'app/services/listener.service';
import { BaseEnquiriesFilter } from './base-enquiries-filter';
import { FieldType, HasAlumni } from 'app/common/enums';
import { FilterOptions } from 'app/common/interfaces';
import { AppFilter } from 'app/entities/app-filter';
import { T } from 'app/common/t';
import { Keys } from 'app/common/keys';


@Component({
    selector: 'app-enquiries-filter-student',
    templateUrl: 'enquiries-filter.component.html',
    styleUrls: ['./enquiries-filter.component.scss'],
    providers: [EnquiriesFilterService]
})
export class EnquiriesFilterStudentComponent extends BaseEnquiriesFilter {

    constructor(
        enquiriesFilterService: EnquiriesFilterService,
        listenerService: ListenerService
    ) {
        super(enquiriesFilterService, listenerService);
    }

    initFilter(filterOptions: FilterOptions) {
        let tmp = null;
        tmp = [
            { id: HasAlumni.Yes, value: HasAlumni.Yes },
            { id: HasAlumni.No, value: HasAlumni.No },
            { id: HasAlumni.Unknown, value: HasAlumni.Unknown },
        ]
        const contactAlumniFiler = new AppFilter(Keys.bfContactAlumniId, T.alumni, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, false), T.contact);
        super.initFilter(filterOptions, { contactAlumniFiler });
    }

}
