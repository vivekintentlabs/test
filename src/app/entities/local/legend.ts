export class Legend {
    name: string;
    sequence?: number;
    url: string;
    params: Params;
    isSelected?: boolean;
    className?: string;
}

interface Params {
    legendId?: number;
    campusId: number | string;
    intakeYear: | string | number | number[];
    intakeYearLevels?: number | number[] | string;
    title?: string;
    url?: string;
    enquiryYear?: number;
    stages?: string;
    statuses?: string;
}