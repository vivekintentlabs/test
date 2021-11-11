import { PaymentType } from "app/common/enums/paymentType";
import { Document } from "../../interfaces/documents/document";

export interface PaymentSetupDoc extends Document {
    amount: number;
    currency: 'AUD' | 'USD' | 'NZD' | 'CAD';
    paymentType: PaymentType;
}
