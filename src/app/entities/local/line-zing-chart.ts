import { ZingChart, ZingGlobals, ZingGUI, ZingData } from './zing-chart';
import * as _ from 'lodash';


export class LineZingChart extends ZingChart {

    constructor(id: string) {
        const lineData: ZingData = {
            type: 'line',
            legend: {},
            series: [],
            scaleX: {},
            scaleY: {},
            globals: ZingGlobals.getDefaultConfig(),
            gui: ZingGUI.getDefaultConfig()
        };
        const height = 250;
        super(id, lineData, height);
    }
}
