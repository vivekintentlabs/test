import { Component, Inject, Optional, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { PaymentIntentResult, StripeCardElementOptions } from '@stripe/stripe-js';
import { StripeCardComponent, StripeInstance } from 'ngx-stripe';

import { StripeWidgetService } from './stripe-widget.service';
import { PageSpinnerService } from 'app/components/page-spinner/page-spinner.service';

import { emailValidator } from 'app/validators/email.validator';

import { BasePaymentWidget } from '../base-payment-widget';

import { ApplicationStatus } from 'app/common/enums';

import { PaymentQuery } from '../state/payment.query';
import { PaymentStoreInfo } from '../state/payment.model';
import { StripePaymentInfo } from '../payment-info';
import { FillableAppFormQuery } from 'app/applications/apps-edit-fillableform/state/fillable-app-form.query';

import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';

@Component({
    selector: 'stripe-widget',
    templateUrl: './stripe-widget.html',
    styleUrls: ['./stripe-widget.scss'],
    providers: [StripeWidgetService]
})
export class StripeWidget extends BasePaymentWidget {

    stripe: StripeInstance;
    stripeForm: FormGroup;
    paymentData$: Observable<PaymentStoreInfo>;
    stripePaymentInfo: StripePaymentInfo;

    private statusSucceeded = 'succeeded';

    cardOptions: StripeCardElementOptions = {
        classes: {
            base: 'ngx-stripe-card-base',
            invalid: 'ngx-stripe-card-invalid'
        },
        style: {
            base: {
                fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                fontSize: '15px',
                color: '#333',
                '::placeholder': { color: '#6f6f6f' }
            }
        }
    };

    @ViewChild(StripeCardComponent) card: StripeCardComponent;

    constructor(
        protected route: ActivatedRoute,
        protected translate: TranslateService,
        private fb: FormBuilder,
        private stripeWidgetService: StripeWidgetService,
        private pageSpinnerService: PageSpinnerService,
        private paymentQuery: PaymentQuery,
        @Optional() private fillableAppFormQuery: FillableAppFormQuery = null,
        @Optional() @Inject('allowToPay') public allowToPay: boolean = false
    ) {
        super(route, translate);
    }

    protected async initPayment() {
        this.stripe = await this.stripeWidgetService.getStripeInstance();
        this.paymentData$ = this.paymentQuery.paymentData$;
        this.paymentData$.pipe(takeUntil(this.unsubscribe)).subscribe((data: StripePaymentInfo) => this.stripePaymentInfo = data);
        if (this.appId && this.allowToPay) {
            await this.stripeWidgetService.setUserInPaymentIntent(this.appId, this.formId, this.stripePaymentInfo.stripe?.paymentIntent?.id);
        }

        this.stripeForm = this.fb.group({
            receipt_email: ['', emailValidator]
        });
        if (this.fillableAppFormQuery) {
            this.fillableAppFormQuery.appStatus$.pipe(takeUntil(this.unsubscribe)).subscribe((appStatus: ApplicationStatus) => {
                if (appStatus === ApplicationStatus.Finalized) this.allowToPay = false;
            });
        }
    }

    pay(): void {
        this.errorMsg = '';

        if (!this.stripeForm.valid) {
            this.errorMsg = this.paymentTranslations.stripe.errMsgInvalidForm;
            return;
        }
        this.pageSpinnerService.display(this.confirmStripePaymentIntent(), this.paymentTranslations.msgPaymentIsProcessing);
    }

    private confirmStripePaymentIntent(): Promise<void> {
        return this.stripe.confirmCardPayment(this.stripePaymentIntentClientSecret, {
            payment_method: {
                card: this.card.element,
            },
            receipt_email: this.stripeForm.value.receipt_email,
        })
            .toPromise()
            .then((confirmationResult: PaymentIntentResult) => {
                console.log('confirmationResult:');
                console.log(confirmationResult);

                if (confirmationResult.error) {
                    this.errorMsg = confirmationResult?.error?.message || '';
                } else if (confirmationResult.paymentIntent.status === this.statusSucceeded) {
                    this.formProperty.setValue(true, false); // setting the hasPaid to true
                    this.card.element.clear();
                } else {
                    console.warn(confirmationResult.paymentIntent.status);
                }
            });
    }

    public get stripePaymentIntentClientSecret(): string {
        return this.stripePaymentInfo.stripe?.paymentIntent?.clientSecret ?? '';
    }

    onChange({ error }) {
        this.errorMsg = error?.message || null;
    }

    onFormChange() {
        this.errorMsg = '';
        if (this.stripeForm.controls['receipt_email']?.invalid) {
            this.errorMsg = this.paymentTranslations.stripe.errMsgInvalidEmail;
        }
    }

}
