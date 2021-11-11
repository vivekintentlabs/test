import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';


import { Utils, Colors } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { ModalAction } from 'app/common/enums';
import { UserInfo } from 'app/entities/userInfo';
import { EmailTemplate } from 'app/entities/email-template';
import { CommsMCTextTemplate } from 'app/entities/comms-mc-text-template';

import { HttpService } from 'app/services/http.service';
import { CommunicationService } from 'app/communications/communications.service';
import { CommsTemplateService } from 'app/communications/comms-template.service';
import { SendTestEmailComponent } from 'app/components/send-test-email/send-test-email.component';

import * as _ from 'lodash';
import Swal from 'sweetalert2';
import 'tinymce/plugins/textcolor/plugin';
import 'tinymce/plugins/image/plugin';
import 'tinymce/plugins/code/plugin';

declare var $: any;

@Component({
    selector: 'comms-email-templates',
    templateUrl: 'comms-email-templates.component.html',
    styleUrls: ['./comms-email-templates.component.scss']
})
export class CommsEmailTemplatesComponent implements OnInit {
    userInfo: UserInfo = null;
    commsEmailsTemplateForm: FormGroup = null;
    localTemplate: CommsMCTextTemplate;
    emailTemplates: Array<EmailTemplate> = null;
    emailTemplate: EmailTemplate;
    loaded = false;
    noItemSelected = Constants.noItemSelected;
    private changed = 0;
    private submitted = false;
    content: string;
    private sub: Subscription;
    promiseForBtn: Promise<any>;

    constructor(
        private router: Router,
        private httpService: HttpService,
        private zone: NgZone,
        public commService: CommunicationService,
        private commsTemplateService: CommsTemplateService,
        private modalService: NgbModal,
        private platformLocation: PlatformLocation,
    ) {}

    /**
     * Inits component data, a native callback method
     * @return {void}
     */
    public ngOnInit() {
        this.commService.checkModule(false).then((isLoaded: boolean) => {
            if (isLoaded) {
                this.userInfo = Utils.getUserInfoFromToken();
                return this.commsTemplateService.getEmailTemplates().then((emailTemplates: Array<EmailTemplate>) => {
                    this.emailTemplates = _.sortBy(emailTemplates, [template => template.subject?.toLocaleLowerCase()]);
                }).catch(err => console.log(err));
            }
        });
    }

    /**
     * Redirects to create message page
     * @return {void}
     */
    onCreate() {
        this.router.navigate(['admin/emails/create-comms-template']);
    }

    /**
     * Redirects to edit message page
     * @param {number} id - message id
     * @return {void}
     */
    edit(id: number) {
        this.router.navigate(['admin/emails/edit-comms-template', id]);
    }

    /**
     * Toggles activate status
     * @param {boolean} value - toggle status
     * @param {number} id - email template id
     * @return {Promise<boolean>}
     */
    activate(value: boolean, id: number) {
        const data = { activated: value, id: id };
        this.httpService.postAuth('email-template/activate', data).then((res) => {
            Utils.showSuccessNotification();
        }).catch(err => console.log(err));
    }

    /**
     * Copies template object
     * @param {EmailTemplate} item - template object
     * @return {Promise<any>}
     */
    copy(item: EmailTemplate): Promise<any> {
        return Swal.fire({
            title: 'Are you sure?',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn btn-success',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Yes, copy template!',
            buttonsStyling: false
        }).then((result) => {
            if (result && result.value) {
                const copiedElement: EmailTemplate = _.cloneDeep(item);
                copiedElement.id = null;
                copiedElement.subject = `Copy of ${item.subject}`;
                return this.httpService.postAuth(
                    'email-template', copiedElement
                ).then((res: any) => {
                    if (res) {
                        Swal.fire({
                            title: 'Copied!',
                            text: 'Your template has been copied.',
                            type: 'success',
                            confirmButtonClass: 'btn btn-success',
                            buttonsStyling: false
                        });
                        copiedElement.id = res.id;
                        this.emailTemplates.push(copiedElement);
                    }
                    return res;
                }).catch(err => console.log(err));
            }
            return result;
        });
    }

    /**
     * Shows send email dialog
     * @param {EmailTemplate} item - email template item
     * @return {<void>}
     */
    showSendTestEmail(item: EmailTemplate) {
        this.emailTemplate = item;
        const modalSendTestEmailRef = this.modalService.open(SendTestEmailComponent, Constants.ngbModalLg);
        modalSendTestEmailRef.result.then((result: { action: ModalAction, email: string }) => {
            switch (result.action) {
                case ModalAction.Done:
                    return this.httpService.postAuth(
                        'email-template/send-test-email',
                        { id: this.emailTemplate.id, email: result.email }
                    ).then(() => {
                        Utils.showNotification('Test Email successfully sent.', Colors.success);
                    }).catch(err => console.log(err));
                default:
                    break;
            }
        }).catch((err) => modalSendTestEmailRef.dismiss(err));
        this.platformLocation.onPopState(() => {
            modalSendTestEmailRef.close({ action: ModalAction.LeavePage });
        });
    }

    /**
     * Deletes email template object
     * @param {number} id - email template id
     * @return {Promise<void>}
     */
    remove(id: number): Promise<any> {
        return Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this item.',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn btn-delete',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Yes, delete template!',
            buttonsStyling: false
        }).then((result) => {
            if (result && result.value) {
                return this.commsTemplateService.deleteEmailTemplate(id).then(() => {
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'Your template has been deleted.',
                        type: 'success',
                        confirmButtonClass: 'btn btn-success',
                        buttonsStyling: false
                    });
                    _.remove(this.emailTemplates, (emailTemplate: EmailTemplate) => emailTemplate.id === id);
                }).catch(err => console.log(err));
            }
        });
    }
}
