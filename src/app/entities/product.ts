export class Product {
    id: number;
    description: string;
    tierRangeLowerValue: number | string;
    tierRangeUpperValue: number | string;
    country: string;
    monthlyRate: number | string;
    establishmentFee: number | string ;
    additionalCampusFee: number | string;

    // local
    currency: string;
}
