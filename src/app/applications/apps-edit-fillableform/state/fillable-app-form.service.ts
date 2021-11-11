import { Injectable } from '@angular/core';
import { DocUpload, FeeResponsibility, PaymentStatus, StudentData } from './fillable-app-form.model';
import { FillableAppFormStore } from './fillable-app-form.store';
import { ApplicationStatus } from 'app/common/enums';
import { TimeStamp } from 'app/applications/interfaces/types';
import { AppConstants } from 'app/applications/constants';
import { PaymentType } from 'app/common/enums/paymentType';

import * as _ from 'lodash';

@Injectable()
export class FillableAppFormService {

    constructor(private fillableAppFormStore: FillableAppFormStore) { }

    setDocUploads(docUploads: DocUpload[]) {
        this.fillableAppFormStore.updateDocUploads(docUploads);
    }

    extractDocUploads(documents, schema): DocUpload[] {
        const docUploads: DocUpload[] = [];
        _.forEach(schema.fieldsets[0].fields, docKey => {
            if (documents.hasOwnProperty(docKey)) {
                const name = schema.properties[docKey].title;
                // temporary, default id and status, this can be removed if document will not have `no item selected` option
                let id = 0, tooltip = 'Not Verified';
                let uiState = tooltip.toLowerCase().replace(/ /g, '');
                if (documents[docKey].li_documentSectionStatus) {
                    id = documents[docKey].li_documentSectionStatus;
                    const description = _.find(schema.properties[docKey].properties.li_documentSectionStatus.oneOf, (val) => val.enum[0] === id).description;
                    uiState = description.toLowerCase().replace(/ /g, '');
                    tooltip = description;
                }
                docUploads.push({ id, name, uiState, tooltip });
            }
        });
        return docUploads;
    }

    extractPaymentStatus(model, schema): PaymentStatus {
        const name = schema.properties.payment_status.title;
        let id = 0, tooltip = 'Not Verified';
        let uiState = tooltip.toLowerCase().replace(/ /g, '');
        if (model.payment_status) {
            id = model.payment_status;
            const description = _.find(schema.properties.payment_status.oneOf, (val) => val.enum[0] === id).description;
            uiState = description.toLowerCase().replace(/ /g, '');
            tooltip = description;
        }
        const paymentType = model.paymentType;
        let paymentMethod = 'Credit/Debit Card';
        if (paymentType === PaymentType.payLater) {
            const options = schema.properties.li_payLaterOptions.oneOf;
            paymentMethod = _.find(options, i => i.enum[0] === model.li_payLaterOptions)?.description || 'No Payment Method selected';
        }
        return { id, name, uiState, tooltip, paymentType, paymentMethod };
    }

    getDocUploads() {
        return this.fillableAppFormStore.getValue().docUploads;
    }

    setFeeResponsibilities(feeResponsibility: FeeResponsibility[]) {
        this.fillableAppFormStore.updateFeeResponsibilities(feeResponsibility);
    }

    extractFeeResponsibilities(parentGuardians, schema): FeeResponsibility[] {
        const feeResponsibilities: FeeResponsibility[] = [];
        _.forEach(parentGuardians, parentGuardian => {
            let firstName = parentGuardian.firstName,
                lastName = parentGuardian.lastName,
                description;
            if (parentGuardian.hasOwnProperty("li_feeResponsibility")) {
                description = _.find(schema.li_feeResponsibility.oneOf, (val) => val.enum[0] === parentGuardian.li_feeResponsibility).description;
            }
            feeResponsibilities.push({ firstName, lastName, description });
        });
        return feeResponsibilities;
    }

    setAppUpdatedAt(appUpdatedAt: TimeStamp) {
        this.fillableAppFormStore.updateAppUpdatedAt(appUpdatedAt);
    }

    extractStudentData(model, schema): StudentData {
        let intakeYearLevel = '';
        if (model.hasOwnProperty(AppConstants.schoolIntakeYearProperty)) {
            intakeYearLevel = _.find(schema[AppConstants.schoolIntakeYearProperty].oneOf,
                              (val) => val.enum[0] === model[AppConstants.schoolIntakeYearProperty])?.description;
        }
        const studentData: StudentData = {
            firstName: model.firstName,
            lastName: model.lastName,
            startingYear: model.startingYear || '',
            intakeYearLevel
        };
        return studentData;
    }

    setStudentData(studentData: StudentData) {
        this.fillableAppFormStore.updateStudentData(studentData);
    }

    getStudentData(): StudentData {
        return this.fillableAppFormStore.getValue().studentData;
    }

    setModel(model: object): void {
        this.fillableAppFormStore.updateModel(model);
    }

    getModel(): object {
        return this.fillableAppFormStore.getValue().model;
    }

    resetFormChanged(): void {
        this.fillableAppFormStore.updateFormChanged(0);
    }

    setFormChanged(): void {
        this.fillableAppFormStore.updateFormChanged(this.fillableAppFormStore.getValue().formChanged + 1);
    }

    setAppStatus(appStatus: ApplicationStatus): void {
        this.fillableAppFormStore.updateAppStatus(appStatus);
    }

    setIsValid(isValid: boolean) {
        this.fillableAppFormStore.updateIsValid(isValid);
    }

    setPaymentStatus(paymentStatus: PaymentStatus): void {
        this.fillableAppFormStore.updatePaymentStatus(paymentStatus);
    }
}
