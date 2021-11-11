import { Component, Input, SimpleChanges, OnChanges, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Utils } from 'app/common/utils';
import { LICode, list_id, FieldType, ModalAction } from 'app/common/enums';
import { Address } from 'app/common/interfaces';
import { AddressPipe } from 'app/common/pipes/address.pipe';
import { Constants } from 'app/common/constants';

import { HttpService } from 'app/services/http.service';
import { DataService } from 'app/services/data.service';
import { StorageService } from 'app/services/storage.service';

import { UserInfo } from 'app/entities/userInfo';
import { Student } from 'app/entities/student';
import { ContactRelationship } from 'app/entities/contact-relationship';
import { Contact } from 'app/entities/contact';
import { ListItem } from 'app/entities/list-item';
import { CustomHttpParams } from 'app/entities/custom-http-params';

import { BaseTable } from 'app/base-table';
import { FilterValue } from '../filter-constellation/interfaces/filter-value';

import { SelectContactModalComponent } from '../select-contact-modal/select-contact-modal.component';
import { AddContactModalComponent } from '../add-contact-modal/add-contact-modal.component';

import * as _ from 'lodash';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-related-contacts-cmp',
    templateUrl: 'related-contacts.component.html',
    styleUrls: ['./related-contacts.component.scss']
})

export class RelatedContactsComponent extends BaseTable<Contact> implements OnChanges {

    public contacts: any[] = [];
    public students: any[] = [];
    public studentsRelationships: any[] = [];
    public userInfo: UserInfo = null;
    @Input() studentId: number;
    @Input() contactId: number;
    @Input() trigger: boolean;
    @Input() showAddContactButton: boolean;
    @Input() showAddressData: boolean;
    @Input() hideRelationship: boolean;
    @Input() isNewStudent: boolean;
    @Output() formIsValid = new EventEmitter();
    @Output() contactChanged = new EventEmitter();
    hasPrimary: boolean;
    isSelectContact = false;
    moreThanOnePrimary = false;
    isPrimary = false;
    contactRelationships: Object[] = [];
    contactRelationshipsNew: ContactRelationship[] = [];
    existingContactIds: number[] = [];
    tableId = 'relatedContacts';
    spouse: Contact;
    alumniIdYes: number = null;

    private addressPipe = new AddressPipe();

    constructor(
        private router: Router,
        private httpService: HttpService,
        private dataService: DataService,
        private modalService: NgbModal,
        storageService: StorageService,
        private platformLocation: PlatformLocation,
    ) {
        super(storageService);
    }

    ngOnChanges(changes: SimpleChanges): Promise<void> {
        this.userInfo = Utils.getUserInfoFromToken();

        this.displayedColumns = this.showAddressData
            ? ['alumni', 'name', 'address', 'location', 'email', 'mobile', 'relationship', 'actions']
            : ['alumni', 'name', 'email', 'mobile', 'relationship', 'actions'];
        return this.tableIsLoading = this.getContacts()
            .then(() => {
                return this.getAlumniIdYes();
            }).then(() => {
                this.buildTable(_.clone(this.contacts));
            });
    }

    getContacts(): Promise<any> {
        if (this.contactId) {
            return this.dataService.getAuth('contact/' + this.contactId + '/related-contacts/').then((result) => {
                this.getData(result);
            });
        } else if (this.studentId) {
            return this.dataService.getAuth('student/' + this.studentId + '/related-contacts/').then((result) => {
                this.getData(result);
            });
        } else {
            return Promise.resolve();
        }
    }

    getData(result) {
        this.contactRelationshipsNew = [];
        const contacts = result['contacts'];
        this.contactRelationships = result['contactRelationships'];
        this.students = result['students'];
        this.spouse = result['spouse'];
        let countPrimary = 0;
        _.forEach(this.contactRelationships, (item: Object) => {
            if (item['contactType'].code === LICode.contact_type_primary) {
                countPrimary++;
            }
            const contactRelationship = new ContactRelationship(
                item['studentId'],
                item['contactId'],
                item['relationshipType'],
                item['contactType'],
                item['contactType'].code,
            );
            this.contactRelationshipsNew.push(contactRelationship);
            this.moreThanOnePrimary = Boolean(countPrimary > 1);
        });
        this.contacts = [];
        _.forEach(contacts, (contact: any) => {
            this.studentsRelationships = [];
            const filteredContactRelationships = _.filter(this.contactRelationshipsNew, { contactId: contact.id });
            const studentIds = _.map(filteredContactRelationships, 'studentId');
            const students: Student[] = [];
            _.forEach(studentIds, (id: any) => {
                students.push(_.find(this.students, { id }));
            });
            if (this.contactId) {
                _.forEach(students, (student: any) => {
                    const relationship = _.find(this.contactRelationshipsNew, {
                        studentId: student.id, contactId: contact.id
                    });

                    this.studentsRelationships.push(
                        ' ' + (relationship as ContactRelationship).relationshipType.name + ' of '
                        + student.lastName + ', ' + student.firstName
                        + ' (' + (relationship as ContactRelationship).contactType.name + ')'
                    );
                });
            } else if (this.studentId) {
                const relationship = _.find(this.contactRelationshipsNew, { contactId: contact.id });

                this.studentsRelationships.push(
                    (relationship as ContactRelationship).relationshipType.name
                    + ' (' + (relationship as ContactRelationship).contactType.name + ')'
                );

                this.isPrimary = !!(
                    (_.find(this.contactRelationshipsNew, { contactId: contact.id })['contactTypeCode']) === LICode.contact_type_primary
                );
            }
            this.contacts.push({
                id: contact.id,
                lastName: contact.lastName,
                firstName: contact.firstName,
                address: contact.address,
                sublocality: contact.sublocality,
                city: contact.city,
                administrativeArea: contact.administrativeArea,
                email: contact.email,
                mobile: contact.mobile,
                relationship: this.studentsRelationships.join('; '),
                isPrimary: this.isPrimary,
                marriage: contact.marriage,
                alumniId: contact.alumniId,
            });
        });
        this.checkForPrimaryContact();
        if (this.contactId && this.spouse) {
            this.addSpouse();
        }
    }

    protected buildTable(contacts: Contact[]) {
        this.existingContactIds = [];
        contacts.forEach(contact => {
            contact.name = `${contact.lastName}, ${contact.firstName}`;
            this.existingContactIds.push(contact.id);
        });
        super.buildTable(contacts, false);
        this.dataSource.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'location': return _.toLower(this.addressPipe.transform(item as Address));
                default: return _.toLower(_.get(item, property));
            }
        };
        this.updateTable(contacts);
    }

    checkForPrimaryContact() {
        this.hasPrimary = _.includes(this.contactRelationshipsNew,
            _.find(this.contactRelationshipsNew, relationship => relationship.contactTypeCode === LICode.contact_type_primary));
        this.formIsValid.emit(this.hasPrimary);
    }

    selectContact() {
        const selectContactModalRef = this.modalService.open(SelectContactModalComponent, Constants.ngbModalLg);
        selectContactModalRef.componentInstance.addButton = true;
        selectContactModalRef.componentInstance.existingContactIds = this.existingContactIds;
        selectContactModalRef.result.then((res: { action: ModalAction, selectedContact?: Contact }) => {
            switch (res.action) {
                case ModalAction.Select: this.onSelectContactForStudent(res.selectedContact); break;
                case ModalAction.Create: this.onSelectContactForStudent(); break;
                default: break;
            }
        });
        this.platformLocation.onPopState(() => {
            selectContactModalRef.close({ action: ModalAction.LeavePage });
        });
    }

    private onSelectContactForStudent(selectContact?: Contact) {
        const contactId = selectContact ? selectContact.id : 0;
        this.addOrEditContact(contactId);
    }

    private addOrEditContact(editContactId: number) {
        const addContactModalRef = this.modalService.open(AddContactModalComponent, Constants.ngbModalLg);
        addContactModalRef.componentInstance.studentId = this.studentId;
        addContactModalRef.componentInstance.contactId = editContactId;
        addContactModalRef.componentInstance.currentRelatedContactId = this.contactId;
        addContactModalRef.componentInstance.relatedContacts = this.contacts;
        addContactModalRef.componentInstance.hideRelationship = this.hideRelationship;
        addContactModalRef.componentInstance.isNewStudent = this.isNewStudent;
        addContactModalRef.result.then((res: { action: ModalAction }) => {
            switch (res.action) {
                case ModalAction.Update:
                case ModalAction.Create: this.contactIsChanged(); break;
                default: break;
            }
        });
        this.platformLocation.onPopState(() => {
            addContactModalRef.close({ action: ModalAction.LeavePage });
        });
    }

    editContact(id: number) {
        this.router.navigate(['dashboard/sendback']).then((hasNavigated: boolean) => {
            if (hasNavigated) {
                this.router.navigate([`${environment.localization.enquiriesUrl}/edit-contact`, { contactId: id }]);
            }
        });
    }

    editContactModal(contactId: number) {
        this.addOrEditContact(contactId);
    }

    unlinkContact(contactId: number) {
        return Utils.unlinkQuestion().then((result) => {
            if (result && result.value) {
                return this.httpService.postAuth('student/' + this.studentId + '/unlink/' + contactId, {}).then(() => {
                    Utils.unlinkedSuccess();
                    this.contactIsChanged();
                });
            }
        });
    }

    private contactIsChanged() {
        this.dataService.resetPageDependentData();
        return this.ngOnChanges(null).then(() => {
            this.contactChanged.emit();
        });
    }

    addSpouse() {
        if (_.find(this.contacts, c => c.id === this.spouse.id)) {
            _.find(this.contacts, c => c.id === this.spouse.id).relationship += '; Spouse';
        } else {
            this.contacts.push({
                id: this.spouse.id,
                lastName: this.spouse.lastName,
                firstName: this.spouse.firstName,
                address: this.spouse.address,
                sublocality: this.spouse.sublocality,
                city: this.spouse.city,
                administrativeArea: this.spouse.administrativeArea,
                email: this.spouse.email,
                mobile: this.spouse.mobile,
                relationship: 'Spouse',
                isPrimary: this.isPrimary,
            });
        }
    }

    getAlumniIdYes(): Promise<any> {
        if (!this.alumniIdYes) {
            const filterValues: FilterValue[] = [
                { id: 'listId', value: list_id.alumni, type: FieldType.Dropdown },
                { id: 'code', value: LICode.alumni_yes, type: FieldType.Dropdown }
            ];
            const params: CustomHttpParams = new CustomHttpParams()
                .generateFilters(filterValues)
                .generateOrder([{ field: 'listId', direction: 'ASC' }, { field: 'sequence', direction: 'ASC' }]);
            return this.httpService.getAuth(`list-items?${params.toString()}`).then((listItems: ListItem[]) => {
                this.alumniIdYes = _.first(listItems).id;
            });
        } else {
            return Promise.resolve();
        }
    }

}
