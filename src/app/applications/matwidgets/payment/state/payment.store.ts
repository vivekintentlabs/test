import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { PaymentStoreInfo } from './payment.model';

export function createInitialState(): PaymentStoreInfo {
    return {
        amount: 0,
        currency: '',
        stripe: {
            paymentIntent: {
                id: '',
                clientSecret: '',
                status: '',
                receipt_number: '',
            }
        }
    };
}

@Injectable({
    providedIn: 'root',
})
@StoreConfig({ name: 'payment' })
export class PaymentStore extends Store<PaymentStoreInfo> {
    constructor() {
        super(createInitialState());
    }

}
