import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlatformLocation } from '@angular/common';

import { Colors, Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { ErrorCode, ModalAction, StudentStatusCode } from 'app/common/enums';

import { UserInfo } from 'app/entities/userInfo';
import { School } from 'app/entities/school';
import { Student } from 'app/entities/student';
import { Contact } from 'app/entities/contact';

import { DownloadDialog } from 'app/components/download-dialog/download-dialog.component';
import { CopyPassword } from 'app/components/copy-password/copy-password.component';

import { PageSpinnerService } from 'app/components/page-spinner/page-spinner.service';
import { HttpService } from '../services/http.service';
import { ErrorMessageService } from '../services/error-message.service';

import { AppFormTemplate } from 'app/applications/interfaces/app-form-template';
import { AppRequest } from 'app/applications/interfaces/app-request';
import { AppForm } from './interfaces/app-form';
import { PaymentSetupDoc } from './interfaces/documents/payment-setup-doc';
import { AppFillableFormEmailDTO } from 'app/common/dto/fillable-form-email';

import * as _ from 'lodash';
import * as ZSchema from 'z-schema';

@Injectable({
    providedIn: 'root',
})
export class ApplicationsService {
    readonly BASE_URL: string = 'applications';
    readonly BASE_URL_WEBFORM: string = 'application-webform';
    readonly PROMOPAGE_LINK: string = '/' + this.BASE_URL + '/promo';
    readonly HOME_LINK: string = '/' + this.BASE_URL + '/email';
    private userInfo: UserInfo = null;
    private school: School;
    isModuleActive = false;

    constructor(
        private httpService: HttpService,
        private modalService: NgbModal,
        private pageSpinnerService: PageSpinnerService,
        private platformLocation: PlatformLocation,
        private errorMessageService: ErrorMessageService,
    ) { }

    public getSchool() {
        return this.school;
    }

    public getAppModuleStatus(): Promise<boolean> {
        this.userInfo = Utils.getUserInfoFromToken();
        return this.httpService.getAuth('schools/get/' + this.userInfo.schoolId).then((school: School) => {
            this.school = school;
            this.isModuleActive = (school && school.modules)
                ? Utils.isSchoolModuleEnabled(school.modules, Constants.schoolModules.appModule.name)
                : false;
            return this.isModuleActive;
        });
    }

    public generateContactToken(contactId: number): Promise<string> {
        return this.httpService.getAuth(`${this.BASE_URL}/contacts/${contactId}/generate-token`)
            .then((res: { contactToken: string }) => res.contactToken);
    }

    public getFormTemplates(): Promise<object> {
        return this.httpService.getAuth(this.BASE_URL + '/form-templates');
    }

    public resetMasterForm(shouldDeleteNestedForms: boolean, countryId: string, formType: string): Promise<object> {
        return this.httpService.postAuth(this.BASE_URL + '/reset-masterform', { shouldDeleteNestedForms, countryId, formType });
    }

    public getApplications(): Promise<any> {
        return this.httpService.getAuth(this.BASE_URL + '/fillable-forms');
    }

    public getApplication(id: string): Promise<any> {
        return this.httpService.getAuth(`${this.BASE_URL}/fillable-forms/${id}`);
    }

    public populateApplicationMapping(): Promise<any> {
        return this.httpService.postAuth(this.BASE_URL + '/mapping/sync', {});
    }

    public getFormTemplateById(id: string, withListOptions = false): Promise<any> {
        const query = withListOptions ? '?withListOptions=true' : '';
        return this.httpService.getAuth(`${this.BASE_URL}/form-templates/${id}${query}`);
    }

    public saveFormTemplate(documentId: string, data: AppFormTemplate): Promise<any> {
        return this.httpService.postAuth(this.BASE_URL + '/form-templates', { documentId, data });
    }

    public publishFormTemplate(documentId: string, data: AppFormTemplate): Promise<any> {
        return this.httpService.postAuth(this.BASE_URL + '/form-templates/publish', { documentId, data });
    }

    public saveAppRequestIntroduction(documentId: string, data: string): Promise<any> {
        return this.httpService.postAuth(`${this.BASE_URL}/${documentId}/setup/introduction`, { data });
    }

    public getAppRequestIntroduction(schoolUniqId: string, formId: string, shouldReplaceTags: number = 0): Promise<any> {
        return this.httpService.get(this.BASE_URL_WEBFORM + '/setup/introduction/' + schoolUniqId + '/' + formId + '/' + shouldReplaceTags);
    }

    public getPaymentSetup(formId: string): Promise<any> {
        return this.httpService.getAuth(`${this.BASE_URL}/${formId}/setup/payment`);
    }

    public updatePaymentSetup(data: PaymentSetupDoc, formId: string): Promise<any> {
        return this.httpService.postAuth(`${this.BASE_URL}/${formId}/setup/payment`, data);
    }

    public sendVerification(email: string, reCaptcha: string, schoolUniqId: string): Promise<any> {
        return this.httpService.post(this.BASE_URL_WEBFORM + '/verifications', { email, reCaptcha, schoolUniqId });
    }

    public resendVerification(email: string, schoolUniqId: string): Promise<any> {
        return this.httpService.post(this.BASE_URL_WEBFORM + '/verification-resend', { email, schoolUniqId });
    }

    public checkVerification(data: AppRequest): Promise<any> {
        return this.httpService.post(this.BASE_URL_WEBFORM + '/verification-checks', data);
    }

    public getContactsByEmail(email: string, formId: string) {
        return this.httpService.getAuth(`${this.BASE_URL}/${formId}/contacts/${email}`);
    }

    public getFillableForm(docId: string, formId: string): Promise<any> {
        return this.httpService.getAuth(`${this.BASE_URL}/${formId}/fillable-form/${docId}`);
    }

    public getFillableFormLogs(docId: string, formId: string): Promise<any> {
        return this.httpService.getAuth(`${this.BASE_URL}/${formId}/fillable-form/${docId}/logs`);
    }

    public createFillableFormWithContactAndStudent(formId: string, contact: Contact, student: Student): Promise<any> {
        return this.httpService.postAuth(`${this.BASE_URL}/${formId}/fillable-form`, { contact, student });
    }

    public createSubmittedFillableForm(formId: string, contact: Contact, student: Student, date: Date): Promise<any> {
        return this.httpService.postAuth(`${this.BASE_URL}/${formId}/submitted-fillable-form`, { contact, student, date });
    }

    public updateFillableFormModel(docId: string, formId: string, model: object): Promise<any> {
        return this.httpService.postAuth(this.BASE_URL + '/update', { docId, formId, model });
    }

    public submitFillableForm(docId: string, formId: string, useValidation = true): Promise<any> {
        if (useValidation) {
            return this.httpService.postAuth(this.BASE_URL + '/submit', { docId, formId }, false)
                .catch(async (err) => {
                    const msgColor = (err.errorCode === ErrorCode.payment_is_processing) ? Colors.warning : Colors.danger;
                    const errMsg: string = await this.errorMessageService.getMessage(err.errorCode, err.errorMessage, err?.params);
                    Utils.showNotification(errMsg, msgColor, 'bottom');
                    return Promise.reject(err);
                });
        } else {
            return this.httpService.postAuth(this.BASE_URL + '/submit-no-validation', { docId, formId });
        }
    }

    public getFillableFormSummaries(formId: string): Promise<any> {
        return this.httpService.getAuth(`${this.BASE_URL}/${formId}/fillable-form-summaries`);
    }

    public updateFillableFormStatus(docId: string, formId: string, appStatus: string, model: object): Promise<any> {
        return this.httpService.postAuth(this.BASE_URL + '/update-status', { docId, formId, appStatus, model });
    }

    public getFirstSubmittedFillableSnapshot(docId: string, formId: string): Promise<any> {
        return this.httpService.getAuth(`${this.BASE_URL}/${formId}/fillable-form/${docId}/first-submitted`, false);
    }

    public getActiveFillableFormSnapshot(docId: string, formId: string): Promise<any> {
        return this.httpService.getAuth(`${this.BASE_URL}/${formId}/fillable-form/${docId}/active`, false);
    }

    public deleteFillableForms(docIds: string[], formId: string): Promise<any> {
        const query = `?ids=${docIds}`;
        return this.httpService.deleteAuth(`${this.BASE_URL}/${formId}/fillable-form${query}`);
    }

    public getStudentStatusByCode(code: StudentStatusCode): Promise<any> {
        return this.httpService.getAuth('student-status/get-by-code/' + code);
    }

    public uploadAppFiles(docId: string, formId: string, sectionId: string, sendableFormData: FormData, userName: string): Promise<any> {
        const query = `?userName=${userName}`;
        return this.httpService.postAuthImg(`file/${formId}/${docId}/sections/${sectionId}${query}`, sendableFormData);
    }

    public removeAppFile(docId: string, formId: string, sectionId: string, name: string): Promise<any> {
        return this.httpService.deleteAuth(`file/${formId}/${docId}/sections/${sectionId}/documents/${encodeURIComponent(name)}`);
    }

    public downloadAppFile(docId: string, formId: string, sectionId: string, name: string): Promise<any> {
        return this.httpService.getAuth(`file/${formId}/${docId}/sections/${sectionId}/documents/${encodeURIComponent(name)}`);
    }

    public setContactToken(contactId: number) {
        return this.httpService.post(this.BASE_URL_WEBFORM + '/contact-token', { contactId });
    }

    public compileSchema(form: AppForm): AppForm {
        const zschema = new ZSchema({}) as any;
        zschema.compileSchema(form);
        return zschema.getResolvedSchema(form);
    }

    public disableProperties(data) {
        if (data?.definitions) {
            Object.keys(data.definitions).map(rootProp => this.disableProperties(data.definitions[rootProp]));
        }
        if (data?.properties) {
            Object.keys(data.properties).map(rootProp => this.disableProperties(data.properties[rootProp]));
        } else if (data?.items?.properties) {
            if (data?.type) data.readOnly = true;
            Object.keys(data.items.properties).map(rootProp => this.disableProperties(data.items.properties[rootProp]));
        } else {
            data.readOnly = true;
        }
    }

    public deleteVisibleIfFromSignature(form: AppForm) {
        delete form.properties.signature.properties.signatures['items'].properties.signatureAgree.visibleIf;
        delete form.properties.signature.properties.signatures['items'].properties.signatureCapture.visibleIf;
    }

    public getAppStudentMapping(studentId: number): Promise<any> {
        return this.httpService.getAuth(`${this.BASE_URL}/mapping/student/${studentId}`);
    }

    public sendEmail(docId: string, formId: string, data: AppFillableFormEmailDTO): Promise<any> {
        return this.httpService.postAuth(`${this.BASE_URL}/${formId}/fillable-form/email/${docId}`, { data });
    }

    public exportFillableForms(formId: string, applicationIds: string[]): Promise<any> {
        return this.httpService.postAuth(`${this.BASE_URL}/${formId}/fillable-forms/exports`, { applicationIds });
    }

    public download(formId: string, data: object): Promise<any> {
        return this.httpService.postAuth(`${this.BASE_URL}/${formId}/download-documents`, data)
    }

    downloadDocuments(formId: string, applicationIds: string[]): Promise<any> {
        const appsDownloadDialogRef = this.modalService.open(DownloadDialog, Constants.ngbModalMd);
        appsDownloadDialogRef.result.then((res: { action: ModalAction, password?: string }) => {
            switch (res.action) {
                case ModalAction.Done:
                    const promise = this.download(formId,
                        { password: res.password, applicationIds }
                    ).then((pass: string) => {
                        const copyPasswordRef = this.modalService.open(CopyPassword, Constants.ngbModalMd);
                        copyPasswordRef.componentInstance.password = pass;
                    });
                    this.pageSpinnerService.display(promise, 'Downloading...');
                    break;
                default: break;
            }
        });
        this.platformLocation.onPopState(() => {
            appsDownloadDialogRef.close({ action: ModalAction.LeavePage });
        });
        return appsDownloadDialogRef.result;
    }

}
