import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlatformLocation } from '@angular/common';

import { EmailTemplateComponent } from './email-template';
import { EmailTemplate } from 'app/entities/email-template';
import { FormType } from 'app/common/enums';

import { EmailTemplateService } from './email-template.service';

@Component({
    selector: 'app-prospectus-email-template',
    templateUrl: 'email-template.component.html',
    styleUrls: ['./email-template.component.scss'],
    providers: [EmailTemplateService],
})
export class ProspectusEmailTemplateComponent extends EmailTemplateComponent {

    constructor(
        modalService: NgbModal,
        platformLocation: PlatformLocation,
        emailTemplateService: EmailTemplateService
    ) {
        super(
            modalService, platformLocation, emailTemplateService, EmailTemplate.TYPE_EMAIL_SCHOOL_PROSPECTUS, FormType.prospectus_request);
    }
}
