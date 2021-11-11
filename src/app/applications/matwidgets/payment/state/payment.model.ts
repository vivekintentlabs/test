import { StripePaymentInfo } from "../payment-info";

export type PaymentStoreInfo = Pick<StripePaymentInfo, 'amount' | 'currency' | 'transactionId' | 'stripe'>;
