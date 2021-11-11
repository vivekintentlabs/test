import { Component, ViewChild, Input, OnChanges, SimpleChanges, ChangeDetectorRef, ElementRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PlatformLocation } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { HttpService } from '../../services/http.service';
import { ErrorMessageService } from '../../services/error-message.service';

import { Constants } from '../../common/constants';
import { Utils, Colors } from '../../common/utils';
import { ModalAction } from '../../common/enums';
import { ResponseMessage } from 'app/common/interfaces';

import { List } from '../../entities/list';
import { ListItem } from '../../entities/list-item';

import { MergeListItemComponent } from '../merge-item/merge-list-item.component';

import * as _ from 'lodash';
import Swal from 'sweetalert2';

declare var $: any;

@Component({
    selector: 'app-table-cmp',
    templateUrl: 'table.component.html',
    styleUrls: ['./table.component.scss']
})

export class TableComponent implements OnChanges, OnDestroy {
    @Input() schoolId: number;
    @Input() managementSystemId: number;
    @Input() selectedCat: List = null;
    items: ListItem[] = null;
    currentItem: ListItem = null;

    reservedBySystem = Constants.reservedBySystem;
    selectedIds: number[] = [];

    listForm: FormGroup = null;
    description = '';
    title = 'Edit';
    collectDescription = false;

    @ViewChild('fileInput') myFileInput: ElementRef;
    allowedFormats: string[] = ['.csv'];

    synCodeMaxLength = Constants.synCodeMaxLength;
    requiredListItemNameMaxLength = Constants.requiredListItemNameMaxLength;
    synCodeTitle: string;

    promiseForBtn: Promise<any>;

    constructor(
        private httpService: HttpService,
        private fb: FormBuilder,
        private ref: ChangeDetectorRef,
        private modalService: NgbModal,
        private platformLocation: PlatformLocation,
        private errorMessageService: ErrorMessageService,
    ) { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes) {
            this.synCodeTitle = Utils.getNameCode(this.managementSystemId);
            this.schoolId = (changes['schoolId']) ? changes['schoolId'].currentValue : this.schoolId;
            this.selectedCat = (changes['selectedCat']) ? changes['selectedCat'].currentValue : this.selectedCat;
        }
        this.getData();
    }

    private getData(): Promise<any> {
        this.items = null;
        this.selectedIds = [];
        return this.httpService.postAuth('list-items/getby-categories', [this.selectedCat.id]).then((items: ListItem[]) => {
            this.items = items;
            this.lastAction();
            Utils.DetectChanges(this.ref);
            return Promise.resolve();
        }).catch(err => console.log(err));
    }

    changeSequence(id: number, sequence: number, up: boolean) {
        let prewOrNext = null;

        if (up) {
            prewOrNext = _.maxBy(_.filter(this.items, s => s.sequence < sequence), 'sequence');
        } else {
            prewOrNext = _.minBy(_.filter(this.items, s => s.sequence > sequence), 'sequence');
        }

        if (prewOrNext) {
            const current = _.find(this.items, s => s.id === id);
            current.sequence = prewOrNext.sequence;
            prewOrNext.sequence = sequence;
            this.doChangeSequence([current, prewOrNext]).then(() => {
                this.lastAction();
            });
        }
    }

    public changedIncludeInList(checked: boolean, listItem: ListItem) {
        listItem.includeInList = checked;
        this.httpService.postAuth('list-items/update', listItem).then(() => {
            Utils.showSuccessNotification();
        }).catch(err => {
            console.log(err);
        });
    }

    private doChangeSequence(listItems: ListItem[]): Promise<any> {
        return this.httpService.postAuth('list-items/change-sequence', { listItems }).then(() => {
            return Promise.resolve();
        }).catch(err => {
            console.log(err);
            return Promise.reject(err);
        });
    }

    private lastAction() {
        this.items = _.orderBy(this.items, ['sequence'], 'asc');
    }

    addItem() {
        this.title = 'Add';
        this.currentItem = new ListItem();
        this.createListForm(this.currentItem);
        $('#listEditModal').modal('show');
    }

    edit(item) {
        this.title = 'Edit';
        this.currentItem = item;
        this.createListForm(this.currentItem);
        $('#listEditModal').modal('show');
    }

    private createListForm(item: ListItem) {
        this.description = item.description;
        this.listForm = this.fb.group({
            id: [item.id],
            name: [item.name, Validators.compose([Validators.required, Validators.maxLength(this.requiredListItemNameMaxLength)])],
            synCode: [item.synCode, Validators.compose([Validators.maxLength(this.synCodeMaxLength)])],
            includeInList: [(item.includeInList) ? item.includeInList : false]
        });
    }

    onSubmit() {
        if (this.listForm.value) {
            this.submit();
        }
    }

    private submit() {
        const data: ListItem = this.listForm.value;
        const url = data.id ? 'list-items/update' : 'list-items/add';
        data.listId = this.selectedCat.id;

        return this.promiseForBtn = this.httpService.postAuth(url, data).then(() => {
            return this.getData().then(() => {
                $('#listEditModal').modal('hide');
                Utils.showSuccessNotification();
                return Promise.resolve();
            });
        }).catch(err => {
            console.log(err);
            return Promise.reject();
        });
    }

    select(id: number, isChecked: boolean) {
        if (isChecked) {
            this.selectedIds.push(id);
        } else {
            _.pull(this.selectedIds, id);
        }
    }

    selectAll(isChecked: boolean) {
        _.forEach(this.items, (x) => { if (x.isDeletable) { x.check = isChecked; } });
        if (isChecked) {
            _.remove(this.selectedIds);
            _(this.items).forEach((item) => {
                if (item.isDeletable) {
                    this.selectedIds.push(item.id);
                }
            });
        } else {
            _.remove(this.selectedIds);
        }
    }

    isAllSelected() {
        return _.every(this.items, 'check');
    }

    remove(item) {
        Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this.',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn btn-delete',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Yes, delete it!',
            buttonsStyling: false
        }).then((result) => {
            if (result && result.value) {
                this.httpService.getAuth('list-items/delete/' + item.id).then((res) => {
                    this.getData().then(() => {
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Your items has been deleted.',
                            type: 'success',
                            confirmButtonClass: 'btn btn-success',
                            buttonsStyling: false
                        });
                    });
                }).catch(err => console.log(err));
            }
        });
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
                this.httpService.postAuth('list-items/delete-items', this.selectedIds).then((deletedCount: number) => {
                    if (!deletedCount) {
                        Utils.showNotification(
                            'None of the items could be deleted because they are used in ET system.',
                            Colors.warning
                        );
                    } else if (deletedCount === this.selectedIds.length) {
                        Utils.showNotification(
                            'Your item(s) has been deleted',
                            Colors.success
                        );
                    } else if (deletedCount < this.selectedIds.length) {
                        Utils.showNotification(
                            'Some items could not be deleted because they are used in ET system.',
                            Colors.warning
                        );
                    }
                    this.getData();
                }).catch(err => console.log(err));
            }
        });
    }

    import() {
        const fileList: FileList = this.myFileInput.nativeElement.files;
        if (fileList.length > 0) {
            const file: File = fileList[0];
            const formData: FormData = new FormData();
            formData.append('selectedListId', this.selectedCat.id.toString());
            formData.append('file', file, file.name);
            this.httpService.postAuthForm('list-items/import', formData, false).then((res) => {
                this.getData().then(() => {
                    Utils.showSuccessNotification('Successfully imported the list items from the file');
                });
            }).catch(async (err: ResponseMessage) => {
                const errMsg: string = await this.errorMessageService.getMessage(err.errorCode, err.errorMessage, err?.params);
                Swal.fire('Error in csv file', errMsg, 'error');
            });
        }
        this.myFileInput.nativeElement.value = '';
    }

    merge() {
        const modalMergeListItemRef = this.modalService.open(MergeListItemComponent, Constants.ngbModalLg);
        modalMergeListItemRef.componentInstance.listId = this.selectedCat.id;
        modalMergeListItemRef.componentInstance.items = _.filter(this.items, i => this.selectedIds.includes(i.id));
        modalMergeListItemRef.result.then((result: { action: ModalAction }) => {
            switch (result.action) {
                case ModalAction.Done:
                    this.getData().then(() => {
                        Utils.showSuccessNotification('Merges successfully saved');
                    });
                    break;
                case ModalAction.Cancel:
                    break;
                default:
                    break;
            }
        }).catch((err) => modalMergeListItemRef.dismiss(err));
        this.platformLocation.onPopState(() => {
            modalMergeListItemRef.close({ action: ModalAction.LeavePage });
        });
    }

    public ngOnDestroy() {
        Utils.disposeModal('#listEditModal');
    }
}
