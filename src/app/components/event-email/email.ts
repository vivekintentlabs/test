import { Input, AfterViewInit, ChangeDetectorRef, ViewChild, Directive } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Utils, Colors } from '../../common/utils';
import { Constants } from '../../common/constants';
import { HttpService } from '../../services/http.service';
import { EventEmail } from '../../entities/event-email';

import * as _ from 'lodash';
import Swal from 'sweetalert2';

import { EditEmailComponent } from '../edit-email/edit-email.component';
import { SendTestEmailComponent } from '../send-test-email/send-test-email.component';
import { ModalAction } from 'app/common/enums';

@Directive()
export abstract class EmailComponent implements AfterViewInit {
    @Input() id: any;
    @Input() campusTimezoneId: string;
    @ViewChild(EditEmailComponent) editEmailComponent;
    public type: string;
    public insertSubjectEmail;
    public insertMessageEmail;
    public emails: Array<EventEmail> = null;
    public hasTwoCampus: boolean;
    public email: EventEmail = null;
    public deleteIds: Array<number> = [];
    public noItemSelected = Constants.noItemSelected; // show constant string in html
    public title = 'Edit';
    public collectDescription = false;
    public titleEmail: string;
    public eventTypeName: string;
    public subject = '';
    public from = '';
    public body = '';
    public content;

    constructor(
        protected httpService: HttpService,
        private ref: ChangeDetectorRef,
        private modalService: NgbModal,
        private platformLocation: PlatformLocation,
    ) { }

    ngAfterViewInit() {
        this.getData();
    }
    protected abstract doGetData(): Promise<any>;
    protected abstract doSendTestEmail(email: string): Promise<any>;

    public getData(): Promise<any> {
        this.emails = null;
        return this.doGetData().then((result: any) => {
            this.emails = Utils.sortEmailBySchedule<EventEmail>(result.emails);
            this.hasTwoCampus = (result.countCampuses === 2) ? true : false;
            _.forEach(this.emails, (eventEmail: EventEmail) => {
                eventEmail.sentString = eventEmail.isImmediate
                    ? 'Send immediately after registration'
                    : ((eventEmail.scheduleMoment === 'prior')
                        ? eventEmail.scheduleDays + ' day(s) prior to ' + this.eventTypeName
                        : eventEmail.scheduleDays + ' day(s) after the ' + this.eventTypeName);

                eventEmail.to = (eventEmail.scheduleMoment === 'prior' || eventEmail.isImmediate)
                    ? 'All'
                    : ((eventEmail.scheduleMoment === 'after' && eventEmail.isCheckedIn) ? 'Checked In' : 'Did not Check In');
            });
            Utils.DetectChanges(this.ref);
            return Promise.resolve();
        }).catch(err => console.log(err));
    }

    addItem() {
        this.email = null;
        this.title = 'Add';
        this.email = new EventEmail();
        this.email.activated = true;
        this.email.isImmediate = true;
        this.email.type = this.type;
        Utils.DetectChanges(this.ref);
        this.editEmailComponent.preparePopUp();
    }

    edit(item) {
        this.email = null;
        this.title = 'Edit';
        this.email = new EventEmail();
        this.email = item;
        Utils.DetectChanges(this.ref);
        this.editEmailComponent.preparePopUp();
    }

    showSendTestEmail(item) {
        this.email = item;
        const modalSendTestEmailRef = this.modalService.open(SendTestEmailComponent, Constants.ngbModalLg);
        modalSendTestEmailRef.result.then((result: { action: ModalAction, email: string }) => {
            switch (result.action) {
                case ModalAction.Done:
                    return this.doSendTestEmail(result.email).then(() => {
                        Utils.showNotification('Test Email successfully sent.', Colors.success);
                        return Promise.resolve();
                    }).catch(err => console.log(err));
                default:
                    break;
            }
        }).catch((err) => modalSendTestEmailRef.dismiss(err));
        this.platformLocation.onPopState(() => {
            modalSendTestEmailRef.close({ action: ModalAction.LeavePage });
        });
    }

    sendTestEmail(email: string) {
        return this.doSendTestEmail(email).then(() => {
            Utils.showNotification('Test Email successfully sent.', Colors.success);
            return Promise.resolve();
        }).catch(err => console.log(err));
    }

    activate(value: boolean, item: EventEmail) {
        item.activated = value;
        const data: EventEmail = item;
        this.httpService.postAuth('event-email/activate', data).then((res) => {
            Utils.showSuccessNotification();
        }).catch(err => console.log(err));
    }

    select(id: number, isChecked: boolean) {
        if (isChecked) {
            this.deleteIds.push(id);
        } else {
            _.pull(this.deleteIds, id);
        }
    }

    selectAll(isChecked: boolean) {
        this.emails.forEach(x => x.check = isChecked);
        if (isChecked) {
            _.remove(this.deleteIds);
            _(this.emails).forEach((item) => {
                this.deleteIds.push(item.id);
            });
        } else {
            _.remove(this.deleteIds);
        }
    }

    isAllSelected() {
        return _.every(this.emails, 'check');
    }

    removeAll() {
        Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this item(s).',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn btn-delete',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Yes, delete item(s)!',
            buttonsStyling: false
        }).then((result) => {
            if (result && result.value) {
                this.httpService.postAuth('event-email/delete', this.deleteIds).then((res) => {
                    return this.getData().then(() => {
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Your item(s) has been deleted.',
                            type: 'success',
                            confirmButtonClass: 'btn btn-success',
                            buttonsStyling: false
                        });
                        _.remove(this.deleteIds);
                    });
                }).catch(err => console.log(err));
            }
        });
    }

    remove(id: number) {
        Swal.fire({
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
                this.httpService.postAuth('event-email/delete', [id]).then((res) => {
                    return this.getData().then(() => {
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Your item(s) has been deleted.',
                            type: 'success',
                            confirmButtonClass: 'btn btn-success',
                            buttonsStyling: false
                        });
                        _.remove(this.deleteIds);
                    });
                }).catch(err => console.log(err));
            }
        });
    }

}
