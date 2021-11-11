import { Constants } from "app/common/constants";
import { ChartActionSectionSetup, ChartButtonGroupSetup } from "app/common/interfaces";
import { Legend } from "app/entities/local/legend";
import { Utils } from "app/common/utils";
import { ZingData } from "app/entities/local/zing-chart";
import { Student } from "app/entities/student";
import { YearLevel } from "app/entities/year-level";
import { ChartWrapperService } from "./chart-wrapper-service";

export abstract class DemographicChartWrapperService extends ChartWrapperService {
    getChartButtonGroupConfig(): ChartButtonGroupSetup {
        this.chartEntity = this.getChartEntity();
        const chartMenuIconForUser = Constants.ChartIcons[this.chartEntity?.chartType?.type] ?? Constants.ChartIcons.pie;
        return {
            hasCopyButton: true,
            hasChartSelectorButton: false,
            chartTypeMenus: {
                menuIcon: chartMenuIconForUser,
                menus: [
                    { name: Constants.ChartNames.pie, type: Constants.ChartTypes.pie },
                    { name: Constants.ChartNames.stackedColumnChart, type: Constants.ChartTypes.stackedColumnChart }
                ]
            },
            menuButton: {
                aggregateSection: {
                    hasButton: true,
                    isSelected: this.chartEntity?.isAggregated ?? false
                },
                totalSection: {
                    hasButton: true,
                    isSelected: this.chartEntity?.hasPlotTotal ?? false
                },
                legendSection: {
                    hasButton: true,
                    isSelected: true
                },
                hasGuideButton: false,
                hasDownloadPDFButton: true,
                hasDownloadCSVButton: true,
                hasDownloadXLSButton: true,
                hasPrintButton: true
            }
        }
    }

    getChartActionSectionConfig(): ChartActionSectionSetup {
        return { hasViewButton: true }
    }

    setFilters(selectedYearLevels?: YearLevel[], students?: Student[], selectedLegends?: Legend[], title?: string) {
        this.filter.intakeYear = Array.from(this.setStartingYearFilter(students));
        this.filter.intakeYearLevels = this.setIntakeYearLevelFilter(selectedYearLevels);
        this.filter.selectedStages = this.setStageFilter(students);
        this.filter.statuses = this.setStatusFilter(students);
        if (selectedLegends) {
            this.filter.legendId = this.setLegendFilter(selectedLegends);
        }
        this.filter.title = title;
    }

    getInitialData(): ZingData {
        return;
    }

    downloadCsv(): void {
        if (this.getChartButtonGroupConfig().chartTypeMenus.menuIcon == Constants.ChartIcons.pie) {
            var excelJson = this.prepareJsonRequiredForCSVOrExcel(JSON.parse(this._chartType.downloadRAW()), 'csv');
            var finalResult: string = "";
            excelJson.forEach(element => {
                finalResult = finalResult + element.toString();
            });
            Utils.export2Csv(finalResult, this.getFileName());
        } else {
            this._chartType?.downloadCSV({
                fn: this.getFileName()
            });
        }
    }

    downloadXls(): void {
        if (this.getChartButtonGroupConfig().chartTypeMenus.menuIcon == Constants.ChartIcons.pie) {
            var excelJson = this.prepareJsonRequiredForCSVOrExcel(JSON.parse(this._chartType.downloadRAW()), 'xls');
            Utils.exportAsExcelFile(excelJson, this.getFileName() + '.xlsx');
        } else {
            this._chartType?.downloadXLS({
                fn: this.getFileName()
            });
        }
    }

    /**
     * Prepare json for csv/excel function takes a raw json of zing funnel chart & create an array and
     * convert that array into comma separated string for csv/excel download
     * @param json
     * @returns
     */
    private prepareJsonRequiredForCSVOrExcel(json: any[], type: string) {
        let count = 0;
        for (let i = 0; i < ((json.length) / 3); i++) {
            json[count + 2][0] = json[count][0];
            if (type == 'csv') {
                json[count] = [''];
            }
            count += 3
        }
        if (type == 'csv') {
            json.forEach((element, key) => {
                element[element.length - 1] += ("\n");
                element.forEach((data, dataKey) => {
                    json[key][dataKey] = (data.toString()).replaceAll(',', '')
                });
            });
            return json;
        } else {
            let tempArray = [];
            json.forEach(element => {
                if(element.length != 1) {
                    tempArray.push(element);
                }
            });
            let excelJson = [];
            let newCount = 0;
            tempArray.forEach((outsideRecord) => {
                newCount += 1;
                let tempJson = {};
                for (var index in outsideRecord) {
                    if (newCount % 2 != 0) {
                        tempJson[tempArray[newCount - 1][index]] = tempArray[newCount][index].toString();
                    }
                }
                excelJson.push(tempJson);
            });
            return excelJson;
        }
    }
}