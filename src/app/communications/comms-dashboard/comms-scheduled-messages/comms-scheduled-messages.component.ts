import { Component, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Utils, Colors } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { CommunicationService } from '../../communications.service';
import { CommsMessage } from 'app/entities/comms-message';
import { CommsUtils } from 'app/communications/comms-utils';

import * as _ from 'lodash';
import Swal from 'sweetalert2';

@Component({
    selector: 'comms-scheduled-messages',
    templateUrl: 'comms-scheduled-messages.component.html',
    styleUrls: ['comms-scheduled-messages.component.scss']
})

export class CommsScheduledMessagesComponent implements OnInit {
    displayedColumns: string[] = ['campaignTime', 'subject', 'activity', 'audience', 'campus', 'actions'];
    dataSource: MatTableDataSource<CommsMessage>;
    dateDelimiterTimeShort = Constants.localeFormats.dateDelimiterTimeShort;
    @Output() onDataEvent = new EventEmitter();
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @Output() showTestEmailModal = new EventEmitter<CommsMessage>();

    constructor(private router: Router, public commService: CommunicationService) { }

    /**
     * Inits component data, a native callback method
     * @return {void}
     */
    ngOnInit() {
        this.getMessages();
    }

    /**
     * Gets messages with status scheduled
     * @return {Promise<any>}
     */
    getMessages(): Promise<any> {
        return this.commService.getMessages('scheduled').then((data: any) => {
            this.dataSource = new MatTableDataSource<CommsMessage>([]);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            data = _.orderBy(data, ['campaignTime'], ['asc']);
            this.dataSource.data = data;
            this.dataSource.sortingDataAccessor = (item, property) => {
                switch (property) {
                    case 'campaignTime': return Utils.getUnixTimestamp(item.campaignTime);
                    default: return _.toLower(_.get(item, property));
                }
            };
            return data;
        }).catch(err => console.log(err));
    }

    /**
     * Redirects to edit schedule page
     * @param {number} id - message id
     * @return {void}
     */
    editSchedule(id: number) {
        this.router.navigate([this.commService.BASE_URL + '/edit-scheduled-message', id]);
    }

    /**
     * Redirects to edit message page
     * @param {CommsMessage} commsMessage - message object
     * @return {Promise<object>}
     */
    editMessage(commsMessage: CommsMessage):Promise<object> {
        return Swal.fire({
            title: 'Warning',
            text: 'To continue editing this message it will be moved to drafts',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn btn-success',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Continue',
            buttonsStyling: false
        }).then((result) => {
            if (result && result.value) {
                commsMessage.status = 'draft';
                return this.commService.updateMessage(commsMessage).then((res) => {
                    if (res && res.id) {
                        this.router.navigate([this.commService.BASE_URL + '/edit-message', commsMessage.id]);
                    }
                    return res;
                });
            }
            return result;
        });
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
                const d = this.dataSource.data;
                d.push(copiedElement);
                this.dataSource.data = d;
                this.commService.copyMessage(copiedElement).then((res) => {
                    if (res) {
                        Swal.fire({
                            title: 'Copied!',
                            text: 'Your item has been copied.',
                            type: 'success',
                            confirmButtonClass: 'btn btn-success',
                            buttonsStyling: false
                        });
                        this.onDataEvent.emit(null);
                        return this.getMessages();
                    }
                }).catch(err => console.log(err));
            }
            return result;
        });
    }
}
