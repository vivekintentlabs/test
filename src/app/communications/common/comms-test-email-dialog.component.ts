import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { emailValidator } from 'app/validators/email.validator';
import { Constants } from 'app/common/constants';
import { Utils, Colors } from 'app/common/utils';
import { CommunicationService } from 'app/communications/communications.service';
import { CommsTemplateService } from 'app/communications/comms-template.service';
import { CommsMessage } from 'app/entities/comms-message';
import { ResponseMessage } from 'app/common/interfaces';
import { ErrorMessageService } from '../../services/error-message.service';

declare var $: any;

@Component({
    selector: 'comms-test-email-dialog',
    templateUrl: './comms-test-email-dialog.component.html',
    styleUrls: ['./comms-test-email-dialog.component.scss']
})
export class CommsTestEmailDialogComponent {
    testEmailForm: FormGroup = null;
    isSubmitted: boolean;
    commsMessage: CommsMessage = null;

    constructor(
        private commService: CommunicationService,
        private commsTemplateService: CommsTemplateService,
        private fb: FormBuilder,
        private errorMessageService: ErrorMessageService,
    ) {}

    /**
     * Show a test email dialog
     * @param {CommsMessage} commsMessage - message object
     * @return {void}
     */
    showTestEmailModal(commsMessage: CommsMessage) {
        this.isSubmitted = false;
        this.commsMessage = commsMessage;
        this.testEmailForm = this.fb.group({
            email: [
                this.commService.currentUser.email,
                Validators.compose([
                    Validators.required,
                    emailValidator,
                    Validators.maxLength(Constants.emailMaxLength)
                ])
            ]
        });

        $('#testEmailModal').modal('show');
    }

    /**
     * Send a test email
     * @return {Promise<any>}
     */
    sendTestEmail():Promise<any> {
        this.isSubmitted = true;
        const data: CommsMessage = this.commsMessage;
        data.testEmails  = [this.testEmailForm.controls.email.value];
        data.sendType    = "html";

        $('#testEmailModal').modal('hide');
        Utils.showNotification('Test message has been sent.', Colors.success);

        return this.commsTemplateService.generateTemplate(data, false, true).then((template) => {
            data.templateRawHtml = template;
            return this.commService.sendTestEmail(data).then((res) => {
                return res;
            }).catch(async (error: ResponseMessage) => {
                const errMsg: string = await this.errorMessageService.getMessage(error.errorCode, error.errorMessage, error?.params);
                console.log(error);
                Utils.showNotification(errMsg, Colors.danger);
                return error;
            });
        }).catch(async (error: ResponseMessage) => {
            const errMsg: string = await this.errorMessageService.getMessage(error.errorCode, error.errorMessage, error?.params);
            console.log(error);
            Utils.showNotification(errMsg, Colors.danger);
            return error;
        });
    }
}
