import { Injectable } from '@angular/core'

import { Keys } from 'app/common/keys';
import { T } from 'app/common/t';
import { FieldType } from 'app/common/enums';
import { IWidgetParams, IWidgetFilterParams } from 'app/common/interfaces';
import { Utils } from 'app/common/utils';

import { Student } from 'app/entities/student';
import { YearLevel } from 'app/entities/year-level';
import { AppFilter } from 'app/entities/app-filter';
import { ListItem } from 'app/entities/list-item';

import { FilterValue } from 'app/components/filter-constellation/interfaces/filter-value';

import { SchoolService } from 'app/state/school';

import * as _ from 'lodash'
import * as moment from 'moment';

@Injectable()
export class WidgetService {
    private allStudents: Student[];
    private yearLevels: YearLevel[];

    private filters: AppFilter[] = [];

    public defaultFilterValues;

    constructor(private schoolService: SchoolService) { }

    getFilterParams(params: IWidgetParams) {
        this.allStudents = params.students;
        this.yearLevels = params.yearLevels;
        this.filters = this.getFilters(params.students, params.filterFields);
        this.defaultFilterValues = this.getDefaultFilterValues(this.yearLevels);

        const filterParmas: IWidgetFilterParams = {
            uniqName: params.uniqName,
            filters: this.filters,
            values: this.defaultFilterValues,
            useLocalStorage: true
        };

        return filterParmas;
    }

    filterStudents(filterValues: FilterValue[]) {
        const students = _.cloneDeep(this.allStudents);

        if (filterValues.length > 0) {
            _.forEach(filterValues, filterValue => {
                const ids = _.map(filterValue.value, v => (v === 0) ? null : v);

                if (filterValue.id === Keys.startingYear && ids.length > 0) {
                    _.remove(students, s => !_.includes(ids, s.startingYear));
                }

                if (filterValue.id === Keys.schoolIntakeYearId && ids.length > 0) {
                    _.remove(students, s => !_.includes(ids, s.schoolIntakeYearId));
                }

                if (filterValue.id === Keys.studentStatusStageId && ids.length > 0) {
                    _.remove(students, s => !_.includes(ids, s.studentStatus.stageId));
                }

                if (filterValue.id === Keys.studentStatusId && ids.length > 0) {
                    _.remove(students, s => !_.includes(ids, s.studentStatusId));
                }
            });
        }
        return students;
    }

    private getDefaultFilterValues(yearLevels: YearLevel[]) {
        const values: FilterValue[] = [];

        const nextYear = Utils.getNextStartingYear(this.schoolService.getStartingMonth());
        const startingYearField = _.find(this.filters, f => f.id === Keys.startingYear);
        const startingYearOptions = _.map(startingYearField.options, f => +f.id);

        const userInfo = Utils.getUserInfoFromToken();
        const coreYearLevels = _.filter(yearLevels, yl => yl.isCore(userInfo.campusId));
        const yearLevelField = _.find(this.filters, f => f.id === Keys.schoolIntakeYearId);
        const yearLevelOptions = _.map(yearLevelField.options, f => +f.id);
        _.remove(coreYearLevels, cyl => !_.includes(yearLevelOptions, cyl.id));

        if (_.includes(startingYearOptions, nextYear)) {
            values.push({
                id: Keys.startingYear,
                value: [nextYear],
                textValues: [nextYear.toString()],
                multiple: true,
                type: 2
            });
        }
        values.push({
            id: Keys.schoolIntakeYearId,
            value: _.map(coreYearLevels, yl => yl.id),
            textValues: _.map(coreYearLevels, yl => yl.name),
            multiple: true,
            type: 2
        });
        return values;
    }

    private getFilters(students: Student[], fields: string[]) {
        const filters: AppFilter[] = [];
        let tmp = null;
        if (_.includes(fields, Keys.startingYear)) {
            tmp = _(students).filter(s => s.startingYear !== null).map(s => (
                { id: s.startingYear, value: s.startingYear, sequence: s.startingYear }
            )).value();
            filters.push(new AppFilter(Keys.startingYear, T.starting_year, FieldType.Dropdown, true, true, true,
                this.getFilterOptions(tmp, true), T.student, 3));
        }

        if (_.includes(fields, Keys.schoolIntakeYearId)) {
            tmp = _(students).filter(s => s.schoolIntakeYear !== null).map(s => (
                this.getFilterOptionObject(s.schoolIntakeYear)
            )).value();
            filters.push(new AppFilter(Keys.schoolIntakeYearId, T.intake_year_level, FieldType.Dropdown, true, true, true,
                this.getFilterOptions(tmp, true), T.student, 3));
        }

        if (_.includes(fields, Keys.studentStatusStageId)) {
            tmp = _(students).filter(s => s.studentStatus !== null && s.studentStatus.stage !== null).map(s => (
                this.getFilterOptionObject(s.studentStatus.stage)
            )).value();
            filters.push(new AppFilter(Keys.studentStatusStageId, T.stage, FieldType.Dropdown, true, true, true,
                this.getFilterOptions(tmp), T.student, 3));
        }

        if (_.includes(fields, Keys.studentStatusId)) {
            tmp = _(students).filter(s => s.studentStatus !== null).map(s => (
                { id: s.studentStatus.id, value: s.studentStatus.status, sequence: s.studentStatus.sequence }
            )).value();
            filters.push(new AppFilter(Keys.studentStatusId, T.status, FieldType.Dropdown, true, true, true,
                this.getFilterOptions(tmp), T.student, 3));
        }

        return filters;
    }

    private getFilterOptionObject(listItem: ListItem | YearLevel) {
        return { id: listItem.id, value: listItem.name, sequence: listItem.sequence }
    }

    private getFilterOptions(filterOptions: any[], addUnknown = false, addAll = false) {
        const all = _.orderBy(_.uniqBy(filterOptions, 'id'), ['sequence'], ['asc']);
        if (addUnknown) {
            all.push({ id: 0, value: T.unknown });
        }
        if (addAll) {
            all.unshift({ id: null, value: 'All' });
        }
        return all;
    }

}
