import { ZingChart, ZingGlobals, ZingGUI, ZingData } from './zing-chart';
import * as _ from 'lodash';


export class FunnelZingChart extends ZingChart {

    constructor(id: string) {
        const funnelData: ZingData = {
            type: 'funnel',
            series: [],
            scaleX: { labels: [] },
            scaleY: { labels: [] },
            plotarea: {
                margin: 'dynamic',
            },
            plot: {
                tooltip: {
                    alpha: 0.9,
                    backgroundColor: 'white',
                    borderColor: 'black',
                    borderWidth: 1,
                    borderRadius: 2,
                    fontSize: 12,
                    padding: '5 10',
                    text: 'Percentage (relative to previous stage): %output-percent-value%',
                },
                valueBox: {
                    text: '%v',
                    placement: 'right-out',
                    fillOffsetX: '150px',
                    rules: [
                        {
                            rule: '%v === 0',
                            text: ''
                        }
                    ]
                },
            },
            globals: ZingGlobals.getDefaultConfig(),
            gui: ZingGUI.getDefaultConfig()
        };
        const height = 250;
        super(id, funnelData, height);
    }
}
