import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';

import { FieldType, list_id } from 'app/common/enums';
import { Keys } from 'app/common/keys';
import { T } from 'app/common/t';

import { Contact } from 'app/entities/contact';
import { AppFilter } from 'app/entities/app-filter';
import { ContactRelationship } from 'app/entities/contact-relationship';
import { ListItem } from 'app/entities/list-item';
import { YearLevel } from 'app/entities/year-level';
import { School } from 'app/entities/school';

import { FilterValue } from 'app/components/filter-constellation/interfaces/filter-value';
import { ContactFilter, FilteredContactsOutput } from './contact-filter';

import * as _ from 'lodash';
import * as moment from 'moment';


@Component({
    selector: 'app-contact-filter',
    templateUrl: './contact-filter.component.html',
    styleUrls: ['./contact-filter.component.scss']
})
export class ContactFilterComponent implements OnChanges {
    filterName = 'contactFilter';

    @Input() contacts: Contact[];
    @Input() values: FilterValue[];
    @Input() useLocalStorage = true;
    @Input() school: School;
    @Output() filtered: EventEmitter<FilteredContactsOutput> = new EventEmitter<FilteredContactsOutput>();
    @Output() filteredValues: EventEmitter<FilterValue[]> = new EventEmitter<FilterValue[]>();
    @Output() resetSearchText = new EventEmitter();

    filters: AppFilter[];

    filterController: ContactFilter;
    studentStatuses = [];

    constructor() {
        this.filterController = new ContactFilter();
    }

    ngOnChanges() {
        this.initFilter();
    }

    private initFilter() {
        this.filters = [];
        this.filters.push(new AppFilter(Keys.enquiryDateRange, T.date_created, FieldType.DateRange, true, true, false,
            null, T.contact));
        let tmp = null;

        tmp = [];
        _.forEach(this.contacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                if (cr.student.startingYear) {
                    tmp.push({ id: cr.student.startingYear, value: cr.student.startingYear, sequence: cr.student.startingYear });
                }
            });
        });
        this.filters.push(new AppFilter(Keys.studentStartingYear, T.starting_year, FieldType.Dropdown, true, true, true,
            this.getFilterOptions(tmp, true), T.student));

        tmp = [];
        _.forEach(this.contacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                if (cr.student.schoolIntakeYear) {
                    tmp.push(this.getFilterOptionObject(cr.student.schoolIntakeYear));
                }
            });
        });
        this.filters.push(new AppFilter(Keys.studentSchoolIntakeYearId, T.intake_year_level, FieldType.Dropdown, true, true, true,
            this.getFilterOptions(tmp, true), T.student));

        tmp = [];
        _.forEach(this.contacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                if (cr.student.studentStatus && cr.student.studentStatus.stage) {
                    tmp.push(this.getFilterOptionObject(cr.student.studentStatus.stage));
                }
            });
        });
        this.filters.push(new AppFilter(Keys.studentStageId, T.stage, FieldType.Dropdown, true, true, true,
            this.getFilterOptions(tmp), T.student));

        _.forEach(this.contacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                if (cr.student.studentStatus) {
                    this.studentStatuses.push({
                        id: cr.student.studentStatusId,
                        value: cr.student.studentStatus.status,
                        sequence: cr.student.studentStatus.sequence,
                        stageId: cr.student.studentStatus.stageId
                    });
                }
            });
        });

        this.filters.push(new AppFilter(Keys.studentStudentStatusId, T.status, FieldType.Dropdown, true, true, true,
            [], T.student));

        tmp = this.getFilterOptionsForBoolean();
        this.filters.push(new AppFilter(Keys.studentMarkRecord, T.student_flagged, FieldType.Dropdown, false, false, false,
            this.getFilterOptions(tmp), T.student));

        this.filters.push(new AppFilter(Keys.studentLastName, T.student_last_name, FieldType.Text, false, false, false,
            null, T.student));

        tmp = [];
        _.forEach(this.contacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                if (cr.student.financialAid) {
                    tmp.push(this.getFilterOptionObject(cr.student.financialAid));
                }
            });
        });
        this.filters.push(new AppFilter(Keys.studentFinancialAidId, T.student_financial_aid, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.student));

        tmp = [];
        _.forEach(this.contacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                if (cr.student.gender) {
                    tmp.push(this.getFilterOptionObject(cr.student.gender));
                }
            });
        });
        this.filters.push(new AppFilter(Keys.studentGenderId, T.student_gender, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.student));

        tmp = null;
        tmp = _.map(moment.months(), (month: string, index: number) => ({ id: ++index, value: month, sequence: index }));
        this.filters.push(new AppFilter(Keys.birthMonth, T.birth_month, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.student));

        tmp = [];
        _.forEach(this.contacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                if (cr.student.siblingsId) {
                    tmp.push(this.getFilterOptionObject(cr.student.siblings));
                }
            });
        });
        this.filters.push(new AppFilter(Keys.studentSiblingsId, T.student_sibling, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.student));

        tmp = [];
        _.forEach(this.contacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                if (cr.student.religionId) {
                    tmp.push(this.getFilterOptionObject(cr.student.religion));
                }
            });
        });
        this.filters.push(new AppFilter(Keys.studentReligionId, T.student_religion, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.student));

        if (this.school && this.school.isBoardingEnabled) {
            tmp = [];
            _.forEach(this.contacts, (contact: Contact) => {
                _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                    if (cr.student.boardingType) {
                        tmp.push(this.getFilterOptionObject(cr.student.boardingType));
                    }
                });
            });
            this.filters.push(new AppFilter(Keys.studentBoardingTypeId, T.student_type, FieldType.Dropdown, false, false, true,
                this.getFilterOptions(tmp, true), T.student));
        }

        if (this.school && this.school.hasInternationals) {
            tmp = this.getFilterOptionsForBoolean();
            this.filters.push(new AppFilter(Keys.studentIsInternational, T.international_student, FieldType.Dropdown, false, false, false,
                this.getFilterOptions(tmp), T.student));

            tmp = [];
            _.forEach(this.contacts, (contact: Contact) => {
                _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                    const country = cr.student.countryOfOrigin;
                    if (country) {
                        tmp.push({ id: country.id, value: country.name, sequence: country.id });
                    }
                });
            });
            this.filters.push(new AppFilter(Keys.countryOfOriginId, T.countryOfOrigin, FieldType.Dropdown,
                false, false, true, this.getFilterOptions(tmp, true), T.student));
        }

        tmp = this.getFilterOptionsForBoolean();
        this.filters.push(new AppFilter(Keys.studentIsExported, T.student_exported_to_sms, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp), T.student));

        tmp = [];
        _.forEach(this.contacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                _.forEach(cr.student.all, item => {
                    if (item.listId === list_id.other_interest) {
                        tmp.push(this.getFilterOptionObject(item));
                    }
                });
            });
        });
        this.filters.push(new AppFilter(Keys.studentOtherInterests, T.student_other_interests, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.student));

        tmp = this.getFilterOptionsForBoolean();
        this.filters.push(new AppFilter(Keys.studentHasSpecialNeeds, T.student_has_special_needs, FieldType.Dropdown, false, false, false,
            this.getFilterOptions(tmp, true), T.student));

        tmp = [];
        _.forEach(this.contacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                _.forEach(cr.student.specialNeeds, specialNeed => {
                    tmp.push(this.getFilterOptionObject(specialNeed));
                });
            });
        });
        this.filters.push(new AppFilter(Keys.studentSpecialNeedsId, T.student_special_needs, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.student));


        // Current school filters
        tmp = [];
        _.forEach(this.contacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                if (cr.student.currentSchool) {
                    tmp.push({
                        id: cr.student.currentSchool.id, value: cr.student.currentSchool.schoolName, sequence: cr.student.currentSchool.id
                    });
                }
            });
        });
        this.filters.push(new AppFilter(Keys.studentCurrentSchoolId, T.current_school, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.current_school));

        tmp = [];
        _.forEach(this.contacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                const status = (cr.student.currentSchool && cr.student.currentSchool.status) ? cr.student.currentSchool.status : null;
                if (status) {
                    tmp.push(this.getFilterOptionObject(status));
                }
            });
        });
        this.filters.push(new AppFilter(Keys.studentCurrentSchoolStatusId, T.current_school_status, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.current_school));

        tmp = [];
        _.forEach(this.contacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                const classification = (cr.student.currentSchool && cr.student.currentSchool.classification)
                    ? cr.student.currentSchool.classification : null;
                if (classification) {
                    tmp.push(this.getFilterOptionObject(classification));
                }
            });
        });
        this.filters.push(new AppFilter(Keys.studentCurrentSchoolClassificationId, T.current_school_classification,
            FieldType.Dropdown, false, false, true, this.getFilterOptions(tmp, true), T.current_school));


        // Contact filters
        tmp = [];
        _.forEach(this.contacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                if (cr.contactType) {
                    tmp.push(this.getFilterOptionObject(cr.contactType));
                }
            });
        });
        this.filters.push(new AppFilter(Keys.contactTypeId, T.contact_type, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp), T.contact));

        this.filters.push(new AppFilter(Keys.contactLastName, T.contact_last_name, FieldType.Text, false, false, false, null, T.contact));
        this.filters.push(new AppFilter(Keys.contactAddress, T.contact_address, FieldType.Text, false, false, false, null, T.contact));
        this.filters.push(new AppFilter(Keys.contactCity, T.contact_city, FieldType.Text, false, false, false, null, T.contact));

        tmp = [];
        tmp = _(this.contacts).filter((c) => !!(c.administrativeArea)).map((c: Contact) => ({
            id: c.administrativeAreaId, value: c.administrativeArea.name, sequence: c.administrativeAreaId
        })).value();
        this.filters.push(new AppFilter(Keys.contactState, T.contact_state, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.contact));

        tmp = [];
        tmp = _(this.contacts).filter(c => c.country !== null).map((c: Contact) => ({
            id: c.countryId, value: c.country.name, sequence: c.countryId
        })).value();
        this.filters.push(new AppFilter(Keys.contactCountry, T.contact_country, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.contact));

        this.filters.push(new AppFilter(Keys.contactMobile, T.contact_mobile, FieldType.Text, false, false, false, null, T.contact));
        this.filters.push(new AppFilter(Keys.contactHomePhone, T.contact_home_phone, FieldType.Text, false, false, false, null, T.contact));
        this.filters.push(new AppFilter(Keys.contactWorkPhone, T.contact_work_phone, FieldType.Text, false, false, false, null, T.contact));
        tmp = [];
        tmp = _(this.contacts).filter((c) => !!(c.alumni)).map((c: Contact) => ({
            id: c.alumniId, value: c.alumni.name, sequence: c.alumni.sequence
        })).value();
        this.filters.push(new AppFilter(Keys.contactAlumniId, T.alumni, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.contact));

        // Activity
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

        tmp = [];
        _.forEach(this.contacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                _.forEach(cr.student.activityLogs, (al) => {
                    tmp.push(this.getFilterOptionObject(al.activity));
                });
            });
        });
        this.filters.push(new AppFilter(Keys.studentActivityId, T.activity, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp), T.activity));

        tmp = [];
        _.forEach(this.contacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                if (cr.student.leadSource) {
                    tmp.push(this.getFilterOptionObject(cr.student.leadSource));
                }
            });
        });
        this.filters.push(new AppFilter(Keys.studentLeadSourceId, T.lead_source, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.activity));

        tmp = [];
        _.forEach(this.contacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (cr: ContactRelationship) => {
                if (cr.student.hearAboutUs) {
                    tmp.push(this.getFilterOptionObject(cr.student.hearAboutUs));
                }
            });
        });
        this.filters.push(new AppFilter(Keys.studentHearAboutUsId, T.hear_about_us, FieldType.Dropdown, false, false, true,
            this.getFilterOptions(tmp, true), T.activity));

        tmp = undefined;
    }

    private getFilterOptionsForBoolean() {
        return [
            { id: true, value: 'Yes', sequence: 0 },
            { id: false, value: 'No', sequence: 1 }
        ];
    }

    private getFilterOptionObject(listItem: ListItem | YearLevel) {
        return { id: listItem.id, value: listItem.name, sequence: listItem.sequence };
    }

    private getFilterOptions(filterOptions: Array<any>, addUnknown = false, addAll = false) {
        const all = _.orderBy(_.uniqBy(filterOptions, 'id'), ['sequence'], ['asc']);
        if (addUnknown) {
            all.push({ id: 0, value: T.unknown });
        }
        if (addAll) {
            all.unshift({ id: null, value: 'All' });
        }
        return all;
    }

    filterIsChanged(filterValues: FilterValue[]) {
        this.values = filterValues;
        const filteredContacts = this.filterController.filter(this.contacts, this.values);
        for (const filter of filterValues) {
            if (filter.id === Keys.studentStageId) {
                this.filterStudentStatus(filter);
            }
        }
        this.filtered.emit(filteredContacts);
        this.filteredValues.emit(filterValues);
    }

    private filterStudentStatus(filter: FilterValue) {
        const res = _.filter(this.studentStatuses, (v) => _.includes(filter.value, v.stageId));
        const tmp: any = _.map(res, s => ({ id: s.id, value: s.value, sequence: s.sequence }));
        const options = this.getFilterOptions(tmp, false);
        this.filters[this.filters.findIndex(f => f.id === Keys.studentStudentStatusId)].options = options;
    }

}
