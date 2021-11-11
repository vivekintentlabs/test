export abstract class ZingChart {
    width: any;
    constructor(public id: string, public data: ZingData, public height: number | string) { }
}
export class ZingData {
    type: string;
    legend?: ZingLegend;
    series: ZingSeries[];
    scaleX?: ZingScaleX;
    scaleY?: ZingScaleY;
    globals?: ZingGlobals;
    gui?: ZingGUI;
    plot?: ZingPlot;
    plotarea?: ZingPlotArea;
    title?: ZingTitle;
    labels?: ZingLabel[];
    noData?: ZingNoData;
    width?: string;
}

export class ZingNoData {
    text: string;
    fontSize: number;
}

export class GraphsetData {
    graphset: ZingData[];
    layout?: string;
    backgroundColor?: string;
}

export class ZingSeries {
    values: number[];
    backgroundColor?: string;
    text?: string;
}

export class ZingLegend {
    marker?: ZingLegendMarker;
    layout?: string;
    x?: string;
    y?: string;
}

export class ZingLegendMarker {
    backgroundColor?: string;
    borderWidth?: string;
    borderColor?: string;
    type?: string;
    showLine?: string;
    lineColor?: string;
}

export class ZingScaleX {
    visible?: boolean;
    labels?: string[];
    placement?: string;
    label?: any;
    'max-items'?: any;
    itemsOverlap?: boolean
    item?: ZingScaleXItem;
}

export class ZingScaleXItem {
    angle: string;
}

export class ZingScaleY {
    visible?: boolean;
    labels?: string[];
    placement?: string;
    guide?: ZingGuide;
    values?: string;
}

export class ZingMarker {
    backgroundColor?: string;
    type?: string;
    size?: number
}

export class ZingGuide {
    lineColor?: string;
    items?: Array<ZingItems>;
    lineStyle?: string;
}

export class ZingItems {
    alpha?: number;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: string;
}

export class ZingPlot {
    tooltip?: ZingTooltip;
    valueBox: ZingValueBox;
    animation?: ZingAnimation;
    rules?: ZingRule[];
    slice?: number;
    detach?: boolean;
    stacked?: boolean;
    borderRadius?: number;
}

export class ZingPlotArea {
    margin?: string;
    adjustLayout?: boolean;
}

export class ZingTooltip {
    alpha?: number;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    fontSize?: number;
    padding?: string;
    text?: string;
    placement?: 'horizontal' | 'vertical' | 'node:top' | 'node:center' | 'node:out';
    decimals?: number;
    htmlMode?: boolean;
    visible?: boolean;
    rules?: ZingRule[];
}

// Parameter Reference https://www.zingchart.com/docs/api/json-configuration/graphset/plot/value-box
export class ZingValueBox {
    text: string;
    placement?: string;
    fillOffsetX?: string;
    fontSize?: number;
    fontWeight?: number;
    fontColor?: string;
    decimals?: number;
    rules: ZingRule[];
    connector?: ZingConnector;
    fontFamily?: string;
}

export class ZingConnector {
    lineColor?: string;
}

// Parameter Reference https://www.zingchart.com/docs/api/json-configuration/graphset/plot/rules
export class ZingRule {
    text: string;
    rule: string;
    visible?: boolean;
}

// Parameter reference https://www.zingchart.com/docs/api/json-configuration/graphset/title#swup
export class ZingTitle {
    text: string;
    position: string;
    fontWeight?: number;
    fontSize?: number;
}

// Parameter reference https://www.zingchart.com/docs/api/json-configuration/graphset/plot/animation
export class ZingAnimation {
    effect: string;
    speed: number;
}

// Parameter reference https://www.zingchart.com/docs/api/json-configuration/graphset/labels
export class ZingLabel {
    fontFamily: string;
    fontWeight: number;
    anchor: string;
    x: string;
    y: string;
    fontSize?: number;
    text: string;
}

export class ZingGlobals {
    alpha: number;
    borderRadius: string;
    fontFamily: string;
    fontSize: number;
    fontColor: string;
    fontWeight: string;
    marker: ZingMarker;

    public static getDefaultConfig(): ZingGlobals {
        return {
            alpha: 1,
            borderRadius: '3px',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif;',
            fontSize: 14,
            fontColor: '#333333',
            fontWeight: '300',
            marker: {
                backgroundColor: '#1A237E',
                type: 'circle',
                size: 3
            }
        }
    }
}
export class ZingGUI {
    contextMenu: Object;
    behaviors: Array<{ id: string, enabled: string }>

    public static getDefaultConfig(): ZingGUI {
        return {
            contextMenu: {
                backgroundColor: 'white',
                item: {
                    backgroundColor: 'white',
                    fontColor: 'black',
                    hoverState: {
                        backgroundColor: 'black',
                        fontColor: 'grey'
                    }
                }
            },
            behaviors: [
                {
                    id: 'Reload',
                    enabled: 'none' // none
                }, {
                    id: 'SaveAsImage',
                    enabled: 'none'
                }, {
                    id: 'DownloadPDF',
                    enabled: 'none'
                }, {
                    id: 'DownloadSVG',
                    enabled: 'none'
                }, {
                    id: 'DownloadCSV',
                    enabled: 'none'
                }, {
                    id: 'DownloadXLS',
                    enabled: 'none'
                }, {
                    id: 'ViewDataTable',
                    enabled: 'none'
                }, {
                    id: 'Print',
                    enabled: 'none'
                }, {
                    id: 'ViewSource',
                    enabled: 'none'
                }, {
                    id: 'About ZingChart',
                    enabled: 'none'
                }
            ]
        }
    }
}
