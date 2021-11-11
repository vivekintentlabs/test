import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { PlatformLocation } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { InfiniteScrollTable } from 'app/infinite-scroll-table';

import { Utils, Colors } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { LocalDatePipe } from 'app/common/pipes/date.pipe';
import { DuplicateContact } from 'app/common/types';
import { MergeState, ModalAction } from 'app/common/enums';

import { Campus } from 'app/entities/campus';
import { UserInfo } from 'app/entities/userInfo';

import { HttpService } from 'app/services/http.service';
import { StorageService } from 'app/services/storage.service';
import { LocaleService } from 'app/services/locale.service';
import { ContactsService } from '../contacts/contacts.service';

import { MergeQuery, MergeService } from '../state/merge';

import { MergeContactComponent } from 'app/components/merge-enquiry/merge-contact.component';
import { ReviewStudentsComponent } from 'app/components/review-students/review-students.component';
import { MergeStudentComponent } from 'app/components/merge-enquiry/merge-student.component';

import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-duplicate-contacts',
    templateUrl: 'duplicate-contacts.component.html',
    styleUrls: ['./duplicate-contacts.component.scss'],
    providers: [ContactsService],
})
export class DuplicateContactsComponent extends InfiniteScrollTable<DuplicateContact> implements OnInit {
    tableId = 'duplicateContactsTable';
    allContacts: DuplicateContact[] = [];
    contacts: DuplicateContact[] = [];
    private userInfo: UserInfo = null;

    private lastOne = 0;
    private color = false;
    private campuses: Campus[] = [];
    currentCampusTimeZone: string;
    mergeLinkMsgs: object = this.contactsService.getMergeLinkMsgs();
    date = Constants.localeFormats.date;
    private localDatePipe: LocalDatePipe;
    merge_state$: Observable<string>;

    constructor(
        storageService: StorageService,
        private router: Router,
        private httpService: HttpService,
        private localeService: LocaleService,
        public contactsService: ContactsService,
        private modalService: NgbModal,
        private mergeQuery: MergeQuery,
        private mergeService: MergeService,
        private platformLocation: PlatformLocation,
    ) {
        super(storageService);
        this.displayedColumns = ['select', 'updatedAt', 'name', 'address', 'location', 'email', 'mobile', 'actions'];
        this.localDatePipe = new LocalDatePipe(this.localeService);

        this.searchDebounce.pipe(debounceTime(this.debounceTime), takeUntil(this.unsubscribe)).subscribe((searchText: string) => {
            super.applySearch(searchText);
            this.selection.clear();
            this.dataSource.filter = _.toLower(_.trim(searchText));
            this.getTableRows = new Promise((resolve, reject) => {
                resolve(this.getTotalCount());
            });
        });

        this.mergeService.setMergeState('');
        this.merge_state$ = this.mergeQuery.merge_state$;
        const self = this;
        this.merge_state$.pipe(takeUntil(this.unsubscribe)).subscribe({
            next(x) {
                switch (x) {
                    case MergeState.mergingContacts:
                        self.openMergeContact();
                        break;
                    case MergeState.reviewStudents:
                        self.openReviewStudents();
                        break;
                    case MergeState.mergingStudents:
                        self.openMergeStudents();
                        break;
                    default:
                        break;
                }
            },
            error(err) { console.error('something wrong occurred: ' + err); }
        });
    }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.getTableRows = this.loadContacts();
    }

    getTotalCount() {
        return (this.dataSource && this.dataSource.filter) ? this.dataSource.filteredData.length : this.contactsService.total;
    }

    onSortChange() { }

    onFilterChange() { }

    onSearchChange(searchText: string) {
        this.searchDebounce.next(searchText);
    }

    private loadContacts(): Promise<number> {
        return Promise.all([this.getDuplicateContacts(), this.getCamuses()]).then(() => {
            return this.getMore5Contacts().then((contacts: DuplicateContact[]) => {
                this.contacts = contacts;
                this.buildTable(this.contacts);
                this.getMoreContactsIfNeeded();
                return this.getTotalCount();
            });
        });
    }

    onScrollDown() {
        if (this.contacts.length < this.contactsService.total) {
            return this.getTableRows.then(() => {
                return this.getTableRows = this.getMore5Contacts().then((contacts: DuplicateContact[]) => {
                    if (contacts && contacts.length) {
                        this.contacts.push(...contacts);
                        this.updateTable(this.contacts);
                        if (this.selectAllHasBeenToggled) {
                            this.dataSource.filteredData.forEach(row => {
                                if (_.includes(_.map(contacts, c => c.id), row.id)) {
                                    this.selection.select(row);
                                }
                            })
                        }
                        this.getMoreContactsIfNeeded();
                        return this.contacts.length;
                    }
                });
            })
        }
    }

    private getMoreContactsIfNeeded() {
        if (this.contacts.length < this.contactsService.total) {
            setTimeout(() => {
                this.onScrollDown();
            }, 0)
        }
    }

    private getMore5Contacts(): Promise<DuplicateContact[]> {
        const skipIds = _.map(this.contacts, c => c.id);
        const more5Contacts = _(this.allContacts).filter(c => !_.includes(skipIds, c.id)).take(5).value();
        return Promise.resolve(more5Contacts);
    }

    private getDuplicateContacts(): Promise<void> {
        return this.httpService.getAuth('contacts/duplicate-contacts').then((contacts: DuplicateContact[]) => {
            this.allContacts = contacts;
            this.contactsService.total = this.allContacts.length;
            this.setColorForDuplicates(this.allContacts);
        });
    }

    private setColorForDuplicates(contacts: DuplicateContact[]) {
        _.forEach(contacts, (contact: DuplicateContact) => {
            if (this.lastOne !== contact.duplicate) {
                this.color = !this.color;
                this.lastOne = contact.duplicate;
            }
            contact.color = (this.color) ? 'duplicate-info' : 'duplicate-warning';
        });
    }

    private getCamuses(): Promise<void> {
        return this.httpService.getAuth('campus?fields=id,name,campusType,timeZoneId').then((campuses: Campus[]) => {
            this.campuses = campuses;
            this.currentCampusTimeZone = Utils.getCurrentCampusTimeZoneId(this.campuses, this.userInfo.campusId);
        });
    }

    protected buildTable(contacts: DuplicateContact[]) {
        this.dataSource = new MatTableDataSource<DuplicateContact>(contacts);

        // customization for filter
        this.dataSource.filterPredicate = (data, filter: string) => {
            const values = [];
            this.displayedColumns.forEach(fieldName => {
                let value;
                if (fieldName === 'updatedAt') {
                    value = this.localDatePipe.transform(data['updatedAt'], this.currentCampusTimeZone).slice(0, 10);
                } else {
                    value = _.get(data, fieldName);
                }
                if (value) {
                    values.push(_.toLower(value));
                }
            })
            const transformedFilter = filter.trim().toLowerCase();
            return values.find(i => _.includes(i, transformedFilter));
        };
    }

    editContact(id: number) {
        this.router.navigate([`/${environment.localization.enquiriesUrl}/edit-contact`, { contactId: id }]);
    }

    deleteContact(contactId: number): Promise<any> {
        return Utils.deletedQuestion().then((result) => {
            if (result && result.value) {
                return this.contactsService.delete(contactId).then((notDeletedIds: number[]) => {
                    if (_.isEmpty(notDeletedIds)) {
                        return Utils.deletedSuccessfully().then(() => {
                            this.deselectItems([contactId]);
                            this.removeContactsFromLocalArrays([contactId]);
                            return Promise.resolve(true);
                        });
                    } else {
                        Utils.showNotification(
                            'The contact could not be deleted, because it is the only primary contact for one or more students.',
                            Colors.warning
                        );
                        return Promise.resolve(false);
                    }
                });
            } else {
                return Promise.resolve(false);
            }
        });
    }

    private removeContactsFromLocalArrays(contactIds: number[]) {
        _.remove(this.allContacts, c => _.includes(contactIds, c.id));
        _.remove(this.contacts, c => _.includes(contactIds, c.id));
        _.remove(this.dataSource.data, c => _.includes(contactIds, c.id));
        this.dataSource.data = _.clone(this.dataSource.data);
    }

    protected selectionChanged() {
        super.selectionChanged();
        this.updateMessages();
        this.selectedCount = this.selection.selected.length;
    }

    private updateMessages() {
        const ids = this.getVisibleSelectedIds();
        this.mergeLinkMsgs = this.contactsService.getMergeLinkMsgs(ids.length);
    }

    mergeContacts() {
        this.mergeService.setMergeContactIds(this.getVisibleSelectedIds());
        this.mergeService.setMergeState(MergeState.mergingContacts);
    }

    openMergeContact() {
        const modalMergeContactRef = this.modalService.open(MergeContactComponent, Constants.ngbModalXl);
        modalMergeContactRef.componentInstance.ids = this.mergeService.getMergeContactIds();
        modalMergeContactRef.componentInstance.schoolTimeZone = this.currentCampusTimeZone;
        modalMergeContactRef.result.then((result: { action: ModalAction, id?: number }) => {
            switch (result.action) {
                case ModalAction.MergeContacts:
                    this.mergeService.setMergeContactIds([result.id]);
                    this.mergeService.setMergeState(MergeState.reviewStudents);
                    return;
                case ModalAction.Cancel:
                    this.mergeService.setMergeState('');
                    break;
                default:
                    break;
            }
        }).catch((err) => modalMergeContactRef.dismiss(err));
        this.platformLocation.onPopState(() => {
            modalMergeContactRef.close({ action: ModalAction.LeavePage });
        });
    }

    openReviewStudents() {
        const modalReviewStudentstRef = this.modalService.open(ReviewStudentsComponent, Constants.ngbModalXl);
        modalReviewStudentstRef.componentInstance.id = _.first(this.mergeService.getMergeContactIds());
        modalReviewStudentstRef.result.then((res: { action: ModalAction, studentIds?: number[] }) => {
            switch (res.action) {
                case ModalAction.MergeStudents:
                    this.mergeService.setMergeStudentIds(res.studentIds);
                    this.mergeService.setMergeState(MergeState.mergingStudents);
                    return;
                case ModalAction.Done:
                case ModalAction.Cancel:
                    this.mergeService.setMergeState('');
                    this.selection.clear();
                    this.getTableRows = this.loadContacts();
                    Utils.showSuccessNotification('Merges successfully saved');
                    return;
                default:
                    break;
            }
        }).catch((err) => modalReviewStudentstRef.dismiss(err));
        this.platformLocation.onPopState(() => {
            modalReviewStudentstRef.close({ action: ModalAction.LeavePage });
        });
    }

    openMergeStudents() {
        const modalMergeStudentstRef = this.modalService.open(MergeStudentComponent, Constants.ngbModalXl);
        modalMergeStudentstRef.componentInstance.ids = this.mergeService.getMergeStudentIds();
        modalMergeStudentstRef.componentInstance.contactId = _.first(this.mergeService.getMergeContactIds());
        modalMergeStudentstRef.componentInstance.schoolTimeZone = this.currentCampusTimeZone;
        modalMergeStudentstRef.result.then((res: { action: ModalAction, id?: number }) => {
            switch (res.action) {
                case ModalAction.MergeStudents:
                    this.mergeService.setMergeContactIds([res.id]);
                    this.mergeService.setMergeState(MergeState.reviewStudents);
                    break;
                case ModalAction.Done:
                    this.mergeService.setMergeState('');
                    this.actionAfterMergeOrLinking('Merges successfully saved');
                    return;
                case ModalAction.Cancel:
                    this.mergeService.setMergeState(MergeState.reviewStudents);
                    break;
                default:
                    break;
            }
        }).catch((err) => modalMergeStudentstRef.dismiss(err));
        this.platformLocation.onPopState(() => {
            modalMergeStudentstRef.close({ action: ModalAction.LeavePage });
        });
    }

    linkingContacts() {
        const ids = this.getVisibleSelectedIds();
        const linkingContacts = _.filter(this.contacts, c => ids.includes(c.id));
        Swal.fire(this.contactsService.getLinkingConfig(linkingContacts)).then((result) => {
            if (result && result.value) {
                this.contactsService.linkingContacts(ids).then(() => {
                    this.actionAfterMergeOrLinking('Linking successfully saved');
                }).catch(err => {
                    console.log(err);
                });
            }
        });
    }

    private actionAfterMergeOrLinking(msg: string): Promise<number> {
        this.contacts = [];
        this.selection.clear();
        this.updateTable(this.contacts);
        Utils.showSuccessNotification(msg);
        return this.getTableRows = this.getDuplicateContacts().then(() => {
            return this.getMore5Contacts().then((contacts: DuplicateContact[]) => {
                this.contacts = contacts;
                this.updateTable(this.contacts);
                this.getMoreContactsIfNeeded();
                return this.contacts.length;
            });
        });
    }

    leaveDuplicatesMode() {
        this.router.navigate([`/${environment.localization.enquiriesUrl}/contacts`]);
    }

}
