import { PaymentStatus } from "app/common/paymentStatus";

export interface PaymentInfo {
    amount: number;
    currency: string;
    status: PaymentStatus;
    dateTimePaid?: Date;
    transactionId?: string;
}

export interface StripePaymentInfo extends PaymentInfo {
    stripe: {
        paymentIntent: {
            id: string,
            clientSecret: string,
            status: string,
            receipt_number: string,
        }
    };
}
