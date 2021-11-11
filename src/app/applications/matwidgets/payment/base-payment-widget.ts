import { Directive } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { ControlWidget } from 'ngx-schema-form';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import * as _ from 'lodash';

@Directive()
export abstract class BasePaymentWidget extends ControlWidget {
    protected paymentTranslations = null;
    protected appId: string;
    protected formId: string;

    errorMsg: string;
    confirmationMsg: string;

    protected unsubscribe = new Subject<void>();

    constructor(
        protected route: ActivatedRoute,
        protected translate: TranslateService
    ) {
        super();
        this.translate.get('payment').pipe(takeUntil(this.unsubscribe)).subscribe((paymentTranslations: any) => {
            this.paymentTranslations = paymentTranslations;
            this.confirmationMsg = this.paymentTranslations.msgThanks;
        });
        this.appId = this.route.params['value'].id;
        this.formId = this.route.params['value'].formId;
    }

    ngOnInit() {
        this.initPayment();
    }

    protected abstract initPayment(): void;

    abstract pay(): void;

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

}
