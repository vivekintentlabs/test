export class PieSeries {
    data: Array<number>;
    rawData: Array<number>;
    total: number;
    label: string;

    constructor() {
        this.data = [];
        this.rawData = [];
        this.total = null;
        this.label = '';
    }
}