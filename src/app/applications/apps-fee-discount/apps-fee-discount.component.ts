import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { BaseForm } from '../../base-form';
import { Utils } from '../../common/utils';
import { PaymentType } from 'app/common/enums/paymentType';
import { ApplicationsService } from '../applications.service';
import { PaymentSetupDoc } from '../interfaces/documents/payment-setup-doc';

@Component({
    selector: 'app-fee-discount',
    templateUrl: 'apps-fee-discount.component.html'
})

export class AppsFeeDiscountComponent extends BaseForm implements OnInit {
    @Input() formId: string;
    paymentTypes: object = PaymentType;
    loaded = false;

    constructor(private fb: FormBuilder, public appsService: ApplicationsService) {
        super();
    }

    public ngOnInit() {
        return this.appsService.getPaymentSetup(this.formId)
            .then((paymentSetupDoc: PaymentSetupDoc) => {
                this.createForm(paymentSetupDoc);
            }).catch(console.error);
    }

    onSubmit() {
        this.submit();
    }

    createForm(paymentSetupDoc: PaymentSetupDoc) {
        this.formGroup = this.fb.group({
            amount: [paymentSetupDoc.amount, Validators.compose([Validators.min(1)])],
            currency: [paymentSetupDoc.currency, Validators.compose([Validators.minLength(3), Validators.maxLength(3)])],
            paymentType: [paymentSetupDoc.paymentType, Validators.required],
        });
        this.loaded = true;
        this.listenToFormChanges();
    }

    protected doSubmit(): Promise<void> {
        return this.appsService.updatePaymentSetup(this.formGroup.value, this.formId).then(() => {
            Utils.showSuccessNotification();
            return Promise.resolve();
        });
    }
}
