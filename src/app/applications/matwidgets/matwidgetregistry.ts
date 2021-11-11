import { Injectable } from '@angular/core';

import { DefaultWidgetRegistry } from 'ngx-schema-form';

import { StepperWidget } from './stepper/stepper-widget';
import { ReadonlyWidget } from './readonly/readonly-widget';
import { ObjectWidget } from './object/object-widget';
import { MatArrayWidget } from './array/array-widget';

import { MatSelectWidget } from './select/select-widget';
import { MatRadioWidget } from './radio/radio-widget';
import { MatCheckboxWidget } from './checkbox/checkbox-widget';
import { DateWidget } from './date/date-widget';
import { StripeWidget } from './payment/stripe/stripe-widget';
import { MatStringWidget } from './string/string-widget';
import { MatIntegerWidget } from './integer/integer-widget';
import { MatTextAreaWidget } from './textarea/textarea-widget';
import { InfoWidget } from './info/info-widget';
import { MatChipsWidget } from './chips/chips-widget';
import { MatRangeWidget } from './range/range-widget';
import { MatSpecialSelectWidget } from './special-select/special-select-widget';
import { MatYearWidget } from './year/year-widget';
import { MatSignatureWidget } from './signature/signature-widget';
import { MatHiddenWidget } from './hidden/hidden-widget';
import { MatSignatureCaptureWidget } from './signature-capture/signature-capture-widget';
import { AddressWidget } from './address/address-widget';
import { SpouseWidget } from './spouse/spouse-widget';
import { AmountWidget } from './amount/amount-widget';

import { MatFilesArrayWidget } from './files-array/files-array-widget';
import { MatFilesSectionWidget } from './files-section/files-section.widget';
import { MatPaymentStatusWidget } from './payment-status/payment-status.widget';
import { EtButtonWidget } from './button/button-widget';

@Injectable()
export class EtWidgetRegistry extends DefaultWidgetRegistry {
    constructor() {
        super();

        this.register('stepper', StepperWidget);
        this.register('readonly', ReadonlyWidget);
        this.register('object', ObjectWidget);
        this.register('array', MatArrayWidget);
        this.register('expansionPanel', MatArrayWidget);
        this.register('select', MatSelectWidget);
        this.register('radio', MatRadioWidget);
        this.register('checkbox', MatCheckboxWidget);
        this.register('boolean', MatCheckboxWidget);
        this.register('date', DateWidget);
        this.register('payment', StripeWidget);
        this.register('amount', AmountWidget);

        this.register('string', MatStringWidget);
        this.register('hidden', MatHiddenWidget);
        this.register('search', MatStringWidget);
        this.register('tel', MatStringWidget);
        this.register('url', MatStringWidget);
        this.register('email', MatStringWidget);
        this.register('password', MatStringWidget);
        this.register('color', MatStringWidget);
        this.register('date-time', MatStringWidget);
        this.register('time', MatStringWidget);

        this.register('integer', MatIntegerWidget);
        this.register('number', MatIntegerWidget);

        this.register('textarea', MatTextAreaWidget);
        this.register('info', InfoWidget);
        this.register('chips', MatChipsWidget);

        this.register('range', MatRangeWidget);

        this.register('special_select', MatSpecialSelectWidget);
        this.register('year', MatYearWidget);
        this.register('signature', MatSignatureWidget);
        this.register('signature-capture', MatSignatureCaptureWidget);
        this.register('address', AddressWidget);
        this.register('spouse', SpouseWidget);

        // TODO next widget are just protos, they need to be completed
        this.register('files-array', MatFilesArrayWidget);
        this.register('files-section', MatFilesSectionWidget);
        this.register('payment-status', MatPaymentStatusWidget);
        this.register('button', EtButtonWidget);

        this.setDefaultWidget(MatStringWidget);
    }
}
