import { HttpParams } from '@angular/common/http';

import { ITableState, ISortQuery } from 'app/common/interfaces';
import { FilterValue } from 'app/components/filter-constellation/interfaces/filter-value';
import { FieldType } from 'app/common/enums';
import { Constants } from 'app/common/constants';
import { Keys } from 'app/common/keys';

import * as _ from 'lodash';
import * as moment from 'moment';


export class CustomHttpParams extends HttpParams {

    set(param: string, value: string): CustomHttpParams {
        const httpParams = super.set(param, value);
        httpParams['generateIdsToSkip'] = this.generateIdsToSkip;
        httpParams['generateIdsToExclude'] = this.generateIdsToExclude;
        httpParams['generateIdsToInclude'] = this.generateIdsToInclude;
        httpParams['generateFields'] = this.generateFields;
        httpParams['generateIncludes'] = this.generateIncludes;
        httpParams['generateSort'] = this.generateSort;
        httpParams['generateOrder'] = this.generateOrder;
        httpParams['generateFilter'] = this.generateFilter;
        httpParams['set'] = this.set;
        return httpParams as CustomHttpParams;
    }

    public generateIdsToSkip(ids: number[] = []): CustomHttpParams {
        return this.set('idsToSkip', _.join(ids, ','));
    }

    public generateIdsToExclude(ids: number[] = []): CustomHttpParams {
        return this.set('excludedIds', _.join(ids, ','));
    }

    public generateIdsToInclude(ids: number[] = []): CustomHttpParams {
        return this.set('includedIds', _.join(ids, ','));
    }

    public generateFields(fields: string[] = []): CustomHttpParams {
        return this.set('fields', fields.join(','));
    }

    public generateIncludes(includes: string[] = []): CustomHttpParams {
        return this.set('includes', includes.join(','));
    }

    public generateSort(tableState: ITableState): CustomHttpParams {
        if (tableState && tableState.sortState) {
            return this.set('sort', `${(tableState.sortState.direction === 'asc' ? '' : '-') + tableState.sortState.active}`);
        } else {
            return this;
        }
    }

    public generateOrder(orders: ISortQuery[]): CustomHttpParams {
        const sortFields: string[] = [];
        orders.forEach(order => {
            sortFields.push(`${order.direction === 'ASC' ? '' : '-'}${order.field}`)
        });
        return this.set('sort', sortFields.join(','));
    }

    public generateFilters(filterValues: FilterValue[]): CustomHttpParams {
        let self: CustomHttpParams = this;
        for (const filter of filterValues) {
            self = self.generateFilter(filter);
        }
        return self;
    }

    public generateFilter(filterValue: FilterValue): CustomHttpParams {
        if (filterValue.id === Keys.enquiryDateRange) {
            const startDate = filterValue.value.startDate
                ? moment(filterValue.value.startDate, filterValue.value.format).utc().format() : '';
            const endDate = filterValue.value.endDate
                ? moment(filterValue.value.endDate, filterValue.value.format).endOf('day').utc().format() : '';
            return this.set(filterValue.id, `${startDate}_${endDate}`);
        } else {
            // ~ informs to backend that this value is string.
            return this.set(`${filterValue.id}${filterValue.type === FieldType.Dropdown ? '' : '~'}`,
                `${_.isArray(filterValue.value)
                    ? _.join(filterValue.value, ',')
                    : (filterValue.value !== null ? filterValue.value : '')}`);
        }
    }

}
