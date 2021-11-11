import { ZingData, ZingGlobals, ZingGUI } from "app/entities/local/zing-chart";

export class InitChartData {
    static pieChartInitData(): ZingData {
        return {
            type: 'pie',
            title: {
                text: '',
                position: '50% 100%',
                fontSize: 14,
                fontWeight: 400,
            },
            noData: {
                text: "Currently there is no data in the chart",
                fontSize: 18,
            },
            plotarea: {
                margin: '0px 0px 12px 0px',
            },
            series: [],
            plot: {
                detach: false,
                tooltip: {
                    alpha: 1,
                    text: '<div class="pie-chart-tooltip text-center" style="border-color:%color"><span style="color:%data-background-color">%t <br/> %v | %npv%</span</div>',
                    borderWidth: 0,
                    borderRadius: 8,
                    placement: 'node:out',
                    backgroundColor: '#ffffff',
                    padding: '0',
                    htmlMode: true,
                    decimals: 0
                },
                slice: 70,
                valueBox: {
                    text: '%npv%',
                    fontColor: 'white',
                    fontSize: 14,
                    fontWeight: 400,
                    decimals: 0,
                    connector: {
                        lineColor: '#616161'
                    },
                    rules: [
                        {
                            text: '%npv',
                            rule: '%npv <= 0.0',
                            visible: false
                        }
                    ]
                },
                rules: [
                    {
                        text: '%p',
                        rule: '%p <= 0.0',
                        visible: false
                    }
                ]
            },
            labels: [{
                fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                fontWeight: 500,
                anchor: 'c',
                x: '50%',
                y: '47%',
                fontSize: 32,
                text: ''
            }],
            globals: ZingGlobals.getDefaultConfig(),
            gui: ZingGUI.getDefaultConfig()
        }
    }
    static barChartInitData(): ZingData {
        return {
            type: 'bar',
            plotarea: {
                adjustLayout: true
            },
            noData: {
                text: "Currently there is no data in the chart",
                fontSize: 18
            },
            plot: {
                stacked: true,
                borderRadius: 0,
                valueBox: {
                    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                    text: '',
                    fontColor: '#808285',
                    fontSize: 10,
                    fontWeight: 500,
                    rules: [{
                        text: '',
                        rule: '%stack-top == 0',
                        visible: false
                    }, {
                        text: '%total',
                        rule: '%total <= 0',
                        visible: false
                    }],
                },
                tooltip: {
                    text: '<span style="color:%data-background-color;background-color:#fff;border:2px solid %data-background-color;padding:3px;">%t: %v</span>',
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    visible: true,
                    rules: [{
                        text: '%v',
                        rule: '%v <= 0',
                        visible: false
                    }]
                }
            },
            scaleX: {
                labels: [],
                'max-items': 10,
                itemsOverlap: true,
                item: {
                    angle: '0',
                },
            },
            scaleY: {},
            series: [],
            globals: ZingGlobals.getDefaultConfig(),
            gui: ZingGUI.getDefaultConfig()
        }
    }
}