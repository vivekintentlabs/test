import { PaymentType } from "app/common/enums/paymentType";

export interface DocUpload {
    id: number;
    name: string;
    uiState: string;
    tooltip: string;
}

export interface FeeResponsibility {
    firstName: number;
    lastName: string;
    description: string;
}

export interface StudentData {
    firstName: number;
    lastName: string;
    startingYear: string;
    intakeYearLevel: string;
}

export interface PaymentStatus {
    id: number;
    name: string;
    uiState: string;
    tooltip: string;
    paymentType: PaymentType;
    paymentMethod: string;
}