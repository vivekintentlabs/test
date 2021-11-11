import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { merge, BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, auditTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';

import { ApplicationsService } from 'app/applications/applications.service';
import { PaymentService } from '../matwidgets/payment/state/payment.service';
import { AppsFormSubmitModalComponent } from './apps-form-submit-modal/apps-form-submit-modal.component';
import { PaymentQuery } from '../matwidgets/payment/state/payment.query';

import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { AppConstants } from '../constants';

import { FillableAppFormDoc } from '../interfaces/documents/fillable-app-form-doc';
import { ModalAction } from 'app/common/enums';

import customAppFormValidators from '../app-form-validators';
import customAppFormBindings from '../app-form-bindings';

import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
    selector: 'apps-form',
    templateUrl: 'apps-form.component.html',
    styleUrls: ['apps-form.component.scss'],
    providers: [
        PaymentService,
        PaymentQuery,
        { provide: 'allowToPay', useValue: true }
    ]
})
export class AppsFormComponent implements OnInit, OnDestroy {
    appForm: any = null;
    formId: string;
    docId: string;
    formOutput: Subject<any> = null;
    promiseForBtn: Promise<any>;
    updatePromise: Promise<any> = Promise.resolve();
    customValidators = customAppFormValidators;
    customBindings = customAppFormBindings;
    isValidForm: boolean;
    isPristine = true;
    private shouldAutoSave = true;
    private unsubscribe = new Subject<void>();
    incompleteFormText = Constants.incompleteFormText;
    isAllowedInvalidAppSubmission = environment.isAllowedInvalidAppSubmission;
    modalEditEmailTemplateRef = null;

    constructor(
        public appsService: ApplicationsService,
        private paymentService: PaymentService,
        private route: ActivatedRoute,
        private router: Router,
        private translate: TranslateService,
        private modalService: NgbModal,
    ) {
        this.translate.use(Utils.getUserInfoFromToken().locale);
    }

    /**
     * Inits component data, a native callback method
     * @return {void}
     */
    ngOnInit() {
        this.formId = this.route.params['value'].formId;
        this.docId = this.route.params['value'].id;
        if (this.docId) {
            this.paymentService.setFillableFormPaymentInfo(this.docId, this.formId);
            return this.appsService.getFillableForm(this.docId, this.formId).then((data: FillableAppFormDoc) => {
                data.form = this.appsService.compileSchema(data.form);
                this.appForm = data;
                window.scrollTo(0, 0);
                this.initAutoSave();

                const currentUtcDate = moment.utc().format(Constants.dateFormats.date);

                if (this.appForm.form.properties.studentForm?.properties?.dateOfBirth) {
                    this.appForm.form.properties.studentForm.properties.dateOfBirth.maxDate = currentUtcDate;
                }

                _.forEach(this.appForm.form.properties.studentForm?.properties?.li_faithCertificates?.properties, faithCertificate => {
                    faithCertificate.properties.date.maxDate = currentUtcDate;
                });
            });
        }
    }

    formOutputChanged(value) {
        if (this.formOutput) {
            this.formOutput.next(value);
            this.isPristine = false;
        }
    }

    private showSubmitModalDialog() {
        this.modalEditEmailTemplateRef = this.modalService.open(AppsFormSubmitModalComponent, Constants.ngbModalMd);
        this.modalEditEmailTemplateRef.result.then((result: { action: ModalAction }) => {
            switch (result.action) {
                case ModalAction.Done:
                    this.modalEditEmailTemplateRef = null;
                    break;
                default:
                    break;
            }
        }).catch((err) => this.modalEditEmailTemplateRef.dismiss(err));
    }

    isValid(value: boolean) {
        this.isValidForm = value;
        if (this.appForm?.model?.payment?.hasPaid && this.isValidForm && this.modalEditEmailTemplateRef === null) {
            this.showSubmitModalDialog();
        }
    }

    onErrorsChange(value) {
        if (environment.logAppModuleErrors) {
            console.log(value);
        }
    }

    initAutoSave() {
        this.formOutput = new BehaviorSubject(this.appForm.model);

        const afterTyping = this.formOutput.pipe(debounceTime(AppConstants.appFormAfterTypingSaveInMs));
        const whileTyping = this.formOutput.pipe(auditTime(AppConstants.appFormWhileTypingSaveInMs));

        merge(whileTyping, afterTyping).pipe(distinctUntilChanged(), filter(() => this.shouldAutoSave), takeUntil(this.unsubscribe))
            .subscribe(() => {
                this.updateFillableFormModel();
            });
    }

    private updateFillableFormModel(): Promise<void> {
        return this.updatePromise.then(() => {
            return this.updatePromise = this.appsService.updateFillableFormModel(this.docId, this.formId, this.appForm.model)
                .then(() => {
                    this.isPristine = true;
                })
                .catch(console.error)
        });
    }

    onSubmit(useValidation = true): Promise<void> {
        this.shouldAutoSave = false;
        return this.promiseForBtn = this.updateFillableFormModel().then(() => {
            return this.appsService.submitFillableForm(this.docId, this.formId, useValidation).then(() => {
                this.formOutput.complete(); // stop autosave, as it creates duplicate snapshots
                const studentName = this.appForm.model.studentForm.firstName + ' ' + this.appForm.model.studentForm.lastName;
                this.router.navigate(['/submit-succeeded', { appId: this.docId, formId: this.formId, studentName }]);
            });
        }).catch((err) => {
            this.shouldAutoSave = true;
            this.promiseForBtn = null;
            console.log(err);
        });
    }

    @HostListener('window:beforeunload')
    onBeforeUnload = () => this.isPristine;

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }
}
