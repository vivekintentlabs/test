import { Component, OnInit, AfterViewInit, ChangeDetectorRef, Input, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { DataService } from 'app/services/data.service';
import { HttpService } from 'app/services/http.service';
import { StorageService } from 'app/services/storage.service';

import { Webform } from 'app/entities/webform';
import { Contact } from 'app/entities/contact';
import { Utils } from 'app/common/utils';
import { ModalAction } from 'app/common/enums';

import { BaseTable } from 'app/base-table';

import * as _ from 'lodash';
import Swal from 'sweetalert2';


@Component({
    selector: 'app-select-contact-modal',
    templateUrl: './select-contact-modal.component.html',
    styleUrls: ['../select-css/select-css.scss']
})
export class SelectContactModalComponent extends BaseTable<Contact> implements OnInit, AfterViewInit, OnDestroy {
    tablePostFix = 'table';
    tableId = 'selectContactList';

    @Input() contact: string;
    @Input() trigger: boolean;
    @Input() addButton: boolean;
    @Input() newContact: Contact;
    @Input() existingContactIds: Array<number>;
    @Input() eventData: { router: Router, currentUrl: string, eventId: number, campusId: number };

    contacts: Contact[] = [];

    constructor(
        private ref: ChangeDetectorRef,
        private dataService: DataService,
        private httpService: HttpService,
        private activeModal: NgbActiveModal,
        storageService: StorageService) {
        super(storageService);
        this.displayedColumns = ['name', 'address', 'city']
    }

    ngOnInit() {
        if (this.contacts) {
            this.buildTable();
        }
    }

    ngAfterViewInit() {
        this.tableIsLoading = this.getData();
        this.ref.detectChanges();
    }

    private getData(): Promise<any> {
        return this.dataService.getAuth('contact/list').then((contacts: Contact[]) => {
            this.contacts = contacts;
            this.buildTable();
            return Promise.resolve();
        });
    }

    newRegistrant() {
        this.activeModal.close({ action: ModalAction.Cancel });
        return this.httpService.getAuth('webform/get-event-registration').then((webform: Webform) => {
            if (webform) {
                window.open(`webforms/event-registration/${webform.uniqId}?eventId=${this.eventData['eventId']}`, '_blank');
                Swal.fire({
                    title: 'The page will be reloaded',
                    confirmButtonClass: 'btn btn-success',
                    buttonsStyling: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                }).then((result) => {
                    if (result && result.value) {
                        Utils.refreshPage(this.eventData.router, [this.eventData.currentUrl,
                        { eventId: this.eventData.eventId, campusId: this.eventData.campusId }])
                    }
                });
            }
        }).catch(err => {
            console.log(err);
        });
    }

    protected buildTable() {
        const contacts: Contact[] = _.filter(this.contacts, c => !_.includes(this.existingContactIds, c.id));
        contacts.forEach(contact => {
            contact.name = `${contact.lastName}, ${contact.firstName}`
        });
        super.buildTable(contacts, true, false);
        this.updateTable(contacts);
    }

    selectContact(contact) {
        const selectedContact: Contact = _.find(this.contacts, c => c.id === contact.id);
        this.activeModal.close({ action: ModalAction.Select, selectedContact: selectedContact });
    }

    addNewContact() {
        this.activeModal.close({ action: ModalAction.Create });
    }

    onCancelSelectContact() {
        this.activeModal.close({ action: ModalAction.Cancel });
    }

}
