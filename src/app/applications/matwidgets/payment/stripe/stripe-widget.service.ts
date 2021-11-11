import { Injectable } from '@angular/core';
import { HttpService } from 'app/services/http.service';
import { StripeFactoryService, StripeInstance } from 'ngx-stripe';
import { StripePaymentInfo } from '../payment-info';

@Injectable()
export class StripeWidgetService {
    paymentUrl = 'payment';

    constructor(
        private httpService: HttpService,
        private stripeFactory: StripeFactoryService
    ) { }

    async getStripeInstance(): Promise<StripeInstance> {
        const publicKey = await this.getPublicKey();
        return this.stripeFactory.create(publicKey);
    }

    createPaymentIntent(appId: string, formId: string): Promise<StripePaymentInfo> {
        return this.httpService.postAuth(`${this.paymentUrl}/stripe/payment-intents`, { appId, formId }) as Promise<StripePaymentInfo>;
    }

    private getPublicKey(): Promise<string> {
        return this.httpService.getAuth(`${this.paymentUrl}/stripe-public-key`).then((res: any) => res.stripePublicKey);
    }

    async setUserInPaymentIntent(appId: string, formId: string, paymentIntentId: string): Promise<void> {
        const url = `${this.paymentUrl}/stripe/payment-intent/${paymentIntentId}`;
        await this.httpService.putAuth(url, { appId, formId }).catch(err => { return; });
    }

}
