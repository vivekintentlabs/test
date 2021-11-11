import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlatformLocation } from '@angular/common';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { InfiniteScrollTable } from 'app/infinite-scroll-table';

import { Utils, Colors } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { MinifiedContact } from 'app/common/interfaces';
import { MergeState, ModalAction } from 'app/common/enums';

import { School } from 'app/entities/school';
import { Campus } from 'app/entities/campus';
import { CustomHttpParams } from 'app/entities/custom-http-params';
import { UserInfo } from 'app/entities/userInfo';

import { HttpService } from 'app/services/http.service';
import { ListenerService } from 'app/services/listener.service';
import { StorageService } from 'app/services/storage.service';
import { ContactsService } from './contacts.service';
import { PromiseQueueService } from 'app/services/promise-queue.service';

import { MergeQuery, MergeService } from '../state/merge';

import { FilterValue } from 'app/components/filter-constellation/interfaces/filter-value';
import { MergeContactComponent } from 'app/components/merge-enquiry/merge-contact.component';
import { ReviewStudentsComponent } from 'app/components/review-students/review-students.component';
import { MergeStudentComponent } from 'app/components/merge-enquiry/merge-student.component';

import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-contacts',
    templateUrl: 'contacts.component.html',
    styleUrls: ['./contacts.component.scss'],
    providers: [ContactsService, PromiseQueueService],
})
export class ContactsComponent extends InfiniteScrollTable<MinifiedContact> implements OnInit {
    tableId = 'contactsBfTable';
    contacts: MinifiedContact[] = [];
    userInfo: UserInfo = null;
    lastOne = 0;
    color = false;
    school: School;
    campuses: Campus[];
    currentCampusTimeZone: string;
    mergeLinkMsgs: object = this.contactsService.getMergeLinkMsgs();
    filterValues = [];
    date = Constants.localeFormats.date;
    useLocalStorage = true;
    merge_state$: Observable<string>;
    canMergeAndLink: boolean;

    constructor(
        storageService: StorageService,
        public contactsService: ContactsService,
        private router: Router,
        private httpService: HttpService,
        private listenerService: ListenerService,
        private modalService: NgbModal,
        private mergeQuery: MergeQuery,
        private mergeService: MergeService,
        private promiseQueueService: PromiseQueueService,
        private platformLocation: PlatformLocation,
    ) {
        super(storageService);
        this.displayedColumns = ['select', 'updatedAt', 'name', 'address', 'location', 'email', 'mobile', 'actions'];

        this.listenerService.campusListStatus().pipe(takeUntil(this.unsubscribe)).subscribe(() => this.onCampusChange());

        this.sortDebounce.pipe(debounceTime(this.debounceTime), takeUntil(this.unsubscribe)).subscribe(sortState => {
            super.onSortChange(sortState);
            this.onFilterChange(this.filterValues);
        });

        this.filterDebounce.pipe(debounceTime(this.debounceTime), takeUntil(this.unsubscribe)).subscribe(filterValues => {
            this.filterValues = filterValues;
            this.getTableRows = this.loadContacts();
        });

        this.searchDebounce.pipe(debounceTime(this.debounceTime), takeUntil(this.unsubscribe)).subscribe(searchText => {
            super.applySearch(searchText);
            this.getTableRows = this.loadContacts();
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
        this.getTableState();
        const result: { school: School, campuses: Campus[] } = { school: null, campuses: [] };
        return Promise.all([
            this.httpService.getAuth('schools/limitedData/' + this.userInfo.schoolId)
                .then((school: School) => result.school = school),
            this.httpService.getAuth('campus?fields=id,name,campusType,timeZoneId')
                .then((campuses: Campus[]) => result.campuses = campuses),
        ]).then(() => {
            this.school = result.school;
            this.campuses = result.campuses;
            this.currentCampusTimeZone = Utils.getCurrentCampusTimeZoneId(this.campuses, this.userInfo.campusId);
        });
    }

    private loadContacts(): Promise<number> {
        this.selection.clear();
        this.updateTable([]);
        const contactParams = this.contactsService.getCustomHttpParams(this.filterValues, this.tableState);
        return this.contactsService.getContacts(contactParams).then((contacts: MinifiedContact[]) => {
            this.contacts = contacts || [];
            this.buildTable(this.contacts);
            this.getMoreContactsIfNeeded();
            return this.contacts.length;
        });
    }

    public getTotalCount() {
        return this.contactsService.total;
    }

    public onScrollDown() {
        if (this.contacts.length < this.contactsService.total) {
            this.promiseQueueService.enqueuePromise(this.getMoreContacts.bind(this));
        }
    }

    private getMoreContacts() {
        return this.getTableRows.then(() => {
            const skipIds = _.map(this.contacts, c => c.id);
            const studentParams = this.contactsService.getCustomHttpParams(this.filterValues, this.tableState, skipIds);
            return this.getTableRows = this.contactsService.getContacts(studentParams).then((contacts: MinifiedContact[]) => {
                if (contacts && contacts.length) {
                    this.contacts.push(...contacts);
                    this.updateTable(this.contacts);
                    if (this.selectAllHasBeenToggled) {
                        this.dataSource.filteredData.forEach(row => {
                            if (_.includes(_.map(contacts, 'id'), row.id)) {
                                this.selection.select(row);
                            }
                        })
                    }
                    this.getMoreContactsIfNeeded();
                    return this.contacts.length;
                }
            });
        });
    }

    private getMoreContactsIfNeeded() {
        if (this.contacts.length < this.contactsService.total && this.contacts.length < Constants.minInfiniteTableLength) {
            this.onScrollDown();
        }
    }

    onSortChange(sortState: Sort) {
        if (this.isTableBuilt) {
            this.sortDebounce.next(sortState);
        }
    }

    onFilterChange(filterValues: FilterValue[]) {
        this.filterDebounce.next(filterValues);
    }

    onSearchChange(searchText: string) {
        this.searchDebounce.next(searchText);
    }

    private onCampusChange() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.currentCampusTimeZone = Utils.getCurrentCampusTimeZoneId(this.campuses, this.userInfo.campusId);
        this.onFilterChange([]);
    }

    addContact() {
        this.router.navigate([`/${environment.localization.enquiriesUrl}/add-contact`]);
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

    removeSelected() {
        const ids = this.getVisibleSelectedIds();
        return Utils.multipleDeletedQuestion(this.selectedCount).then((result) => {
            if (result && result.value) {
                const contactParams: CustomHttpParams = new CustomHttpParams()
                    .generateFilters(this.filterValues)
                    .set('search', this.tableState.searchText)
                    .generateIdsToExclude(this.excludedIds)
                    .generateIdsToInclude(this.includedIds);
                return this.contactsService.bulkDelete(contactParams)
                    .then((notDeletedIds: number[]) => {
                        const removedContactNumber = notDeletedIds ? this.selectedCount - notDeletedIds.length : this.selectedCount;
                        if (!_.isEmpty(notDeletedIds) && removedContactNumber > 0) {
                            Utils.showNotification(
                                'Some contacts can not be deleted, because they are the only primary contacts for one or more students.',
                                Colors.warning
                            );
                        } else if (!_.isEmpty(notDeletedIds) && removedContactNumber === 0) {
                            Utils.showNotification(
                                'None of the contacts could be deleted, because they are the only primary contacts for one or more students.',
                                Colors.warning
                            );
                        }
                        if (_.isEmpty(notDeletedIds)) {
                            Utils.multipleDeletedSuccess();
                            this.selection.clear();
                        }
                        this.contactsService.total -= removedContactNumber;
                        this.deselectItems(ids);
                        this.removeContactsFromLocalArrays(_.difference(ids, notDeletedIds));
                    }).catch(err => console.log(err));
            }
        });
    }


    private updateMessages() {
        const ids = this.getVisibleSelectedIds();
        this.mergeLinkMsgs = this.contactsService.getMergeLinkMsgs(ids.length, false);
    }

    protected selectionChanged() {
        this.canMergeAndLink = this.selection.selected.length > 1 && this.selection.selected.length < 6;
        super.selectionChanged();
        this.updateMessages();
    }

    private removeContactsFromLocalArrays(contactIds: number[]) {
        _.remove(this.contacts, c => _.includes(contactIds, c.id));
        _.remove(this.dataSource.data, c => _.includes(contactIds, c.id));
        this.dataSource.data = _.clone(this.dataSource.data);
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
                    break;
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
                    break;
                case ModalAction.Done:
                case ModalAction.Cancel:
                    this.mergeService.setMergeState('');
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
                    this.getTableRows = this.loadContacts();
                    Utils.showSuccessNotification('Merges successfully saved');
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
                return this.contactsService.linkingContacts(ids).then(() => {
                    this.getTableRows = this.loadContacts();
                });
            }
        });
    }

    lookForDuplicates() {
        this.router.navigate([`/${environment.localization.enquiriesUrl}/duplicate-contacts`]);
    }

}
