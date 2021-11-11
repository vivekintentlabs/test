import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlatformLocation } from '@angular/common';

import { EmailTemplateComponent } from './email-template';
import { EmailTemplate } from 'app/entities/email-template';
import { FormType } from 'app/common/enums';

import { EmailTemplateService } from './email-template.service';

@Component({
    selector: 'app-general-email-template',
    templateUrl: 'email-template.component.html',
    styleUrls: ['./email-template.component.scss'],
    providers: [EmailTemplateService],
})
export class GeneralEmailTemplateComponent extends EmailTemplateComponent {

    constructor(
        modalService: NgbModal,
        platformLocation: PlatformLocation,
        emailTemplateService: EmailTemplateService
    ) {
        super(modalService, platformLocation, emailTemplateService, EmailTemplate.TYPE_EMAIL_GENERAL_ENQUIRY, FormType.general);
    }
}
