import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { ChartButtonGroupSetup, ChartActionSectionSetup } from "app/common/interfaces";
import { Utils } from "app/common/utils";
import { ZingData, ZingGlobals, ZingGUI } from "app/entities/local/zing-chart";
import { Student } from "app/entities/student";
import { YearLevel } from "app/entities/year-level";
import { SchoolService } from "app/state/school";
import { ChartWrapperService } from "./chart-wrapper-service";
import { ChartQuery, ChartService } from "app/state/chart";
import { Keys } from "app/common/keys";

@Injectable()
export class FunnelChartWrapperService extends ChartWrapperService {
    public chartName = 'FunnelMetrics';
    public chartStoreKey = Keys.funnel;

    constructor(
        protected router: Router,
        protected schoolService: SchoolService,
        protected chartService: ChartService,
        protected chartQuery: ChartQuery
    ) {
        super(router, schoolService, chartService, chartQuery);
        this.filter = {};
    }

    getChartButtonGroupConfig(): ChartButtonGroupSetup {
        this.chartEntity = this.getChartEntity();
        const isChartAggregatedForUser = this.chartEntity?.isAggregated ?? false;
        return {
            hasCopyButton: true,
            hasChartSelectorButton: false,
            menuButton: {
                aggregateSection: {
                    hasButton: true,
                    isSelected: isChartAggregatedForUser
                },
                totalSection: {
                    hasButton: false,
                },
                legendSection: {
                    hasButton: false,
                    isSelected: true
                },
                hasGuideButton: false,
                hasDownloadPDFButton: true,
                hasDownloadCSVButton: true,
                hasDownloadXLSButton: true,
                hasPrintButton: true,
            }
        }
    }

    getChartActionSectionConfig(): ChartActionSectionSetup {
        return { hasViewButton: true }
    }

    setFilters(selectedYearLevels?: YearLevel[], students?: Student[]) {
        this.filter.intakeYear = Array.from(this.setStartingYearFilter(students));
        this.filter.intakeYearLevels = this.setIntakeYearLevelFilter(selectedYearLevels);
    }
    getInitialData(): ZingData {
        return {
            type: 'funnel',
            scaleX: {
                visible: true,
                labels: [],
                placement: 'opposite',
                'max-items': 15
            },
            scaleY: {
                labels: [],
                guide: {
                    lineColor: 'white',
                    items: [
                        { backgroundColor: '#f5dad3', borderRadius: '8px 8px 0px 0px' },
                        { backgroundColor: '#fdf8de', borderRadius: '0px' },
                        { backgroundColor: '#e6f4dd', borderRadius: '0px 0px 12px 12px', },
                    ]
                }
            },
            series: [
                { values: [], backgroundColor: '#c82606', text: '' },
                { values: [], backgroundColor: '#f6d328', text: '' },
                { values: [], backgroundColor: '#94ce72', text: '' }
            ],
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
        }
    }

    downloadCsv() {
        var excelJson = this.prepareJsonRequiredForCSV(JSON.parse(this._chartType.downloadRAW()));
        var finalResult: string = "";
        excelJson.forEach(element => {
            finalResult = finalResult + element.toString();
        });
        Utils.export2Csv(finalResult, this.getFileName());
    }

    downloadXls() {
        var excelJson = this.prepareJsonRequiredForExcel(JSON.parse(this._chartType.downloadRAW()));
        Utils.exportAsExcelFile(excelJson, this.getFileName() + '.xlsx');
    }

    /**
     * Prepare json for excel function takes a raw json of zing funnel chart and convert into a format 
     * which is required for excel download 
     * @param json 
     * @returns 
     */
    private prepareJsonRequiredForExcel(json: any[]) {
        let excelJson = [];
        json.forEach((outsideRecord, outSideRecordIndex) => {
            for (var index in outsideRecord) {
                if (outSideRecordIndex === 0) {
                    if (index != '0') {
                        let json = {};
                        json[outsideRecord[0]] = outsideRecord[index];
                        excelJson.push(json);
                    }
                } else {
                    if (index != '0') {
                        let excelExtraElementJson = excelJson[parseInt(index) - 1];
                        excelExtraElementJson[outsideRecord[0]] = outsideRecord[index];
                    }
                }
            }
        });
        return excelJson;
    }

    /**
     * Prepare json for csv function takes a raw json of zing funnel chart & create an array and 
     * convert that array into comma separated string for csv download
     * @param json 
     * @returns 
     */
    private prepareJsonRequiredForCSV(json: any[]) {
        let csvJson = [];
        json.forEach((outsideRecord, outSideRecordIndex) => {
            for (var index in outsideRecord) {
                if (outSideRecordIndex === 0) {
                    let record: any = [];
                    record.push(outsideRecord[index]);
                    csvJson.push(record);
                } else {
                    let getExistingRecord = csvJson[parseInt(index)];
                    getExistingRecord.push(outsideRecord[index]);
                }
            }
        });
        csvJson.forEach((element, key) => {
            element[element.length - 1] += ("\n");
            element.forEach((data, dataKey) => {
                csvJson[key][dataKey] = (data.toString()).replaceAll(',', '')
            });
        });
        return csvJson;
    }
}