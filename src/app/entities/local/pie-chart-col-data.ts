import { Legend } from './legend';
import { PieSeries } from './pie-series';

export class PieChartColData {
    legends: Array<Legend>;
    labels: Array<Object>;
    classNames: Array<string>;
    series: Array<PieSeries>
}
