import { OnInit, Directive } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Constants } from 'app/common/constants';
import { EmailTemplate } from '../../entities/email-template';
import { ModalAction, FormType } from 'app/common/enums';
import { Utils } from 'app/common/utils';
import { InsertField } from 'app/common/interfaces';

import { EditEmailTemplateComponent } from 'app/components/email-template/edit-email-template/edit-email-template.component';
import { SendTestEmailComponent } from 'app/components/send-test-email/send-test-email.component';

import { EmailTemplateService } from './email-template.service';

import * as _ from 'lodash';
import Swal from 'sweetalert2';

@Directive()
export abstract class EmailTemplateComponent implements OnInit {

    insertSubjectEmail: InsertField[] = Constants.insertSubjectEmailTemplate;
    insertMessageEmail: InsertField[] = Constants.insertMessageEmailTemplate;
    emailTemplates: EmailTemplate[] = [];
    deleteIds: number[] = [];
    webformName: string;

    constructor(
        private modalService: NgbModal,
        private platformLocation: PlatformLocation,
        private emailTemplateService: EmailTemplateService,
        private type: string,
        private formType: FormType
    ) { }

    ngOnInit() {
        return this.emailTemplateService.getWebformName(this.formType).then((name: string) => {
            this.webformName = name;
            return this.getData();
        });
    }

    public getData(): Promise<any> {
        this.emailTemplates = [];
        this.deleteIds = [];
        return this.emailTemplateService.getEmailTemplates(this.type).then((emails: EmailTemplate[]) => {
            this.emailTemplates = Utils.sortEmailBySchedule<EmailTemplate>(emails);

            _.forEach(this.emailTemplates, (email: EmailTemplate) => {
                email.sentString = email.isImmediate
                    ? 'On submission'
                    : `${email.scheduleDays} day(s) after submission`;
            });
            return Promise.resolve();
        });
    }

    addItem() {
        const email = new EmailTemplate();
        email.id = null;
        email.activated = true;
        email.isImmediate = false;
        email.type = this.type;
        email.scheduleDays = 1;
        email.scheduleMoment = 'after';
        email.scheduledLocalTime = '06:00';
        this.openEditEmailTemplate(email, 'Add');
    }

    edit(item) {
        let email = new EmailTemplate();
        email = item;
        this.openEditEmailTemplate(email, 'Edit');
    }

    showSendTestEmail(item: EmailTemplate) {
        const modalSendTestEmailRef = this.modalService.open(SendTestEmailComponent, Constants.ngbModalLg);
        modalSendTestEmailRef.result.then((result: { action: ModalAction, email: string }) => {
            switch (result.action) {
                case ModalAction.Done:
                    return this.emailTemplateService.sendTestEmail(item.id, result.email).catch(err => console.log(err));
                default:
                    break;
            }
        }).catch((err) => modalSendTestEmailRef.dismiss(err));
        this.platformLocation.onPopState(() => {
            modalSendTestEmailRef.close({ action: ModalAction.LeavePage });
        });
    }

    openEditEmailTemplate(email: EmailTemplate, title: string) {
        const modalEditEmailTemplateRef = this.modalService.open(EditEmailTemplateComponent, Constants.ngbModalXl);
        modalEditEmailTemplateRef.componentInstance.email = email;
        modalEditEmailTemplateRef.componentInstance.title = title;
        modalEditEmailTemplateRef.componentInstance.webformName = this.webformName;
        modalEditEmailTemplateRef.componentInstance.type = this.type;
        modalEditEmailTemplateRef.componentInstance.insertSubjectEmail = this.insertSubjectEmail;
        modalEditEmailTemplateRef.componentInstance.insertMessageEmail = this.insertMessageEmail;
        modalEditEmailTemplateRef.result.then((result: { action: ModalAction }) => {
            switch (result.action) {
                case ModalAction.Done:
                    this.getData();
                    break;
                default:
                    break;
            }
        }).catch((err) => modalEditEmailTemplateRef.dismiss(err));
        this.platformLocation.onPopState(() => {
            modalEditEmailTemplateRef.close({ action: ModalAction.LeavePage });
        });
    }

    activate(value: boolean, item: EmailTemplate) {
        return this.emailTemplateService.activate(value, item);
    }

    select(id: number, isChecked: boolean) {
        if (isChecked) {
            this.deleteIds.push(id);
        } else {
            _.pull(this.deleteIds, id);
        }
    }

    selectAll(isChecked: boolean) {
        this.emailTemplates.forEach(x => { if (!x.isImmediate) { x.check = isChecked; } });
        if (isChecked) {
            _.remove(this.deleteIds);
            _(this.emailTemplates).forEach((item) => {
                if (!item.isImmediate) {
                    this.deleteIds.push(item.id);
                }
            });
        } else {
            _.remove(this.deleteIds);
        }
    }

    isAllSelected() {
        return _.every(this.emailTemplates, 'check');
    }

    removeAll() {
        return Utils.deletedQuestion().then(result => {
            if (result?.value) {
                return this.emailTemplateService.deleteEmailTemplates(this.deleteIds)
                    .then(() => this.actionAfterDeleted());
            }
        });
    }

    remove(id: number) {
        return Utils.deletedQuestion().then(result => {
            if (result?.value) {
                return this.emailTemplateService.deleteEmailTemplate(id)
                    .then(() => this.actionAfterDeleted());
            }
        });
    }

    actionAfterDeleted(): Promise<void> {
        return this.getData().then(() => {
            Swal.fire({
                title: 'Deleted!',
                text: 'Your item(s) has been deleted.',
                type: 'success',
                confirmButtonClass: 'btn btn-success',
                buttonsStyling: false
            });
            _.remove(this.deleteIds);
        });
    }

}
