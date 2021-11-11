import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ListenerService } from 'app/services/listener.service';
import { GroupedTablePieChartService } from './grouped-table-pie-chart.service';

import { Utils } from 'app/common/utils';
import { IWidgetParams } from 'app/common/interfaces';

import { UserInfo } from 'app/entities/userInfo';
import { ListItem } from 'app/entities/list-item';
import { PieSeries } from 'app/entities/local/pie-chart-table-data';
import { Student } from 'app/entities/student';
import { YearLevel } from 'app/entities/year-level';

import * as _ from 'lodash';

declare var $: any;

@Component({
    selector: 'app-grouped-table-pie-chart',
    templateUrl: './grouped-table-pie-chart.component.html',
    styleUrls: ['./grouped-table-pie-chart.component.scss']
})
export class GroupedTablePieChartComponent implements OnInit, OnDestroy {

    private userInfo: UserInfo = null;

    loaded = false;
    startingYears: number[];
    stages: ListItem[] = [];
    classNames: string[] = [];
    groupedRows: object[] = [];
    widgetParams: IWidgetParams;

    legendWidth = 0;
    readonly DEFAULT_HEIGHT = 220;
    readonly DEFAULT_ROW_HEIGHT = 60;
    readonly DEFAULT_COL_WIDTH = 320;
    readonly BOOTSTRAP_MAX_COL_SIZE = 12;
    readonly LEGEND_LETTER_SIZE = 9;
    readonly CLASSNAMES = [
        'text-twelve', 'text-ten', 'text-success', 'text-six', 'text-seven', 'text-eight', 'text-eleven', 'text-twelve', 'text-thirteen'
    ];

    private pieChartDataSeries: any[];
    private unsubscribe = new Subject();

    constructor(
        private listenerService: ListenerService,
        private groupedTablePieChartService: GroupedTablePieChartService,
    ) {
        this.listenerService.campusListStatus().pipe(takeUntil(this.unsubscribe)).subscribe(() => this.campusChange());
    }

    /**
     * Inits component data, a native callback method
     * @return {void}
     */
    ngOnInit() {
        return this.groupedTablePieChartService.getData().then(() => {
            this.userInfo = Utils.getUserInfoFromToken();

            this.stages = this.groupedTablePieChartService.stages;
            _.forEach(this.stages, (stage, index) => {
                this.classNames.push(this.CLASSNAMES[index]);
                // get legend size instead of jquery, this is a workaround to know the size of the legend
                const legendSize = Math.ceil(stage.name.length * this.LEGEND_LETTER_SIZE);
                if (this.legendWidth < legendSize) {
                    this.legendWidth = legendSize;
                }
            });
            this.widgetParams = this.groupedTablePieChartService.campusIsChanged();

            this.loaded = true;
        });
    }

    /**
     * Campus change event listener
     * @return {void}
     */
    campusChange() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.groupedTablePieChartService.campusId = this.userInfo.campusId || 'all';
        this.widgetParams = this.groupedTablePieChartService.campusIsChanged();
    }

    widgetCallBack(students: Student[]) {
        this.calculateGroupedTablePieChart(students);
    }

    /**
     * Prepares chart object data
     * @param {Array<number>} pieChartDataSeries - chart series data
     * @return {object} - chart data object
     */
    private prepareChartObj(pieChartDataSeries: number[]): object {
        const data: any = {};
        data.pieChartDataSeries = pieChartDataSeries;
        const pieChartDataSeriesLength =
            (data.pieChartDataSeries && data.pieChartDataSeries.length) ? data.pieChartDataSeries.length + 1 : 1;
        data.colSize = Math.floor(this.BOOTSTRAP_MAX_COL_SIZE / pieChartDataSeriesLength);
        return data;
    }

    /**
     * Calculates grouped table pie chart data
     * @return {Array<PieSeries>} - chart series data
     */
    private calculateGroupedTablePieChart(students: Student[]) {
        const startingYears = Utils.getStartingYearList(students);
        const selectedYearLevels = Utils.getYearLevelList(students);
        this.pieChartDataSeries = [];

        _.forEach(selectedYearLevels, (yearLevel: YearLevel) => {
            const pieChartData = new PieSeries();
            const pieChartArray = [];
            _.forEach(this.stages, (stage, stageIndex) => {
                const filteredStudents = _.filter(students, s => (
                    _.includes(startingYears, s.startingYear) &&
                    s.studentStatus.stageId === stage.id &&
                    s.schoolIntakeYearId === yearLevel.id
                ));
                pieChartArray.push(filteredStudents.length);
                if (stageIndex === this.stages.length - 1) {
                    pieChartData.total = _.sum(pieChartArray);
                    pieChartData.label = yearLevel ? yearLevel.name : 'Other';
                    pieChartData.data = _.map(pieChartArray, i => Math.round(i * 100 / pieChartData.total));
                    pieChartData.rawData = pieChartArray;
                }
            });
            this.pieChartDataSeries.push(pieChartData);
        });

        this.calculateWidth();
    }

    /**
     * Calculates grouped table pie chart data dimensions
     * @return {void}
     */
    private calculateWidth() {
        this.groupedRows = [];

        const tableWidth = Math.ceil($('.grouped-table-chart').outerWidth()) - this.legendWidth;
        const cols = Math.floor(tableWidth / this.DEFAULT_COL_WIDTH);
        if (tableWidth < this.DEFAULT_COL_WIDTH) {
            _.forEach(this.pieChartDataSeries, (pieChartData, index) => {
                this.groupedRows.push(this.prepareChartObj(_.fill(Array(1), this.pieChartDataSeries[index])));
            });
        } else if (this.pieChartDataSeries && this.pieChartDataSeries.length > cols) {
            const chunkedPieChartDataSeries = _.chunk(this.pieChartDataSeries, cols);
            _.forEach(chunkedPieChartDataSeries, (pieChartData, index) => {
                this.groupedRows.push(this.prepareChartObj(chunkedPieChartDataSeries[index]));
            });
        } else {
            this.groupedRows.push(this.prepareChartObj(this.pieChartDataSeries));
        }
    }

    /**
     * Event listener on window resize
     * @return {void}
     */
    @HostListener('window:resize', ['$event'])
    onResize(event) {
        $('.grouped-table-chart .ct-chart').empty();
        this.calculateWidth();
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }
}
