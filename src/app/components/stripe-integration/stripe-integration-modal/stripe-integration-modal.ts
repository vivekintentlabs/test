import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Utils } from 'app/common/utils';

import { HttpService } from 'app/services/http.service';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalAction } from 'app/common/enums';

@Component({
    selector: 'app-stripe-integration-modal',
    templateUrl: 'stripe-integration-modal.html'
})
export class StripeIntegrationModalComponent {
    @Input() requiredKeyMinLength: number;
    @Input() requiredKeyMaxLength: number;
    @Input() formGroup: FormGroup;
    hide = true;
    promiseForBtn: Promise<any>;

    constructor(
        private httpService: HttpService,
        private activeModal: NgbActiveModal) {
    }

    onSave() {
        return this.promiseForBtn = new Promise<any>((resolve, reject) => {
            this.httpService.postAuth('schools/stripe-key-pair', this.formGroup.value).then(() => {
                this.formGroup.markAsPristine();
                Utils.showSuccessNotification();
                this.promiseForBtn = null;
                this.activeModal.close({ action: ModalAction.Update, fakeStripeSecretKey: this.formGroup.controls.stripeSecretKey.value });
                resolve(true);
            }).catch(err => {
                this.promiseForBtn = null;
                reject(err);
            });
        });
    }

    onCancel() {
        this.promiseForBtn = null;
        this.activeModal.close({ action: ModalAction.Cancel });
    }

}
