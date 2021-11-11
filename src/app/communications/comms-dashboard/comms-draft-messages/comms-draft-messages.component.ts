import { Component, OnInit, ViewChild, EventEmitter, Output } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Utils } from 'app/common/utils';
import { CommsMessage } from 'app/entities/comms-message';
import { CommunicationService } from 'app/communications/communications.service';
import { CommsUtils } from 'app/communications/comms-utils';

import * as _ from 'lodash';
import Swal from 'sweetalert2';

@Component({
    selector: 'comms-draft-messages',
    templateUrl: 'comms-draft-messages.component.html',
    styleUrls: ['comms-draft-messages.component.scss']
})

export class CommsDraftMessagesComponent implements OnInit {
    displayedColumns: string[] = ['date', 'subject', 'activity', 'audience', 'campus', 'actions'];
    dataSource: MatTableDataSource<CommsMessage>;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @Output() showTestEmailModal = new EventEmitter<CommsMessage>();

    constructor(private router: Router, public commService: CommunicationService) {}

    /**
     * Inits component data, a native callback method
     * @return {void}
     */
    ngOnInit() {
        this.getMessages();
    }

    /**
     * Gets messages with status draft
     * @return {Promise<any>}
     */
    getMessages(): Promise<any> {
        return this.commService.getMessages('draft').then((data: Array<CommsMessage>) => {
            this.dataSource = Utils.createSortCaseInsensitiveMatTable<CommsMessage>([]);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            data = _.orderBy(data, ['updatedAt'], ['desc']);
            this.dataSource.data = data;
            this.dataSource.sortingDataAccessor = (item, property) => {
                switch (property) {
                    case 'date': return Utils.getUnixTimestamp(item.updatedAt);
                    default: return _.toLower(_.get(item, property));
                }
            };
            return data;
        }).catch(err => console.log(err));
    }

    /**
     * Redirects to create message page
     * @return {void}
     */
    onCreate() {
        this.router.navigate([this.commService.BASE_URL + '/create']);
    }

    /**
     * Redirects to schedule page
     * @param {number} id - message id
     * @return {void}
     */
    schedule(id: number) {
        this.router.navigate([this.commService.BASE_URL + '/schedule-message', id]);
    }

    /**
     * Redirects to edit message page
     * @param {number} id - message id
     * @return {void}
     */
    edit(id: number) {
        this.router.navigate([this.commService.BASE_URL + '/edit-message', id]);
    }

    /**
     * Deletes message object
     * @param {CommsMessage} element - message object
     * @return {Promise<any>}
     */
    remove(element: CommsMessage): Promise<any> {
        return Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this item.',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn btn-delete',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Yes, delete item!',
            buttonsStyling: false
        }).then((result) => {
            if (result && result.value) {
                return this.commService.deleteMessage(element.id).then(() => {
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'Your item has been deleted.',
                        type: 'success',
                        confirmButtonClass: 'btn btn-success',
                        buttonsStyling: false
                    });
                    return this.getMessages();
                }).catch(err => console.log(err));
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
                return this.commService.copyMessage(copiedElement).then((res) => {
                    if (res) {
                        Swal.fire({
                            title: 'Copied!',
                            text: 'Your item has been copied.',
                            type: 'success',
                            confirmButtonClass: 'btn btn-success',
                            buttonsStyling: false
                        });
                        return this.getMessages();
                    }
                    return res;
                }).catch(err => console.log(err));
            }
            return result;
        });
    }

    /**
     * Refreshes messages list, EventEmitter on scheduled messages
     * @return {void}
     */
    onDataEvent() {
        this.getMessages();
    }
}
