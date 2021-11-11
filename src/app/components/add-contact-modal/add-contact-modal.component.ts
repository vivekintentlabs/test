import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalAction } from 'app/common/enums';

import { Contact } from 'app/entities/contact';


@Component({
    selector: 'app-add-contact-modal',
    templateUrl: './add-contact-modal.component.html'
})
export class AddContactModalComponent implements OnInit {
    @Input() studentId: number;
    @Input() contactId: number;
    @Input() currentRelatedContactId?: number; // for contact relationship
    @Input() hideRelationship: boolean;
    @Input() isNewStudent: boolean;
    @Input() relatedContacts: Contact[];

    title = 'Edit Contact details';

    constructor(public activeModal: NgbActiveModal) { }

    ngOnInit() {
        if (this.contactId !== null) {
            this.title = (this.contactId > 0) ? 'Edit Contact details' : 'Add Contact';
        }
    }

    contactIsChanged(changedContact: Contact) {
        this.activeModal.close({ action: ModalAction.Update, changedContact: changedContact });
    }

    addNewContact() {
        this.activeModal.close({ action: ModalAction.Create });
    }

    contactForNewStudent(data: object) {
        if (data) {
            this.activeModal.close({ action: ModalAction.contactForNewStudent, data: data });
        } else {
            this.onCancel();
        }
    }

    onCancel() {
        this.activeModal.close({ action: ModalAction.Cancel });
    }

}
