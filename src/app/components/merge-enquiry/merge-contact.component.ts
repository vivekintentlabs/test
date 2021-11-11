import { Component } from '@angular/core';
import { MergeContactService } from 'app/components/merge-enquiry/merge-contact.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalAction } from 'app/common/enums';
import { Utils } from 'app/common/utils';

import { Contact } from 'app/entities/contact';

import { MergeBase } from './merge-base';

import * as _ from 'lodash';

@Component({
    selector: 'app-merge-contact',
    templateUrl: 'merge.component.html',
    styleUrls: ['./merge.component.scss'],
    providers: [MergeContactService],
})

export class MergeContactComponent extends MergeBase<Contact> {

    constructor(protected activeModal: NgbActiveModal, private mergeContactService: MergeContactService) {
        super(activeModal);
        this.footerText = 'All related activities, contacts and students will be transferred';
    }

    ngOnInit() {
        super.ngOnInit();
        return this.mergeContactService.getRelatedData(this.ids)
            .then(() => this.mergeContactService.getMergeData(this.ids)
                .then((contacts: Partial<Contact[]>) => {
                    this.enquiries = _.orderBy(contacts, c => [_.isEmpty(c.appContactMapping), c.createdAt], ['asc', 'asc']);
                    this.mergeFields = this.mergeContactService.mapFieldsByEnquiries(this.enquiries, this.schoolTimeZone);
                    if (this.mergeContactService.isEnabledAppModule && _.filter(this.enquiries, e => e.appContactMapping.length).length > 1) {
                        Utils.mergeWarning(this.entityName);
                    }
                })
            );
    }

    protected get entityName(): string {
        return this.mergeContactService.model;
    }

    merge() {
        if (this.mergeContactService.isValidMergeFields(this.mergeFields)) {
            this.promiseForBtn = this.mergeContactService.merge(this.mergeFields, this.enquiries).then((id: number) => {
                this.activeModal.close({ action: ModalAction.MergeContacts, id });
            });
        }
    }

}
