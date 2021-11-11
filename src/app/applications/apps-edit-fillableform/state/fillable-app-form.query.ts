import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { FillableAppFormState, FillableAppFormStore } from './fillable-app-form.store';

@Injectable()
export class FillableAppFormQuery extends Query<FillableAppFormState> {
    docUploads$ = this.select(state => state.docUploads);
    feeResponsibilities$ = this.select(state => state.feeResponsibilities);
    appUpdatedAt$ = this.select(state => state.appUpdatedAt);
    studentData$ = this.select(state => state.studentData);
    model$ = this.select(state => state.model);
    formChanged$ = this.select(state => state.formChanged);
    appStatus$ = this.select(state => state.appStatus);
    isValid$ = this.select(state => state.isValid);
    paymentStatus$ = this.select(state => state.paymentStatus);

    constructor(protected store: FillableAppFormStore) {
        super(store);
    }
}
