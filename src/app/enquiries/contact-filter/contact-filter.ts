import { Contact } from 'app/entities/contact';
import { FilterValue } from 'app/components/filter-constellation/interfaces/filter-value';
import { Keys } from 'app/common/keys';
import { list_id } from 'app/common/enums';
import { Constants } from 'app/common/constants';

import * as moment from 'moment';
import * as _ from 'lodash';

type filterFP = (contacts: Contact[], filterValue: FilterValue) => Contact[];

export interface FilteredContactsOutput {
    filteredContacts: Contact[];
    allFilteredContacts: Contact[];
}

export class ContactFilter {
    private filterValues: Map<string, filterFP> = new Map<string, filterFP>();

    constructor() {
        this.filterValues.set(Keys.enquiryDateRange, this.filterByDateRange.bind(this));
        this.filterValues.set(Keys.studentStartingYear, this.filterByStudentStartingYear.bind(this));
        this.filterValues.set(Keys.studentSchoolIntakeYearId, this.filterByStudentSchoolIntakeYearId.bind(this));
        this.filterValues.set(Keys.studentStageId, this.filterByStudentStage.bind(this));
        this.filterValues.set(Keys.studentStudentStatusId, this.filterByStudentStatusId.bind(this));

        // Student
        this.filterValues.set(Keys.studentMarkRecord, this.filterByStudentMarkRecord.bind(this));
        this.filterValues.set(Keys.studentLastName, this.filterByStudentLastName.bind(this));
        this.filterValues.set(Keys.studentFinancialAidId, this.filterByStudentFinancialAidId.bind(this));
        this.filterValues.set(Keys.studentGenderId, this.filterByStudentGenderId.bind(this));
        this.filterValues.set(Keys.birthMonth, this.filterByMonthOfBirth.bind(this));
        this.filterValues.set(Keys.studentSiblingsId, this.filterByStudentSiblingsId.bind(this));
        this.filterValues.set(Keys.studentReligionId, this.filterByStudentReligionId.bind(this));
        this.filterValues.set(Keys.studentBoardingTypeId, this.filterByStudentBoardingTypeId.bind(this));
        this.filterValues.set(Keys.studentIsInternational, this.filterByStudentIsInternational.bind(this));
        this.filterValues.set(Keys.countryOfOriginId, this.filterByStudentCountryOfOriginId.bind(this));
        this.filterValues.set(Keys.studentIsExported, this.filterByStudentIsExported.bind(this));
        this.filterValues.set(Keys.studentOtherInterests, this.filterByStudentOtherInterests.bind(this));
        this.filterValues.set(Keys.studentHasSpecialNeeds, this.filterByStudentHasSpecialNeeds.bind(this));
        this.filterValues.set(Keys.studentSpecialNeedsId, this.filterByStudentSpecialNeedsId.bind(this));

        // Current School
        this.filterValues.set(Keys.studentCurrentSchoolId, this.filterByStudentCurrentSchool.bind(this));
        this.filterValues.set(Keys.studentCurrentSchoolStatusId, this.filterByStudentCurrentSchoolStatusId.bind(this));
        this.filterValues.set(Keys.studentCurrentSchoolClassificationId, this.filterByStudentCurrentSchoolClassificationId.bind(this));

        // Contact
        this.filterValues.set(Keys.contactTypeId, this.filterByContactTypeId.bind(this));
        this.filterValues.set(Keys.contactLastName, this.filterByContactLastName.bind(this));
        this.filterValues.set(Keys.contactAddress, this.filterByContactAddress.bind(this));
        this.filterValues.set(Keys.contactCity, this.filterByContactCity.bind(this));
        this.filterValues.set(Keys.contactState, this.filterByContactState.bind(this));
        this.filterValues.set(Keys.contactCountry, this.filterByContactCountry.bind(this));
        this.filterValues.set(Keys.contactMobile, this.filterByContactMobile.bind(this));
        this.filterValues.set(Keys.contactHomePhone, this.filterByContactPhone.bind(this));
        this.filterValues.set(Keys.contactWorkPhone, this.filterByContactWorkPhone.bind(this));
        this.filterValues.set(Keys.contactAlumniId, this.filterByContactAlumni.bind(this));
        // this.filterValues.set(Keys.relationshipTypeId, this.filterByRelationshipTypeId.bind(this));

        // Activity
        this.filterValues.set(Keys.event, this.filterByEvent.bind(this));
        this.filterValues.set(Keys.personalTour, this.filterByPersonalTour.bind(this));
        this.filterValues.set(Keys.studentActivityId, this.filterByStudentActivityId.bind(this));
        this.filterValues.set(Keys.studentLeadSourceId, this.filterByStudentLeadSourceId.bind(this));
        this.filterValues.set(Keys.studentHearAboutUsId, this.filterByStudentHearAboutUsId.bind(this));

        // this.filterValues.set(Keys.yearMonthOfBirth, this.filterByYearAndMonthOfBirth.bind(this));
    }

    public filter(contacts: Contact[], values: FilterValue[]): FilteredContactsOutput {
        const allFilteredContacts: Contact[] = _.cloneDeep(contacts);
        const filteredContacts: Contact[] = _.clone(allFilteredContacts);

        _.forEach(values, (value) => {
            this.filterValues.get(value.id)(filteredContacts, value);
        });
        return { filteredContacts: filteredContacts, allFilteredContacts: allFilteredContacts};
    }

    private filterByDateRange(contacts: Contact[], filterValue: FilterValue) {
        const format = Constants.dateFormats.dayMonthYear;
        _.remove(contacts, contact => {
            const enquiryDate = moment.utc(contact.createdAt);
            const startDate = moment(filterValue.value.startDate, format).utc();
            const endDate = moment(filterValue.value.endDate, format).utc().add(1, 'day');
            return Boolean(!enquiryDate.isBetween(startDate, endDate));
        });
    }

    private filterByStudentStartingYear(contacts: Contact[], filterValue: FilterValue) {
        this.stripContactsAndRelationships(contacts, filterValue);
    }

    private filterByStudentSchoolIntakeYearId(contacts: Contact[], filterValue: FilterValue) {
        this.stripContactsAndRelationships(contacts, filterValue);
    }

    private filterByContactTypeId(contacts: Contact[], filterValue: FilterValue) {
        this.stripContactsAndRelationships(contacts, filterValue);
    }

    private filterByContactLastName(contacts: Contact[], filterValue: FilterValue) {
        _.remove(contacts, contact => !this._includes(contact.lastName, filterValue.value));
    }

    private filterByContactAddress(contacts: Contact[], filterValue: FilterValue) {
        _.remove(contacts, contact => !this._includes(contact.address, filterValue.value));
    }

    private filterByContactCity(contacts: Contact[], filterValue: FilterValue) {
        _.remove(contacts, contact => !this._includes(contact.city, filterValue.value));
    }

    private filterByContactState(contacts: Contact[], filterValue: FilterValue) {
        const ids = _.map(filterValue.value, i => (i === 0) ? null : i);
        if (ids.length > 0) {
            _.remove(contacts, c => !_.includes(ids, c.administrativeAreaId));
        }
    }

    private filterByContactCountry(contacts: Contact[], filterValue: FilterValue) {
        const ids = _.map(filterValue.value, i => (i === 0) ? null : i);
        if (ids.length > 0) {
            _.remove(contacts, c => !_.includes(ids, c.countryId));
        }
    }

    private filterByContactMobile(contacts: Contact[], filterValue: FilterValue) {
        _.remove(contacts, contact => !this._includes(contact.mobile, filterValue.value));
    }

    private filterByContactPhone(contacts: Contact[], filterValue: FilterValue) {
        _.remove(contacts, contact => !this._includes(contact.homePhone, filterValue.value));
    }

    private filterByContactWorkPhone(contacts: Contact[], filterValue: FilterValue) {
        _.remove(contacts, contact => !this._includes(contact.workPhone, filterValue.value));
    }

    private filterByContactAlumni(contacts: Contact[], filterValue: FilterValue) {
        const ids = _.map(filterValue.value, i => (i === 0) ? null : i);
        if (ids.length > 0) {
            _.remove(contacts, c => !_.includes(ids, c.alumniId));
        }
    }

    private filterByStudentLastName(contacts: Contact[], filterValue: FilterValue) {
        _.remove(contacts, contact => {
            _.remove(contact.contactRelationships, cr => !this._includes(cr.student.lastName, filterValue.value));
            return (contact.contactRelationships.length > 0) ? false : true;
        });
    }

    private filterByStudentStage(contacts: Contact[], filterValue: FilterValue) {
        this.stripContactsAndRelationships(contacts, filterValue);
    }

    private filterByStudentStatusId(contacts: Contact[], filterValue: FilterValue) {
        this.stripContactsAndRelationships(contacts, filterValue);
    }

    private filterByStudentGenderId(contacts: Contact[], filterValue: FilterValue) {
        this.stripContactsAndRelationships(contacts, filterValue);
    }

    private filterByStudentFinancialAidId(contacts: Contact[], filterValue: FilterValue) {
        this.stripContactsAndRelationships(contacts, filterValue);
    }

    private filterByStudentReligionId(contacts: Contact[], filterValue: FilterValue) {
        this.stripContactsAndRelationships(contacts, filterValue);
    }

    private filterByStudentSiblingsId(contacts: Contact[], filterValue: FilterValue) {
        this.stripContactsAndRelationships(contacts, filterValue);
    }

    private filterByStudentIsExported(contacts: Contact[], filterValue: FilterValue) {
        this.stripContactsAndRelationships(contacts, filterValue, true);
    }

    private filterByStudentOtherInterests(contacts: Contact[], filterValue: FilterValue) {
        const ids = filterValue.value;
        if (!_.isEmpty(ids)) {
            _.remove(contacts, contact => {
                _.remove(contact.contactRelationships, cr => {
                    const interests = _.filter(cr.student.all, i => i.listId === list_id.other_interest);
                    if (_.includes(ids, 0) && _.isEmpty(interests)) {
                        return false;
                    }
                    return !_.find(interests, i => _.includes(ids, i.id));
                });
                return (contact.contactRelationships.length > 0) ? false : true;
            });
        }
    }

    private filterByStudentHasSpecialNeeds(contacts: Contact[], filterValue: FilterValue) {
        this.stripContactsAndRelationships(contacts, filterValue, true);
    }

    private filterByStudentSpecialNeedsId(contacts: Contact[], filterValue: FilterValue) {
        const ids = filterValue.value;
        if (!_.isEmpty(ids)) {
            _.remove(contacts, contact => {
                _.remove(contact.contactRelationships, cr => {
                    const specialNeeds = cr.student.specialNeeds;
                    if (_.includes(ids, 0) && _.isEmpty(specialNeeds)) {
                        return false;
                    }
                    return !_.find(specialNeeds, i => _.includes(ids, i.id));
                });
                return !contact.contactRelationships.length;
            });
        }
    }

    private filterByStudentMarkRecord(contacts: Contact[], filterValue: FilterValue) {
        this.stripContactsAndRelationships(contacts, filterValue, true);
    }

    // private filterByRelationshipTypeId(contacts: Contact[], filterValue: FilterValue) {
    //     this.stripContactsAndRelationships(contacts, filterValue);
    // }

    private filterByMonthOfBirth(contacts: Contact[], filterValue: FilterValue) {
        if (!_.isEmpty(filterValue.value)) {
            _.remove(contacts, contact => {
                _.remove(contact.contactRelationships, cr => (
                    !_.includes(filterValue.value, (cr.student.dateOfBirth) ? (moment(cr.student.dateOfBirth).month() + 1) : 0)
                ));
                return (contact.contactRelationships.length > 0) ? false : true;
            });
        }
    }

    // private filterByYearAndMonthOfBirth(contacts: Contact[], filterValue: FilterValue) {
    //     const date = moment(filterValue.value); // TODO: add check for empty
    //     if (date.isValid) {
    //         const startDate = date.startOf('month').format('YYYY-MM-DD');
    //         const endDate = date.endOf('month').add(1, 'day').format('YYYY-MM-DD');

    //         _.remove(contacts, contact => {
    //             _.remove(contact.contactRelationships, cr => {
    //                 const dateOfBirth = moment.utc(cr.student.dateOfBirth);
    //                 return Boolean(!dateOfBirth.isBetween(startDate, endDate));
    //             });
    //             return (contact.contactRelationships.length > 0) ? false : true;
    //         });
    //     }
    // }

    private filterByStudentCurrentSchool(contacts: Contact[], filterValue: FilterValue) {
        this.filterByCurrentSchoolChildren(contacts, filterValue);
    }

    private filterByStudentCurrentSchoolStatusId(contacts: Contact[], filterValue: FilterValue) {
        this.filterByCurrentSchoolChildren(contacts, filterValue);
    }

    private filterByStudentCurrentSchoolClassificationId(contacts: Contact[], filterValue: FilterValue) {
        this.filterByCurrentSchoolChildren(contacts, filterValue);
    }

    private filterByCurrentSchoolChildren(contacts: Contact[], filter: FilterValue) {
        const ids = filter.value;
        if (!_.isEmpty(ids)) {
            _.remove(contacts, contact => {
                _.remove(contact.contactRelationships, cr => {
                    if (_.includes(ids, 0) && !_.get(cr, filter.id)) {
                        return false;
                    }
                    return !_.includes(ids, _.get(cr, filter.id));
                });
                return (contact.contactRelationships.length > 0) ? false : true;
            });
        }
    }

    private filterByStudentLeadSourceId(contacts: Contact[], filterValue: FilterValue) {
        this.stripContactsAndRelationships(contacts, filterValue);
    }

    private filterByStudentHearAboutUsId(contacts: Contact[], filterValue: FilterValue) {
        this.stripContactsAndRelationships(contacts, filterValue);
    }

    private filterByStudentBoardingTypeId(contacts: Contact[], filterValue: FilterValue) {
        this.stripContactsAndRelationships(contacts, filterValue);
    }

    private filterByStudentIsInternational(contacts: Contact[], filterValue: FilterValue) {
        this.stripContactsAndRelationships(contacts, filterValue, true);
    }

    private filterByStudentCountryOfOriginId(contacts: Contact[], filterValue: FilterValue) {
        const ids = _.map(filterValue.value, i => (i === 0) ? null : i);
        if (ids.length > 0) {
            _.remove(contacts, contact => {
                _.remove(contact.contactRelationships, cr => !_.includes(ids, cr.student.countryOfOriginId));
                return (contact.contactRelationships.length > 0) ? false : true;
            });
        }
    }

    // Activity
    private filterByEvent(contacts: Contact[], filterValue: FilterValue) {
        this.filterByEventOrPersonalTour(contacts, filterValue.value);
    }

    private filterByPersonalTour(contacts: Contact[], filterValue: FilterValue) {
        this.filterByEventOrPersonalTour(contacts, filterValue.value);
    }

    private filterByEventOrPersonalTour(contacts: Contact[], filterValues: string[]) {
        if (filterValues.length > 0) {
            _.remove(contacts, contact => {
                let total = 0;
                _.forEach(filterValues, value => {
                    total += (_.get(contact, value)) ? 1 : 0;
                });
                return !Boolean(total);
            });
        }
    }

    private filterByStudentActivityId(contacts: Contact[], filterValue: FilterValue) {
        const ids = _.map(filterValue.value, i => (i === 0) ? null : i);
        if (ids.length > 0) {
            _.remove(contacts, contact => {
                _.remove(contact.contactRelationships, cr => {
                    _.remove(cr.student.activityLogs, al => !_.includes(ids, _.get(al, filterValue.id)));
                    return !Boolean(cr.student.activityLogs.length > 0);
                });
                return (contact.contactRelationships.length > 0) ? false : true;
            });
        }
    }


    private stripContactsAndRelationships(contacts: Contact[], filter: FilterValue, isBoolean = false) {
        let ids = [];
        if (filter.multiple) {
            ids = _.map(filter.value, i => (i === 0) ? null : i);
        } else {
            ids.push((filter.value === 0) ? null : filter.value);
        }
        if (ids.length > 0) {
            _.remove(contacts, contact => {
                _.remove(contact.contactRelationships, cr => (
                    !_.includes(ids, (isBoolean ? Boolean(_.get(cr, filter.id)) : _.get(cr, filter.id)))
                ));
                return (contact.contactRelationships.length > 0) ? false : true;
            });
        }
    }

    private _includes(str: string, value: string) {
        return _.includes(_.toLower(str), _.toLower(value));
    }

}
