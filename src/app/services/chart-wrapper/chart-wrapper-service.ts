import { InjectionToken } from "@angular/core";
import { Router } from "@angular/router";
import { Constants } from "app/common/constants";
import { ChartActionSectionSetup, ChartButtonGroupSetup, ChartTypeMenuItem } from "app/common/interfaces";
import { ZingData } from "app/entities/local/zing-chart";
import { Student } from "app/entities/student";
import { UserInfo } from "app/entities/userInfo";
import { YearLevel } from "app/entities/year-level";
import { ChartEntity, ChartQuery, ChartService } from "app/state/chart";
import { SchoolService } from "app/state/school";
import * as moment from "moment";
import { Utils, Colors } from "app/common/utils";
import * as _ from 'lodash';
import { Legend } from "app/entities/local/legend";
import { environment } from "environments/environment";
import { CustomZingChartAngularComponent } from "zingchart";

export const CHART_WRAPPER_SERVICE = new InjectionToken<ChartWrapperService>('Chart Wrapper Service');

export abstract class ChartWrapperService {
    protected filter;
    protected url = `/${environment.localization.enquiriesUrl}/students`;
    protected _chartType: CustomZingChartAngularComponent;
    public abstract chartName: string;
    protected userInfo: UserInfo = null;
    protected _total: number = 0;
    protected chartEntity: ChartEntity;
    public abstract chartStoreKey: string;

    constructor(
        protected router: Router,
        protected schoolService: SchoolService,
        protected chartService: ChartService,
        protected chartQuery: ChartQuery
    ) {
        this.userInfo = Utils.getUserInfoFromToken();
        this.filter = {};
    }
    abstract getChartButtonGroupConfig(): ChartButtonGroupSetup;
    abstract getChartActionSectionConfig(): ChartActionSectionSetup;
    abstract setFilters(selectedYearLevels?: YearLevel[], students?: Student[], legends?: Legend[], chartTitle?: string);
    abstract getInitialData(): ZingData;

    setIntakeYearLevelFilter(selectedYearLevels: YearLevel[]): number[] {
        const selectedIntakeYearLevels: number[] = [];
        selectedYearLevels.forEach((value, key) => {
            selectedIntakeYearLevels.push(value.id);
        });
        return selectedIntakeYearLevels;
    }

    setStartingYearFilter(students: Student[]): Set<number> {
        const selectedStartingYear = new Set<number>();
        students.forEach((value, key) => {
            selectedStartingYear.add(value.startingYear);
        });
        return selectedStartingYear;
    }

    setStageFilter(students: Student[]): number[] {
        return _(students).uniqBy(s => s.studentStatus.stage.id).map(s => s.studentStatus.stage.id).value();
    }

    setStatusFilter(students: Student[]): number[] {
        return _(students).uniqBy(s => s.studentStatus.id).map(s => s.studentStatus.id).value();
    }

    setLegendFilter(legends: Legend[]): number[] {
        return legends.filter(legend => legend.isSelected).map(
            (legend: Legend) => legend.params.legendId);
    }

    get chartType(): CustomZingChartAngularComponent {
        return this._chartType;
    }

    set chartType(chartType: CustomZingChartAngularComponent) {
        this._chartType = chartType;
    }

    get total(): number {
        return this._total;
    }

    set total(total: number) {
        this._total = total;
    }

    public setAggregateStatus(isAggregated: boolean): void {
        if (this.getChartEntity() != undefined) {
            this.chartService.update(this.getChartEntityId(),
                {
                    id: this.getChartEntityId(),
                    isAggregated
                });
        } else {
            this.chartService.set(
                {
                    id: this.getChartEntityId(),
                    isAggregated
                }
            )
        }
    }

    public getFileName(): string {
        return `${this.schoolService.getSchoolName()}_${this.chartName}_${moment().format(Constants.dateFormats.dayMonthYearUnderScored)}`;
    }

    downloadPdf() {
        this._chartType?.saveasimage({
            filetype: 'pdf',
            filename: this.getFileName() + ".pdf",
            download: true
        });
    }

    downloadCsv() {
        this._chartType?.downloadCSV({
            fn: this.getFileName()
        });
    }

    downloadXls() {
        this._chartType?.downloadXLS({
            fn: this.getFileName()
        });
    }

    onPrintChart() {
        this._chartType?.print();
    }

    /**
     * This method uses zingchart angular's get image data method which returns a base64 string of image.
     * @returns
     */
    async copyChart() {
        this._chartType?.getimagedata({
            filetype: 'png',
            callback: async function(imageURL) {
                if (imageURL == -1) {
                    Utils.showNotification("Unable to generate an image.", Colors.danger);
                    return;
                }
                // We need to trim double-quotes from the rawImageData provided from zingchart method.
                // Zingchart adds a double-quotes in string.
                try {
                    await Utils.addToClipboard(_.trim(imageURL, '"'), 'image/png');
                    Utils.showNotification('Chart Image copied', Colors.success);
                } catch (err) {
                    Utils.showNotification(err.message, Colors.danger);
                    console.error(err.name, err.message);
                }
            }
        });
    }

    getChartEntity(): ChartEntity {
        return this.chartQuery.get(this.getChartEntityId());
    }

    getChartEntityId() {
        return `${this.chartStoreKey}_${this.userInfo.id}`;
    }

    public setShowTotalStatus(hasPlotTotal: boolean): void {
        this.chartService.update(this.getChartEntityId(), { id: this.getChartEntityId(), hasPlotTotal });
    }

    public setChartTypeStatus(chartType: ChartTypeMenuItem): void {
        this.chartService.update(this.getChartEntityId(), { id: this.getChartEntityId(), chartType });
    }
}