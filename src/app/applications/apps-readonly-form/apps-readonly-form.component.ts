import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { ApplicationsService } from 'app/applications/applications.service';
import { ErrorMessageService } from '../../services/error-message.service';
import { PaymentService } from '../matwidgets/payment/state/payment.service';
import { PaymentQuery } from '../matwidgets/payment/state/payment.query';

import { Constants } from 'app/common/constants';
import { Colors, Utils } from 'app/common/utils';
import { ContactClaim, ResponseMessage } from 'app/common/interfaces';
import { AppType } from 'app/common/enums';
import { SnapshotFillableAppForm } from '../interfaces/snapshot-fillable-app-form';
import { TimeStamp } from '../interfaces/types';

function showDocInfo(comp: AppsReadonlyFormComponent) {
    return !Utils.getUserInfoFromToken().isSchoolContact() && !comp.isFirstSubmitted;
}

@Component({
    selector: 'apps-readonly-form',
    templateUrl: 'apps-readonly-form.component.html',
    styleUrls: ['apps-readonly-form.component.scss'],
    providers: [
        { provide: 'showDocSectionStatus', useFactory: showDocInfo, deps: [AppsReadonlyFormComponent] },
        { provide: 'showAdminUse', useExisting: 'showDocSectionStatus' },
        { provide: 'showDocInfo', useFactory: showDocInfo, deps: [AppsReadonlyFormComponent] },
        PaymentService,
        PaymentQuery
    ]
})
export class AppsReadonlyFormComponent implements OnInit {
    snapshotData: SnapshotFillableAppForm = null;
    docId: string;
    formId: string;
    source = null;
    submitBtnPromise: Promise<any>;
    dateFormat = Constants.localeFormats.dateTime;
    contactClaim: ContactClaim = null;
    hasError = false;
    appType = '';
    applicationDateText: string;
    applicationDateValue: TimeStamp;
    isFirstSubmitted = true;
    isSchoolContact = false;

    constructor(
        public appsService: ApplicationsService,
        private paymentService: PaymentService,
        private route: ActivatedRoute,
        private translate: TranslateService,
        private errorMessageService: ErrorMessageService,
    ) {
        this.translate.use(Utils.getUserInfoFromToken().locale);
    }

    /**
     * Inits component data, a native callback method
     * @return {void}
     */
    ngOnInit() {
        this.isSchoolContact = Utils.getUserInfoFromToken().isSchoolContact();
        this.docId = this.route.params['value'].id;
        this.formId = this.route.params['value'].formId;
        if (this.docId) {
            this.contactClaim = Utils.getContactInfoFromToken();
            this.appType = this.route.queryParams['value'].type;
            this.paymentService.setFillableFormPaymentInfo(this.docId, this.formId);
            return this.getFillableForm();
        }
    }

    getFillableForm() {
        this.hasError = false;
        let fn;
        switch (this.appType) {
            case AppType.active:
                this.isFirstSubmitted = false;
                fn = this.appsService.getActiveFillableFormSnapshot(this.docId, this.formId);
                break;
            default:
                this.isFirstSubmitted = true;
                fn = this.appsService.getFirstSubmittedFillableSnapshot(this.docId, this.formId);
                break;
        }
        return fn.then((data: SnapshotFillableAppForm) => {
            this.applicationDateText = this.appType === AppType.active ? 'Last Updated Date' : 'Date Submitted';
            
            data.fillableAppFormDoc.form.widget = 'readonly';
            this.applicationDateValue = data.fillableAppFormDoc.updatedAt;
            this.appsService.disableProperties(data.fillableAppFormDoc.form);
            this.appsService.deleteVisibleIfFromSignature(data.fillableAppFormDoc.form);
            this.snapshotData = data;
            this.hasError = false;
        }).catch(async (error: ResponseMessage) => {
            const errMsg: string = await this.errorMessageService.getMessage(error.errorCode, error.errorMessage, error?.params);
            Utils.showNotification(errMsg, Colors.warning);
            setTimeout(() => {
                this.hasError = true;
            }, Constants.showNotificationInMs + 1000);
            return Promise.reject(error);
        });
    }

    download(): void {
        this.appsService.downloadDocuments(this.formId, [this.docId]);
    }
}
