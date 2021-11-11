import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { ModalAction } from 'app/common/enums';

import { UserInfo } from 'app/entities/userInfo';
import { Contact } from 'app/entities/contact';

import { BaseTable } from 'app/base-table';
import { StorageService } from 'app/services/storage.service';

import { SelectContactModalComponent } from '../select-contact-modal/select-contact-modal.component';
import { AddContactModalComponent } from '../add-contact-modal/add-contact-modal.component';

import * as _ from 'lodash';
import { environment } from 'environments/environment';


@Component({
    selector: 'app-related-contacts-for-new-student-cmp',
    templateUrl: 'related-contacts-for-new-student.component.html'
})

export class RelatedContactsForNewStudentComponent extends BaseTable<Contact> implements OnChanges {

    @Input() hasPrimary: boolean;
    @Output() contactRelationships = new EventEmitter();

    public userInfo: UserInfo = null;
    public contactsForTable = [];
    public contacts = [];
    public editContactId: number;
    public studentRelationships: string;
    public existingContactIds: number[] = [];
    public tableId = 'relatedContactsForNewStudent';

    constructor(
        private router: Router,
        private modalService: NgbModal,
        storageService: StorageService,
        private platformLocation: PlatformLocation,
    ) {
        super(storageService);
        this.displayedColumns = ['name', 'email', 'mobile', 'relationship', 'actions']
    }

    ngOnChanges() {
        this.userInfo = Utils.getUserInfoFromToken();
    }

    getData(data) {
        if (data) {
            const contact = data.contact;
            let duplicate = _.find(this.contacts, con => con.email === contact.email && con.firstName === contact.firstName);
            _.pull(this.contacts, duplicate);
            duplicate = _.find(this.contactsForTable, con => con.email === contact.email && con.firstName === contact.firstName);
            _.pull(this.contactsForTable, duplicate);
            this.contacts.push(data.contact);
            const relationships = data.relationships;
            const contactTypes = data.contactTypes;
            const relationshipTypeName = _.find(relationships, { id: contact.relationship.relationshipTypeId })['name'];
            const contactTypeName = _.find(contactTypes, { id: contact.relationship.contactTypeId })['name'];
            this.studentRelationships = (relationshipTypeName + ' (' + contactTypeName + ')');
            this.contactsForTable.push({
                id: contact.id,
                lastName: contact.lastName,
                firstName: contact.firstName,
                address: contact.address,
                city: contact.city,
                administrativeArea: contact.administrativeArea == null ? '' : contact.administrativeArea.name,
                email: contact.email,
                mobile: contact.mobile,
                relationship: this.studentRelationships,
            });
        }
        this.buildTable(this.contactsForTable);
        this.contactRelationships.emit(this.contacts);
    }

    protected buildTable(contacts) {
        this.existingContactIds = [];
        contacts.forEach(contact => {
            contact.name = `${contact.lastName}, ${contact.firstName}`
            this.existingContactIds.push(contact.id)
        });
        super.buildTable(contacts, false);
        this.updateTable(contacts);
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
        this.editContactId = selectContact ? selectContact.id : 0;
        this.addOrEditContact(this.editContactId);
    }

    private addOrEditContact(editContactId: number) {
        if (editContactId || editContactId === 0) {
            const addContactModalRef = this.modalService.open(AddContactModalComponent, Constants.ngbModalLg);
            addContactModalRef.componentInstance.studentId = 0;
            addContactModalRef.componentInstance.contactId = editContactId;
            addContactModalRef.componentInstance.isNewStudent = true;
            addContactModalRef.componentInstance.hideRelationship = false;
            addContactModalRef.componentInstance.currentRelatedContactId = 0;
            addContactModalRef.result.then((res: { action: ModalAction, data?: object }) => {
                switch (res.action) {
                    case ModalAction.Update:
                    case ModalAction.Create: this.contactIsChanged(); break;
                    case ModalAction.contactForNewStudent: this.contactForNewStudent(res.data); break;
                    default: break;
                }
            });
            this.platformLocation.onPopState(() => {
                addContactModalRef.close({ action: ModalAction.LeavePage });
            });
        }
    }

    editContact(id: number) {
        return this.router.navigate([`/${environment.localization.enquiriesUrl}/edit-contact`, { contactId: id }]);
    }

    editContactModal(editContactId) {
        this.editContactId = editContactId;
        this.addOrEditContact(this.editContactId);
    }

    unlinkContact(contact) {
        _.pull(this.contactsForTable, contact)
        const contacttemp = _.find(this.contacts, con => con.email === contact.email && con.firstName === contact.firstName)
        _.pull(this.contacts, contacttemp);
        this.contactRelationships.emit(this.contacts);
        this.getData('');
    }


    private contactIsChanged() {
        this.ngOnChanges();
    }

    private contactForNewStudent(data) {
        this.getData(data);
        this.editContactId = null;
    }

}
