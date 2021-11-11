import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { CommunicationService } from 'app/communications/communications.service';
import { CommsUtils } from 'app/communications/comms-utils';
import { CommsMessage } from 'app/entities/comms-message';
import { Constants } from 'app/common/constants';
import { Utils } from 'app/common/utils';

import * as moment from 'moment';
import * as _ from 'lodash';
import Swal from 'sweetalert2';

@Component({
    selector: 'comms-sent-messages',
    templateUrl: 'comms-sent-messages.component.html',
    styleUrls: ['comms-sent-messages.component.scss']
})

export class CommsSentMessagesComponent implements OnInit {
    displayedColumns: string[] = [
        'campaignTime', 'subject', 'activity', 'log', 'audience',
        'stats.opens.opens_total', 'stats.clicks.clicks_total',
        'stats.bounces.soft_bounces', 'stats.abuse_reports', 'campus.name', 'actions'];
    dataSource;
    dateDelimiterTimeShort = Constants.localeFormats.dateDelimiterTimeShort;
    @Output() onDataEvent = new EventEmitter();
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild(MatPaginator) paginator: MatPaginator;

    constructor(private router: Router, public commService: CommunicationService) {}

    /**
     * Inits component data, a native callback method
     * @return {void}
     */
    ngOnInit() {
        this.getMessages();
    }

    /**
     * Gets messages with status sent
     * @return {Promise<any>}
     */
    getMessages(): Promise<any> {
        let minDate = moment().unix();
        let maxDate = 0;
        return this.commService.getMessages('sent').then((messages: any) => {
            let data = messages;
            data.forEach((element, index) => {
                data[index].stats = element;
                const unix = moment(element.campaignTime, 'YYYY-MM-DD HH:mm:ss').unix();
                if (unix < minDate) { minDate = unix; }
                if (unix > maxDate) { maxDate = unix; }
            });

            const minDateTime = moment.unix(minDate).format('YYYY-MM-DD HH:mm:ss');
            const maxDateTime = moment.unix(maxDate).format('YYYY-MM-DD HH:mm:ss');

            // get stats for messages
            return this.commService.getCampaignReports(minDateTime, maxDateTime).then((result: any) => {
                _.forEach(data, (dataItem) => {
                    _.forEach(result.reports, (report) => {
                        if (dataItem.campaignId === report.id) {
                            dataItem.stats = report;
                        }
                    });
                });
                this.dataSource = new MatTableDataSource();
                this.dataSource.paginator = this.paginator;
                this.dataSource.sort = this.sort;
                data = _.orderBy(data, ['campaignTime'], ['desc']);
                this.dataSource.data = data;
                this.dataSource.sortingDataAccessor = (item, property) => {
                    switch (property) {
                        case 'campaignTime': return Utils.getUnixTimestamp(item.campaignTime);
                        default: return _.toLower(_.get(item, property));
                    }
                };
                return result;
            });
        }).catch(err => console.log(err));
    }

    /**
     * Copies message object
     * @param {CommsMessage} commsMessage - message object
     * @return {Promise<any>}
     */
    copy(element: CommsMessage): Promise<any> {
        return Swal.fire({
            title: 'Are you sure?',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn btn-success',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Yes, copy item!',
            buttonsStyling: false
        }).then((result) => {
            if (result && result.value) {
                const copiedElement = CommsUtils.cloneMsg(element);
                copiedElement.subject = `Copy of ${element.subject}`;
                copiedElement.stats = null;
                return this.commService.copyMessage(copiedElement).then((res) => {
                    if (res) {
                        Swal.fire({
                            title: 'Copied!',
                            text: 'Your item has been copied.',
                            type: 'success',
                            confirmButtonClass: 'btn btn-success',
                            buttonsStyling: false
                        });
                        this.onDataEvent.emit(null);
                    }
                    return res;
                }).catch(err => console.log(err));
            }
            return result;
        });
    }

    /**
     * Redirects to message stats page
     * @param {number} id - message id
     * @return {void}
     */
    viewStats(id: number) {
        this.router.navigate([this.commService.BASE_URL + '/message-stats', id]);
    }
}
