import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { PaymentStoreInfo } from './payment.model';
import { PaymentStore } from './payment.store';

@Injectable()
export class PaymentQuery extends Query<PaymentStoreInfo> {
    paymentData$ = this.select(state => state);

    constructor(protected store: PaymentStore) {
        super(store);
    }

}
