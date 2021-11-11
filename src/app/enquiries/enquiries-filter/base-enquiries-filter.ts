import { Input, Output, OnInit, EventEmitter, OnDestroy, Directive } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { EnquiriesFilterService } from './enquiries-filter.service';
import { ListenerService } from 'app/services/listener.service';

import { FieldType, HasAlumni, list_id } from 'app/common/enums';
import { Keys } from 'app/common/keys';
import { T } from 'app/common/t';
import { Utils } from 'app/common/utils';

import { AppFilter } from 'app/entities/app-filter';
import { ListItem } from 'app/entities/list-item';
import { School } from 'app/entities/school';
import { YearLevel } from 'app/entities/year-level';

import { FilterOptions } from 'app/common/interfaces';

import { FilterValue } from 'app/components/filter-constellation/interfaces/filter-value';

import * as _ from 'lodash';
import * as moment from 'moment';

@Directive()
export abstract class BaseEnquiriesFilter implements OnInit, OnDestroy {
    @Input() filterName: string;
    @Input() values: FilterValue[];
    @Input() useLocalStorage: boolean;
    @Input() school: School;
    @Output() onValuesChange = new EventEmitter<FilterValue[]>();
    @Output() resetSearchText = new EventEmitter();

    filters: AppFilter[];
    filterOptions: FilterOptions;
    subscribe = new Subject();

    constructor(
        private enquiriesFilterService: EnquiriesFilterService,
        private listenerService: ListenerService
    ) {
        this.listenerService.campusListStatus().pipe(takeUntil(this.subscribe)).subscribe(() => {
            this.campusChanged();
        });
    }

    ngOnInit() {
        this.enquiriesFilterService.getFilterOptions().then((filterOptions: FilterOptions) => {
            this.filterOptions = filterOptions;
            this.initFilter(filterOptions);
        });
    }

    protected initFilter(filterOptions: FilterOptions, specificFilters?: any) {
        this.filters = [];
        this.filters.push(new AppFilter(Keys.enquiryDateRange, T.date_created, FieldType.DateRange, true, true, false,
            null, T.student));

        let tmp = null;
        tmp = _.map(filterOptions.startingYears, sy => ({ id: sy, value: sy, sequence: sy }));
        this.filters.push(new AppFilter(Keys.startingYear, T.starting_year, FieldType.Dropdown, true, true, true,
            this.getFilterOptions(tmp, true), T.student));

        tmp = _.map(filterOptions.yearLevels.getAvailableSchoolYearLevelsByCampus(Utils.getUserInfoFromToken().campusId), yl => this.getFilterOptionObject(yl));
        this.filters.push(new AppFilter(Keys.schoolIntakeYearId, T.intake_year_level, FieldType.Dropdown, true, true, true,
            this.getFilterOptions(tmp, true), T.student));

        tmp = _(filterOptions.listItems).filter(li => li.listId === list_id.stage).map(li => this.getFilterOptionObject(li)).value();
        this.filters.push(new AppFilter(Keys.stageId, T.stage, FieldType.Dropdown, true, true, true,
            this.getFilterOptions(tmp), T.student));

        tmp = _.map(filterOptions.studentStatuses, s => ({ id: s.id, value: s.status, sequence: s.sequence }));
        this.filters.push(new AppFilter(Keys.studentStatusId, T.status, FieldType.Dropdown, true, true, true,
            [], T.student));

        // Student filters
        tmp = this.getFilterOptionsForBoolean();
        this.filters.push(new AppFilter(Keys.markRecord, T.student_flagged, FieldType.Dropdown, false, false, false,
            this.getFilterOptions(tmp), T.student));

        this.filters.push(new AppFilter(Keys.bfStudentLastName, T.student_last_name, FieldType.Text, false, false, false, null, T.student));

        tmp = _(filterOptions.listItems).filter(li => li.listId === list_id.financial_aid).map(li => (
            this.getFilterOptionObject(li))).value();
        this.filters.push(new AppFilter(Keys.financialAidId, T.student_financial_aid, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.student));

        tmp = _(filterOptions.listItems).filter(li => li.listId === list_id.genders).map(li => this.getFilterOptionObject(li)).value();
        this.filters.push(new AppFilter(Keys.genderId, T.student_gender, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.student));

        tmp = _.map(moment.months(), (month: string, index: number) => ({ id: ++index, value: month, sequence: index }));
        this.filters.push(new AppFilter(Keys.birthMonth, T.birth_month, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.student));

        tmp = _(filterOptions.listItems).filter(li => li.listId === list_id.siblings).map(li => (
            this.getFilterOptionObject(li))).value();
        this.filters.push(new AppFilter(Keys.siblingsId, T.student_sibling, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.student));

        tmp = _(filterOptions.listItems).filter(li => li.listId === list_id.religion).map(li => (
            this.getFilterOptionObject(li))).value();
        this.filters.push(new AppFilter(Keys.religionId, T.student_religion, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.student));

        if (this.school.isBoardingEnabled) {
            tmp = _(filterOptions.listItems).filter(li => li.listId === list_id.boarding_type).map(li => (
                this.getFilterOptionObject(li))).value();
            this.filters.push(new AppFilter(Keys.boardingTypeId, T.student_type, FieldType.Dropdown, false, false, true,
                this.getFilterOptions(tmp, true), T.student));
        }

        if (this.school.hasInternationals) {
            tmp = this.getFilterOptionsForBoolean();
            this.filters.push(new AppFilter(Keys.isInternational, T.international_student, FieldType.Dropdown, false, false, false,
                this.getFilterOptions(tmp), T.student));

            tmp = _.map(filterOptions.countries, c => ({ id: c.id, value: c.name, sequence: c.name }));
            this.filters.push(new AppFilter(Keys.countryOfOriginId, T.countryOfOrigin, FieldType.Dropdown,
                false, false, true, this.getFilterOptions(tmp, true), T.student));
        }

        tmp = this.getFilterOptionsForBoolean();
        this.filters.push(new AppFilter(Keys.isExported, T.student_exported_to_sms, FieldType.Dropdown, false, false, false,
            this.getFilterOptions(tmp), T.student));

        tmp = _(filterOptions.listItems).filter(li => li.listId === list_id.other_interest).map(li =>
            this.getFilterOptionObject(li)).value();
        this.filters.push(new AppFilter(Keys.otherInterestId, T.student_other_interests, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.student));

        tmp = this.getFilterOptionsForBoolean();
        this.filters.push(new AppFilter(Keys.hasSpecialNeeds, T.student_has_special_needs, FieldType.Dropdown, false, false, false,
            this.getFilterOptions(tmp, true), T.student));

        tmp = _(filterOptions.listItems)
            .filter(li => li.listId === list_id.special_need).map(li => this.getFilterOptionObject(li)).value();
        this.filters.push(new AppFilter(Keys.specialNeedsId, T.student_special_needs, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.student));


        // Current School filters
        tmp = null;
        tmp = _.map(filterOptions.currentSchools, cs => ({ id: cs.id, value: cs.schoolName, sequence: cs.id }));
        this.filters.push(new AppFilter(Keys.bfCurrentSchoolId, T.current_school, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.current_school));

        tmp = _(filterOptions.listItems).filter(li => li.listId === list_id.school_category).map(li => this.getFilterOptionObject(li)).value();
        this.filters.push(new AppFilter(Keys.bfCurrentSchoolStatusId, T.current_school_status, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.current_school));

        tmp = _(filterOptions.listItems).filter(li => li.listId === list_id.classification).map(li =>
            this.getFilterOptionObject(li)).value();

        this.filters.push(new AppFilter(Keys.bfCurrentSchoolClassificationId, T.current_school_classification,
            FieldType.Dropdown, false, false, true, this.getFilterOptions(tmp, true), T.current_school));


        // Contact filters
        tmp = _(filterOptions.listItems).filter(li => li.listId === list_id.contact_type).map(li =>
            this.getFilterOptionObject(li)).value();
        this.filters.push(new AppFilter(Keys.contactTypeId, T.contact_type, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp), T.contact));

        this.filters.push(new AppFilter(Keys.bfContactLastName, T.contact_last_name, FieldType.Text, false, false, false, null, T.contact));
        this.filters.push(new AppFilter(Keys.bfContactAddress, T.contact_address, FieldType.Text, false, false, false, null, T.contact));
        this.filters.push(new AppFilter(Keys.bfContactCity, T.contact_city, FieldType.Text, false, false, false, null, T.contact));

        tmp = _.map(filterOptions.administrativeAreas, s => ({ id: s.id, value: s.name, sequence: s.name }));
        this.filters.push(new AppFilter(Keys.bfContactStateId, T.contact_state, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.contact));

        tmp = _.map(filterOptions.countries, c => ({ id: c.id, value: c.name, sequence: c.name }));
        this.filters.push(new AppFilter(Keys.bfContactCountryId, T.contact_country, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.contact));

        this.filters.push(new AppFilter(Keys.bfContactMobile, T.contact_mobile, FieldType.Text, false, false, false, null, T.contact));
        this.filters.push(new AppFilter(Keys.bfContactHomePhone, T.contact_home_phone, FieldType.Text, false, false, false, null, T.contact));
        this.filters.push(new AppFilter(Keys.bfContactWorkPhone, T.contact_work_phone, FieldType.Text, false, false, false, null, T.contact));

        this.filters.push(specificFilters?.contactAlumniFiler);

        // ActivityLog filters
        tmp = [
            { id: Keys.isRegisteredEvent, value: T.registeredContacts, sequence: 0 },
            { id: Keys.isAttendedEvent, value: T.attendedContacts, sequence: 1 }
        ];
        this.filters.push(new AppFilter(Keys.event, T.event, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp), T.activity));

        tmp = [
            { id: Keys.isRegisteredPersonalTour, value: T.registeredContacts, sequence: 0 },
            { id: Keys.isAttendedPersonalTour, value: T.attendedContacts, sequence: 1 }
        ];
        this.filters.push(new AppFilter(Keys.personalTour, T.personalTour, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp), T.activity));

        tmp = _(filterOptions.listItems).filter(li => li.listId === list_id.activity).map(li => (
            this.getFilterOptionObject(li))).value();
        this.filters.push(new AppFilter(Keys.studentActivityId, T.activity, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.activity)); // added Unknown

        tmp = _(filterOptions.listItems).filter(li => li.listId === list_id.lead_source).map(li => (
            this.getFilterOptionObject(li))).value();
        this.filters.push(new AppFilter(Keys.leadSourceId, T.lead_source, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.activity));

        tmp = _(filterOptions.listItems).filter(li => li.listId === list_id.hear_about_us).map(li => (
            this.getFilterOptionObject(li))).value();
        this.filters.push(new AppFilter(Keys.hearAboutUsId, T.hear_about_us, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.activity));

        tmp = undefined;
    }

    getFilterOptionsForBoolean() {
        return [
            { id: true, value: 'Yes', sequence: 0 },
            { id: false, value: 'No', sequence: 1 }
        ];
    }

    getFilterOptionObject(listItem: ListItem | YearLevel) {
        return { id: listItem.id, value: listItem.name, sequence: listItem.sequence };
    }

    getFilterOptions(filterOptions: FilterValue[], addUnknown = false) {
        const all = _.orderBy(_.uniqBy(filterOptions, 'id'), ['sequence'], ['asc']);
        if (addUnknown) {
            all.push({ id: '0', value: T.unknown } as FilterValue);
        }
        return all;
    }

    filterIsChanged(filterValues: FilterValue[]) {
        for (const filter of filterValues) {
            if (filter.id === Keys.stageId) {
                this.filterStudentStatus(filter);
            }
        }
        this.onValuesChange.emit(filterValues);
    }

    private filterStudentStatus(filter: FilterValue) {
        const res = _.filter(this.filterOptions.studentStatuses, (v) => _.includes(filter.value, v.stageId));
        const tmp: any = _.map(res, s => ({ id: s.id, value: s.status, sequence: s.sequence }));
        const options = this.getFilterOptions(tmp, false);
        this.filters[this.filters.findIndex(f => f.id === Keys.studentStatusId)].options = options;
    }

    campusChanged() {
        const tmp: any = _.map(this.filterOptions.yearLevels.getAvailableSchoolYearLevelsByCampus(Utils.getUserInfoFromToken().campusId), yl => this.getFilterOptionObject(yl));
        const options = this.getFilterOptions(tmp, true);
        this.filters[this.filters.findIndex(f => f.id === Keys.schoolIntakeYearId)].options = options;
    }

    ngOnDestroy() {
        this.subscribe.next();
        this.subscribe.complete();
    }

}
