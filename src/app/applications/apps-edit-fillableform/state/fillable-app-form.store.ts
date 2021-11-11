import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { ApplicationStatus } from 'app/common/enums';
import { TimeStamp } from 'app/applications/interfaces/types';
import { DocUpload, FeeResponsibility, PaymentStatus, StudentData } from './fillable-app-form.model';

export interface FillableAppFormState {
    docUploads: DocUpload[];
    feeResponsibilities: FeeResponsibility[];
    appUpdatedAt: TimeStamp;
    studentData: StudentData;
    model: {};
    formChanged: number;
    appStatus: ApplicationStatus;
    isValid: boolean;
    paymentStatus: PaymentStatus;
}

export function createInitialState(): FillableAppFormState {
    return {
        docUploads: [],
        feeResponsibilities: [],
        appUpdatedAt: null,
        studentData: null,
        model: {},
        formChanged: 0,
        appStatus: null,
        isValid: false,
        paymentStatus: null
    };
}

@Injectable()
@StoreConfig({ name: 'store-fillable-app-form' })
export class FillableAppFormStore extends Store<FillableAppFormState> {

    constructor() {
        super(createInitialState());
    }

    updateDocUploads(docUploads: DocUpload[]) {
        this.update({ docUploads });
    }

    updateFeeResponsibilities(feeResponsibilities: FeeResponsibility[]) {
        this.update({ feeResponsibilities });
    }

    updateAppUpdatedAt(appUpdatedAt: TimeStamp) {
        this.update({ appUpdatedAt });
    }

    updateStudentData(studentData: StudentData) {
        this.update({ studentData });
    }

    updateModel(model: object) {
        this.update({ model });
    }

    updateFormChanged(formChanged: number) {
        this.update({ formChanged });
    }

    updateAppStatus(appStatus: ApplicationStatus) {
        this.update({ appStatus });
    }

    updateIsValid(isValid: boolean) {
        this.update({ isValid });
    }

    updatePaymentStatus(paymentStatus: PaymentStatus) {
        this.update({ paymentStatus });
    }

}
