import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { loadStripe } from '@stripe/stripe-js';

import { Constants } from 'app/common/constants';
import { StripeKeyPairDTO } from 'app/common/dto/stripe-key-pair';

import { HttpService } from 'app/services/http.service';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalAction } from 'app/common/enums';
import { StripeIntegrationModalComponent } from './stripe-integration-modal/stripe-integration-modal';

@Component({
    selector: 'app-stripe-integration',
    templateUrl: 'stripe-integration.html',
    styleUrls: ['stripe-integration.scss']
})
export class StripeIntegrationComponent implements OnInit {
    readonly requiredKeyMinLength: number = 32;
    readonly requiredKeyMaxLength: number = 255;
    fakeStripeSecretKey = '';
    isValidStripePublicKey = true;
    isValidStripePrivateKey = true;
    stripeValidationChanged = 0;
    gatewayStatusCSS = 'bg-info';
    gatewayStatusText = 'CHECKING';
    formGroup: FormGroup;

    constructor(
        private fb: FormBuilder, 
        private httpService: HttpService,
        private modalService: NgbModal) {
    }

    public ngOnInit() {
        this.httpService.getAuth('schools/stripe-key-pair').then((data: StripeKeyPairDTO) => {
            this.createForm(data);
            this.validateStripeKeys();
        }).catch(console.error);
    }

    private createForm(data: StripeKeyPairDTO) {
        this.formGroup = this.fb.group({
            stripePublicKey: [data.publicKey, 
                            Validators.compose([ Validators.required, 
                            Validators.minLength(this.requiredKeyMinLength), 
                            Validators.maxLength(this.requiredKeyMaxLength)])],
            stripeSecretKey: [data.secretKey, 
                            Validators.compose([ Validators.required, 
                            Validators.minLength(this.requiredKeyMinLength), 
                            Validators.maxLength(this.requiredKeyMaxLength)])],
        });
        this.fakeStripeSecretKey = data.publicKey;
    }

    private setGatewayStatusCssAndText() {
        if (this.stripeValidationChanged < 2) {
            this.gatewayStatusText = 'CHECKING';
            this.gatewayStatusCSS = 'bg-info';
        } else if (this.isValidStripePublicKey && this.isValidStripePrivateKey) {
            this.gatewayStatusText = 'ACTIVE';
            this.gatewayStatusCSS = 'bg-success';
        } else {
            this.gatewayStatusText = 'INACTIVE';
            this.gatewayStatusCSS = 'bg-danger';
        }
    }

    private async validateStripeKeys() {
        if (this.formGroup.controls.stripePublicKey.value) {
            const stripe = await loadStripe(this.formGroup.controls.stripePublicKey.value)
            .catch(() => {
                this.markPublicKeyWithStatus(false);
            });
            if (stripe) {
                stripe.createToken('pii', {personal_id_number: 'test'})
                .then(res => {
                    this.markPublicKeyWithStatus(!!res.token);
                });
            }
        } else {
            this.markPublicKeyWithStatus(false);
        }

        return this.httpService.getAuth('payment/validate-stripe-keys').then((res: boolean) => {
            ++this.stripeValidationChanged;
            this.isValidStripePrivateKey = res;
            this.setGatewayStatusCssAndText();
        }).catch(console.error);
    }

    private markPublicKeyWithStatus(status: boolean) {
        ++this.stripeValidationChanged;
        this.isValidStripePublicKey = status;
        this.setGatewayStatusCssAndText();
    }

    enterApiKeys() {
        const modalSendTestEmailRef = this.modalService.open(StripeIntegrationModalComponent, Constants.ngbModalLg);
        modalSendTestEmailRef.componentInstance.formGroup = this.formGroup;
        modalSendTestEmailRef.componentInstance.requiredKeyMinLength = this.requiredKeyMinLength;
        modalSendTestEmailRef.componentInstance.requiredKeyMaxLength = this.requiredKeyMaxLength;
        modalSendTestEmailRef.result.then((result: { action: ModalAction, fakeStripeSecretKey: string }) => {
            switch (result.action) {
                case ModalAction.Update:
                    this.validateStripeKeys();
                    this.fakeStripeSecretKey = result.fakeStripeSecretKey;
                    break;
                default:
                    break;
            }
        }).catch((err) => modalSendTestEmailRef.dismiss(err));
    }

}
