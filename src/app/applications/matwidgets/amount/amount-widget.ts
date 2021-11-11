import { Component } from '@angular/core';
import { StringWidget } from 'ngx-schema-form';
import { Observable } from 'rxjs';

import { PaymentStoreInfo } from '../payment/state/payment.model';
import { PaymentQuery } from '../payment/state/payment.query';


@Component({
    selector: 'amount-widget',
    templateUrl: './amount-widget.html'
})
export class AmountWidget extends StringWidget {

    paymentData$: Observable<PaymentStoreInfo>;

    constructor(
        private paymentQuery: PaymentQuery
    ) {
        super();
    }

    ngAfterViewInit() {
        super.ngAfterViewInit();

        this.paymentData$ = this.paymentQuery.paymentData$;
    }

}
