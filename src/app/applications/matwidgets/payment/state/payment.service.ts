import { Injectable } from '@angular/core';
import { HttpService } from 'app/services/http.service';
import { PaymentInfo, StripePaymentInfo } from '../payment-info';
import { PaymentStore } from './payment.store';

@Injectable()
export class PaymentService {

    constructor(
        private httpService: HttpService,
        private paymentStore: PaymentStore
    ) { }

    private set(paymentInfo: PaymentInfo) {
        this.paymentStore.update({
            amount: paymentInfo.amount,
            currency: paymentInfo.currency,
            transactionId: paymentInfo.transactionId
        });
    }

    private setStripePaymentInfo(data: StripePaymentInfo) {
        this.paymentStore.update({
            amount: data.amount,
            currency: data.currency,
            transactionId: data.transactionId,
            stripe: data.stripe
        });
    }

    async setFillableFormPaymentInfo(appId: string, formId: string): Promise<void> {
        try {
            const stripePaymentInfo = await this.httpService.getAuth(`payment/${formId}/info/${appId}`, false) as StripePaymentInfo;
            this.setStripePaymentInfo(stripePaymentInfo);
        } catch (error) {
            console.log(error);
            console.log(`PaymentInfo Document could not be found for this application, since it was like created before payment support. appId: ${appId} formId: ${formId}`);
        }
    }

    async setGeneralPaymentInfo(formId: string): Promise<void> {
        const paymentInfo = await this.httpService.getAuth(`applications/${formId}/setup/payment`) as PaymentInfo;
        this.set(paymentInfo);
    }

}
