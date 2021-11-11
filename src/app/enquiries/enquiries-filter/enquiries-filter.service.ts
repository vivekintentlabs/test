import { Injectable } from '@angular/core';

import { HttpService } from 'app/services/http.service';

import { FilterOptions } from 'app/common/interfaces';
import { list_id, FieldType } from 'app/common/enums';

import { Country } from 'app/entities/country';
import { ListItem } from 'app/entities/list-item';
import { YearLevel } from 'app/entities/year-level';
import { StudentStatus } from 'app/entities/student-status';
import { CurrentSchool } from 'app/entities/current-school';
import { CustomHttpParams } from 'app/entities/custom-http-params';
import { YearLevelList } from 'app/entities/year-level-list';

import * as _ from 'lodash';

@Injectable()
export class EnquiriesFilterService {

    constructor(private httpService: HttpService) { }

    getFilterOptions(): Promise<FilterOptions> {
        const filterOptions = new FilterOptions();
        const params = this.getListItemParams();
        return Promise.all([
            this.httpService.getAuth('starting-years').then((res: number[]) => filterOptions.startingYears = res),
            this.httpService.getAuth(`list-items?${params.toString()}`).then((res: ListItem[]) => filterOptions.listItems = res),
            this.httpService.getAuth('year-level').then((res: { yearLevels: YearLevel[] }) => filterOptions.yearLevels = new YearLevelList(res.yearLevels)),
            this.httpService.getAuth('student-status/simple').then((res: StudentStatus[]) => filterOptions.studentStatuses = res),
            this.httpService.getAuth('current-school/simple').then((res: CurrentSchool[]) => filterOptions.currentSchools = res),
            this.httpService.get('country').then((res: Country[]) => filterOptions.countries = res),
            this.httpService.get('country/countries-with-administrative-areas').then((res: Country[]) => {
                _.forEach(res, c => {
                    filterOptions.administrativeAreas.push(...c.administrativeAreas);
                });
            }),
        ]).then(() => filterOptions);
    }

    getListItemParams(): CustomHttpParams {
        const listIds: number[] = [
            list_id.other_interest,
            list_id.special_need,
            list_id.genders,
            list_id.alumni,
            list_id.siblings,
            list_id.religion,
            list_id.lead_source,
            list_id.hear_about_us,
            list_id.financial_aid,
            list_id.stage,
            list_id.boarding_type,
            list_id.activity,
            list_id.contact_type,
            list_id.school_category,
            list_id.classification
        ];
        const params: CustomHttpParams = new CustomHttpParams()
            .generateFilter({ id: 'listId', value: listIds.join(','), type: FieldType.Dropdown })
            .generateOrder([{ field: 'listId', direction: 'ASC' }, { field: 'sequence', direction: 'ASC' }]);
        return params;
    }


}
