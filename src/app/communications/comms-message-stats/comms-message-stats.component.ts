import { Component, ViewEncapsulation, ViewChild, OnInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';

import { CommsMessage } from 'app/entities/comms-message';
import { ZingData } from 'app/entities/local/zing-chart';
import { Constants } from 'app/common/constants';
import { ICampaignOpenReport, ResponseMessage } from 'app/common/interfaces';
import { Keys } from 'app/common/keys';
import { Utils, Colors } from 'app/common/utils';

import { CommunicationService } from 'app/communications/communications.service';
import { CommsTemplateService } from 'app/communications/comms-template.service';
import { ErrorMessageService } from 'app/services/error-message.service';

import 'tinymce/plugins/textcolor/plugin';
import 'tinymce/plugins/image/plugin';
import 'tinymce/plugins/code/plugin';

import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import { FilterValue } from 'app/components/filter-constellation/interfaces/filter-value';
import { Campus } from 'app/entities/campus';

declare var $: any;

@Component({
    selector: 'app-comms-message-stats',
    templateUrl: './comms-message-stats.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./comms-message-stats.component.scss'],
})

export class CommsMessageStatsComponent implements OnInit {
    readonly DATE_SCALE_HOURS_LIMIT = 48; //hours
    readonly DATE_SCALE_DAYS_LIMIT  = 14; //days
    sentDateTime: string            = '';
    totalSentStat: number           = 0;
    opensStat: number               = 0;
    clicksStat: number              = 0;
    bouncesStat: number             = 0;
    complaintsStat: number          = 0;
    chartTitle: string              = '';
    categories: Array<any>          = [{name: "Total Opens", key: "total_opens", class: "text-warning"}, {name: "Unique Opens", key: "total_items", class: "text-info"}];
    displayedColumns: string[]      = ['name', 'email', 'status', 'clicks'];
    displayedBounceColumns: string[]= ['name', 'email', 'bounces'];
    previewModal                    = {subject:'', from: '', message: ''};
    commsMessage: CommsMessage      = null;
    inputLineZingChart: ZingData    = null;
    filterTags                      = [];
    dataSource;
    dataSourceBounces;
    bounces = [];
    curCampus: Campus               = null;
    @ViewChild('paginatorOpens') paginatorOpens: MatPaginator;
    @ViewChild('paginatorBounces') paginatorBounces: MatPaginator;

    constructor(
        public commService: CommunicationService,
        private commsTemplateService: CommsTemplateService,
        private router: Router,
        private route: ActivatedRoute,
        private errorMessageService: ErrorMessageService,
    ) {}

    /**
     * Inits component data, a native callback method
     * @return {void}
     */
    ngOnInit() {
        this.commService.checkModule().then((isLoaded: boolean) => {
            if (isLoaded) {
                const id = this.route.params['value'].id;
                if (id) {
                    this.commService.getMessage(id).then((res) => {
                        this.commsMessage = res;
                        this.buildReport(res);
                    }).catch(err => console.log(err));
                }
            }
        });
    }

    /**
     * Builds report
     * @param {CommsMessage} commsMessage - comms message object
     * @return {Promise<void[]>}
     */
    private buildReport(commsMessage: CommsMessage): Promise<void[]> {
        // set current campus and timezone
        this.curCampus = commsMessage.campus || this.commService.mainCampus;
        moment.tz.setDefault(this.curCampus.timeZoneId);
        const rawSentDateTime = moment.utc(commsMessage.campaignTime, Constants.dateFormats.dateTime).tz(this.curCampus.timeZoneId);
        this.sentDateTime = `${rawSentDateTime.format('h:mm a')} (${this.curCampus.timeZoneId}) - ${rawSentDateTime.format('D MMMM, YYYY')}`;
        this.dataSource   = Utils.createSortCaseInsensitiveMatTable([]); // I do not know type of the mailchimp member

        if (commsMessage.filterValues && _.isArray(commsMessage.filterValues)) {
            _.forEach(commsMessage.filterValues, (filterValue: FilterValue) => {
                if (filterValue.id == Keys.enquiryDateRange) {  // if date range input
                    const textValue = filterValue.value.startDate + (filterValue.value.endDate != filterValue.value.startDate) ? filterValue.value.endDate : '';
                    this.filterTags.push(textValue);
                } else if(filterValue.textValues) {  // other inputs
                    _.forEach(filterValue.textValues, (textValue) => {
                        this.filterTags.push(textValue);
                    });
                } else {
                    this.filterTags.push(filterValue.value);
                }
            });
        }

        // get campaign report
        const campaignReportPromise = this.getCampaignReport(commsMessage.campaignId);

        // get campaign open details report
        const campaignOpenDetailsReportPromise = this.getCampaignOpenDetailsReport(commsMessage.campaignId);

        // get campaign email activity report
        const campaignEmailActivityReportPromise = this.getCampaignEmailActivityReport(commsMessage.campaignId);

        // gets template
        const templatePromise = this.commsTemplateService.generateTemplate(commsMessage).then((template) => {
            this.previewModal.message = template;
            return template;
        }).catch(async (error: ResponseMessage) => {
            const errMsg: string = await this.errorMessageService.getMessage(error.errorCode, error.errorMessage, error?.params);
            Utils.showNotification(errMsg, Colors.danger);
            return error;
        });

        return Promise.all([campaignReportPromise, campaignOpenDetailsReportPromise, campaignEmailActivityReportPromise, templatePromise]);
    }

    /**
     * Gets campaign report
     * @param {string} campaignId - campaign id
     * @return {Promise<object>} result operation instance
     */
    private getCampaignReport(campaignId: string): Promise<object> {
        return this.commService.getCampaignReport(campaignId).then((report: any) => {
            if(report) {
                this.totalSentStat  = report.emails_sent;
                this.opensStat      = report.opens.opens_total;
                this.clicksStat     = report.clicks.clicks_total;
                this.bouncesStat    = report.bounces.hard_bounces + report.bounces.soft_bounces;
                this.complaintsStat = report.abuse_reports;
            }
            return report;
        });
    }

    /**
     * Gets campaign open details report
     * @param {string} campaignId - campaign id
     * @return {Promise<object>} result operation instance
     */
    private getCampaignOpenDetailsReport(campaignId: string): Promise<object | boolean> {
        return this.commService.getCampaignOpenDetailsReport(campaignId).then((report: any) => {
            if(report) {
                const data = report.members;
                data.forEach((member) => { member.clicks = 0;});
                this.dataSource.data = data;
                this.dataSource.paginator = this.paginatorOpens;
                this.initLineChart(report);

                // get campaign click details report
                return this.commService.getCampaignClickDetailsReport(campaignId).then((clickReport: any) => {
                    if(clickReport) {
                        clickReport.urls_clicked.forEach((url_clicked) => {
                            // get campaign click member details report
                            return this.commService.getCampaignClickMemberDetailsReport(campaignId, url_clicked.id).then((clickedDetailsReport: any) => {
                                const dataSource = this.dataSource.data;
                                _.forEach(clickedDetailsReport.members, (member) => {
                                    const memberIndex = _.findIndex(report.members, (item: any) => item.email_address == member.email_address && item.merge_fields.FNAME == member.merge_fields.FNAME && item.merge_fields.LNAME == member.merge_fields.LNAME);
                                    if(memberIndex !== -1) { dataSource[memberIndex].clicks = member.clicks; }
                                });
                                this.dataSource.data = dataSource;
                                return clickedDetailsReport;
                            });
                        });
                    } else {
                        return Promise.resolve(true);
                    }
                });
            } else {
                return Promise.resolve(true);
            }
        });
    }

    /**
     * Gets campaign email activity report
     * @param {string} campaignId - campaign id
     * @return {Promise<object>} result operation instance
     */
    private getCampaignEmailActivityReport(campaignId: string): Promise<object> {
        return this.commService.getCampaignEmailActivityReport(campaignId).then((emailActivityReport: any) => {
            _.forEach(emailActivityReport, (emailActivity) => {
                const countsByBounceType = _.countBy(emailActivity.activity, 'type');
                const hardBounces = countsByBounceType['hard'] || 0;
                const softBounces = countsByBounceType['soft'] || 0;
                if (hardBounces + softBounces > 0) {
                    this.bounces.push({
                        email:  emailActivity.email_address,
                        name:   emailActivity.name,
                        bounce: (hardBounces) ? 'hard' : 'soft'
                    });
                }
            });
            this.dataSourceBounces = Utils.createSortCaseInsensitiveMatTable([]);
            this.dataSourceBounces.data = this.bounces;
            this.dataSourceBounces.paginator = this.paginatorBounces;
            return emailActivityReport;
        });
    }

    /**
     * Builds line chart
     * @param {any} report - report json
     * @return {void}
     */
    private initLineChart(report: any) {
        this.inputLineZingChart = {
            type: 'line',
            scaleX: {
                labels: [],
                label: {
                    text: ''
                },
                visible: true,
            },
            scaleY: {
                labels: [],
                values: '0:' + report.total_opens + ':1',
                guide: {
                    lineStyle: 'dotted'
                }
            },
            series: [
                { values: [], text: '' },
                { values: [], text: '' }
            ],
            legend: {
                marker: {
                    type: 'square',
                },
            }
        };

        const messageTime = moment.utc(this.commsMessage.campaignTime, Constants.dateFormats.dateTime).tz(this.curCampus.timeZoneId).format();
        const curTime = moment().format();
        const diff = moment(curTime).diff(moment(messageTime), 'hours');
        let matrix: Array<ICampaignOpenReport> = [];

        if (diff > this.DATE_SCALE_HOURS_LIMIT) {  // if scale is days
            this.inputLineZingChart.scaleX.label.text = 'Days';
            this.chartTitle = 'Opens Over 2 Weeks';
            const endTime     = moment(this.commsMessage.campaignTime).add(this.DATE_SCALE_DAYS_LIMIT, 'days').format();
            matrix = this.parseReportData(report.members, moment(endTime).utc().format(), 'YYYY-MM-DD', "MMM D");
        } else {  // if scale is hours
            this.inputLineZingChart.scaleX.label.text = 'Hours';
            this.chartTitle = 'Opens Over ' + this.DATE_SCALE_HOURS_LIMIT + ' Hours';
            const endTime     = moment(this.commsMessage.campaignTime).add(this.DATE_SCALE_HOURS_LIMIT, 'hours').format();
            matrix = this.parseReportData(report.members, moment(endTime).utc().format(), 'YYYY-MM-DD HH', "MMM D, h A");
        }

        // prepare chart series
        this.categories.forEach((category, index) => {
            this.inputLineZingChart.series[index].text = category.name;
            if (category.key == 'total_items') {
                _.forEach(matrix, (item: ICampaignOpenReport) => { this.inputLineZingChart.series[index].values.push(item.uniqueOpens); });
            } else {
                _.forEach(matrix, (item: ICampaignOpenReport) => { this.inputLineZingChart.series[index].values.push(item.totalOpens); });
            }
        });
    }

    /**
     * Parses report data
     * @param {Array<any>} members - members list
     * @param {moment} endTime - moment end time
     * @param {string} keyDateFormat - date format used as key
     * @param {string} labelDateFormat - scale x date format label
     * @return {Array<ICampaignOpenReport>} return parsed data
     */
    private parseReportData(members: Array<any>, endTime, keyDateFormat: string, labelDateFormat: string): Array<ICampaignOpenReport> {
        const matrix: Array<ICampaignOpenReport> = [];
        _.forEach(members, (member) => {
            _.forEach(member.opens, (open) => {
                const rawDay = moment(open.timestamp);
                const dateKey = rawDay.format(keyDateFormat);
                if (rawDay.isBefore(moment(endTime))) {  // should not exceed two weeks
                    const matrixIndex = _.findIndex(matrix, (item: ICampaignOpenReport) => item.date === dateKey);
                    if (matrixIndex == -1) {
                        matrix.push({ date: dateKey, uniqueOpens: 1, totalOpens: 1, emailId: member.email_id });
                        this.inputLineZingChart.scaleX.labels.push(rawDay.format(labelDateFormat));
                    } else {
                        const uniqueCount     = (_.find(matrix, (item: ICampaignOpenReport) => item.emailId === member.email_id)) ? matrix[matrixIndex].uniqueOpens : matrix[matrixIndex].uniqueOpens+1;
                        matrix[matrixIndex] = { date: dateKey, uniqueOpens: uniqueCount, totalOpens: matrix[matrixIndex].totalOpens+1, emailId: member.emailId };
                    }
                }
            });
        });
        return matrix;
    }

    /**
     * Previews message in modal dialog
     * @return {void}
     */
    private previewMessage() {
        this.previewModal.subject = this.commsMessage.subject;
        this.previewModal.from    = this.commsMessage.fromUser.firstName + ' ' + this.commsMessage.fromUser.lastName;
        $('#previewModal').modal('show');
    }

    /**
     * Redirects to messages listing
     * @return {void}
     */
    onCancel() {
        this.router.navigate([this.commService.HOME_LINK]);
    }
}
