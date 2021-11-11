import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Constants } from 'app/common/constants';
import { ModalAction } from 'app/common/enums';

import { PaymentQuery } from '../matwidgets/payment/state/payment.query';

import { FillableAppFormDoc } from '../interfaces/documents/fillable-app-form-doc';

import { ApplicationsService } from 'app/applications/applications.service';

import {
    AppsFillableFormSendEmailComponent
} from '../apps-edit-fillableform/apps-fillableform-send-email/apps-fillableform-send-email.component';

import customAppFormValidators from '../app-form-validators';
import customAppFormBindings from '../app-form-bindings';

import * as _ from 'lodash';

@Component({
    selector: 'apps-preview-fillableform',
    templateUrl: 'apps-preview-fillableform.component.html',
    providers: [
        PaymentQuery,
        { provide: 'showDocInfo', useValue: true },
    ]
})
export class AppsPreviewFillableFormComponent {
    appForm: any = null;
    customValidators = customAppFormValidators;
    customBindings = customAppFormBindings;

    private docId: string;
    private formId: string;

    constructor(
        private route: ActivatedRoute,
        private appsService: ApplicationsService,
        private modalService: NgbModal
    ) { }

    ngOnInit() {
        this.docId = this.route.params['value'].id;
        this.formId = this.route.params['value'].formId;
        return this.appsService.getFillableForm(this.docId, this.formId).then((data: FillableAppFormDoc) => {
            data.form = this.appsService.compileSchema(data.form);
            this.appForm = data;
            this.appsService.disableProperties(this.appForm.form);
        }).catch(err => console.log(err));
    }

    sendEmail() {
        const modalEditEmailTemplateRef = this.modalService.open(AppsFillableFormSendEmailComponent, Constants.ngbModalLg);
        const contactEmails = _.uniqBy(this.appForm.model.parentGuardiansForm?.parentGuardians, 'email').map((e: any) => e.email).join(', ');
        modalEditEmailTemplateRef.componentInstance.contactEmails = contactEmails;
        modalEditEmailTemplateRef.componentInstance.formId = this.formId;
        modalEditEmailTemplateRef.componentInstance.docId = this.docId;
        modalEditEmailTemplateRef.result.then((result: { action: ModalAction }) => {
            switch (result.action) {
                default: break;
            }
        }).catch((err) => modalEditEmailTemplateRef.dismiss(err));
    }

}
