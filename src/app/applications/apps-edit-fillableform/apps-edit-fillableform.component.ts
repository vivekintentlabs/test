import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { BehaviorSubject, Subject } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { HttpService } from 'app/services/http.service';
import { PaymentService } from 'app/applications/matwidgets/payment/state/payment.service';
import { PaymentQuery } from '../matwidgets/payment/state/payment.query';
import { ApplicationsService } from 'app/applications/applications.service';

import { Application } from 'app/entities/application';
import { Utils, Colors } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { AppConstants } from '../constants';
import { AppFormTemplate } from '../interfaces/app-form-template';
import { FillableAppFormDoc } from '../interfaces/documents/fillable-app-form-doc';
import { TimeStamp } from '../interfaces/types';
import { AppStatusLog } from '../interfaces/app-status-log';
import { AppStatusLogsDoc } from '../interfaces/documents/app-status-logs-doc';
import { FillableAppFormQuery } from './state/fillable-app-form.query';
import { FillableAppFormStore } from './state/fillable-app-form.store';
import { FillableAppFormService } from './state/fillable-app-form.service';
import { DocUpload, FeeResponsibility, PaymentStatus, StudentData } from './state/fillable-app-form.model';
import { ApplicationStatus, ModalAction, PageLeaveReason } from 'app/common/enums';
import { AppsFillableFormSendEmailComponent } from './apps-fillableform-send-email/apps-fillableform-send-email.component';

import customAppFormValidators from '../app-form-validators';
import customAppFormBindings from '../app-form-bindings';

import * as _ from 'lodash';

@Component({
    selector: 'apps-edit-fillableform',
    templateUrl: 'apps-edit-fillableform.component.html',
    providers: [
        FillableAppFormQuery,
        FillableAppFormService,
        FillableAppFormStore,
        PaymentService,
        PaymentQuery,
        { provide: 'showDocSectionStatus', useValue: true },
        { provide: 'showAdminUse', useExisting: 'showDocSectionStatus' },
        { provide: 'showDocInfo', useValue: true },
        { provide: 'allowToPay', useValue: true }
    ]
})
export class AppsEditFillableFormComponent {
    isSticky = false;
    appFormTemplate: AppFormTemplate = null;
    formGroup: FormGroup;
    appForm: any = null;
    docId: string;
    formId: string;
    source = null;
    customValidators = customAppFormValidators;
    customBindings = customAppFormBindings;
    unsubscribe = new Subject<void>();
    studentStatus: string;
    dateSubmitted: TimeStamp;
    applicationStatus: string;
    ApplicationStatusFinalized = ApplicationStatus.Finalized;
    formChanged = 0;
    isSubmitted = false;
    modelLoaded$ = this.fillableAppFormQuery.model$.pipe(map((model) => !_.isEmpty(model)));
    exportDate: string;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private httpService: HttpService,
        private modalService: NgbModal,
        private appsService: ApplicationsService,
        private fillableAppFormQuery: FillableAppFormQuery,
        private fillableAppFormService: FillableAppFormService,
        private paymentService: PaymentService,
    ) { }

    /**
     * Inits component data, a native callback method
     * @return {void}
     */
    ngOnInit() {
        this.docId = this.route.params['value'].id;
        this.formId = this.route.params['value'].formId;
        return this.appsService.getFillableForm(this.docId, this.formId).then((data: FillableAppFormDoc) => {
            data.form = this.appsService.compileSchema(data.form);
            this.appForm = data;
            let isFirstLoaded = true;
            let documentCountNumber = this.getDocumentCountNumber(this.appForm.model.documents);
            this.applicationStatus = data.applicationStatus;
            this.fillableAppFormService.setAppUpdatedAt(data.updatedAt);
            this.fillableAppFormService.setAppStatus(data.applicationStatus);
            this.fillableAppFormQuery.formChanged$.pipe(takeUntil(this.unsubscribe)).subscribe((i: number) => this.formChanged = i);
            this.fillableAppFormQuery.appStatus$.pipe(takeUntil(this.unsubscribe)).subscribe((appStatus: ApplicationStatus) => {
                if (appStatus) this.appForm.applicationStatus = appStatus;
                this.makeReadonly();
            });

            this.source = new BehaviorSubject(this.appForm.model);
            this.source.pipe(debounceTime(AppConstants.appFormAfterTypingUpdateViewsInMs), takeUntil(this.unsubscribe)).subscribe((model) => {
                // we skip change of documents as uploaded/deleted a document is always autosaved
                this.fillableAppFormService.setModel(model);
                const curDocumentCountNumber = this.getDocumentCountNumber(model.documents);
                const isDocumentsCountModified = (curDocumentCountNumber !== documentCountNumber);
                documentCountNumber = curDocumentCountNumber;

                if (!isDocumentsCountModified) {
                    if (!isFirstLoaded) this.fillableAppFormService.setFormChanged();
                    this.setAppInfoPanel(model);
                }
                isFirstLoaded = false;
            });
            this.paymentService.setFillableFormPaymentInfo(this.docId, this.formId);
            return Promise.all([
                this.getApplication(),
                this.getAppDateSubmitted(),
                this.getStudentStatus(),
            ]);
        }).catch(err => console.log(err));
    }

    makeReadonly() {
        if (this.appForm.applicationStatus === ApplicationStatus.Finalized) {
            this.appForm.form.readOnly = true;
            this.appsService.disableProperties(this.appForm.form);
            this.unsubscribe.next();
            this.unsubscribe.complete();
        }
    }

    private getDocumentCountNumber(documents): number {
        if (!(documents?.length)) {
            return 0;
        }
        return _.reduce(Object.keys(documents), (sum, doc) => {
            return sum + documents[doc].documents.length;
        }, 0);
    }

    private setAppInfoPanel(model) {
        if (model.documents && Object.keys(model.documents).length) {
            const docUploads: DocUpload[] = this.fillableAppFormService.extractDocUploads(model.documents,
                this.appForm.form.properties.documents);
            this.fillableAppFormService.setDocUploads(docUploads);
        }
        if (model.parentGuardiansForm?.parentGuardians.length) {
            const parentGuardianModel = model.parentGuardiansForm?.parentGuardians;
            const parentGuardiaSchema = this.appForm.form.properties.parentGuardiansForm.properties.parentGuardians.items.properties;
            const feeResponsibilities: FeeResponsibility[] = this.fillableAppFormService.extractFeeResponsibilities(parentGuardianModel, parentGuardiaSchema);
            this.fillableAppFormService.setFeeResponsibilities(feeResponsibilities);
        }
        const studentData: StudentData = this.fillableAppFormService.extractStudentData(model.studentForm, this.appForm.form.properties.studentForm.properties);
        this.fillableAppFormService.setStudentData(studentData);

        if (model.payment?.paymentStatusPanel) {
            const paymentStatus: PaymentStatus = this.fillableAppFormService.extractPaymentStatus(model.payment.paymentStatusPanel,
                this.appForm.form.properties.payment.properties.paymentStatusPanel);
            this.fillableAppFormService.setPaymentStatus(paymentStatus);
        }
    }

    private getAppDateSubmitted(): Promise<TimeStamp | null> {
        return this.appsService.getFillableFormLogs(this.docId, this.formId).then((appStatusLogsDoc: AppStatusLogsDoc) => {
            this.dateSubmitted = _.find(appStatusLogsDoc.logs, l => l.appStatus === ApplicationStatus.Submitted)?.dateTime;
            return this.dateSubmitted;
        });
    }

    private getStudentStatus() {
        return this.httpService.getAuth(`student/${this.appForm.metaData.studentId}/status`)
            .then((studentStatusData: any) => {
                this.studentStatus = (studentStatusData?.studentStatus?.status) ? studentStatusData.studentStatus.status : '';
                return studentStatusData;
            });
    }

    private getApplication(): Promise<Application> {
        return this.appsService.getApplication(this.docId).then((app: Application) => {
            this.exportDate = app.exportDate;
            return app;
        });
    }

    onChange(value: object) {
        if (this.source) {
            this.source.next(value);
        }
    }

    isValid(value: boolean) {
        this.fillableAppFormService.setIsValid(value);
    }

    onSubmit(): Promise<boolean> {
        this.isSubmitted = true;
        return this.appsService.updateFillableFormModel(this.docId, this.formId, this.appForm.model).then((res) => {
            if (res.updatedAt) {
                this.fillableAppFormService.setAppUpdatedAt(res.updatedAt);
            }
            this.isSubmitted = false;
            this.fillableAppFormService.resetFormChanged();
            Utils.showNotification('Form successfully saved.', Colors.success);
            return true;
        }).catch((err) => {
            this.isSubmitted = false;
            return false;
        });
    }

    onCancel() {
        this.router.navigate(['/applications/index']);
    }

    sendEmail() {
        const modalEditEmailTemplateRef = this.modalService.open(AppsFillableFormSendEmailComponent, Constants.ngbModalLg);
        modalEditEmailTemplateRef.componentInstance.docId = this.docId;
        modalEditEmailTemplateRef.componentInstance.formId = this.formId;
        const contactEmails = _.uniqBy(this.appForm.model.parentGuardiansForm?.parentGuardians, 'email').map((e: any) => e.email).join(', ');
        modalEditEmailTemplateRef.componentInstance.contactEmails = contactEmails;
        modalEditEmailTemplateRef.result.then((result: { action: ModalAction }) => {
            switch (result.action) {
                case ModalAction.Done:
                    break;
                default:
                    break;
            }
        }).catch((err) => modalEditEmailTemplateRef.dismiss(err));
    }

    download(): void {
        this.appsService.downloadDocuments(this.formId, [this.docId]);
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

    canDeactivate(): Promise<boolean> {
        return Utils.canDeactivate(this.formChanged, this.isSubmitted, true).then((can) => {
            if (can === PageLeaveReason.save) {
                return this.onSubmit();
            } else if (can === PageLeaveReason.goBack) {
                return false;
            } else if (can === PageLeaveReason.doNotSave) {
                return true;
            }
        });
    }

}
