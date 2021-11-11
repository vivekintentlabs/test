import { Component, AfterViewInit, ChangeDetectorRef, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { BaseTable } from 'app/base-table';

import { HttpService } from 'app/services/http.service';
import { StorageService } from 'app/services/storage.service';
import { ErrorMessageService } from 'app/services/error-message.service';

import { Utils, Colors } from 'app/common/utils';
import { ModalAction } from 'app/common/enums';
import { ResponseMessage } from 'app/common/interfaces';
import { T } from 'app/common/t';
import { Constants } from 'app/common/constants';

import { UserInfo } from 'app/entities/userInfo';
import { School } from 'app/entities/school';
import { CurrentSchool } from 'app/entities/current-school';

import { MergeCurrentSchoolComponent } from 'app/components/merge-item/merge-current-school.component';

import * as _ from 'lodash';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-current-schools',
    templateUrl: 'current-schools.component.html',
    styleUrls: ['./current-schools.component.scss']
})

export class CurrentSchoolsComponent extends BaseTable<CurrentSchool> implements AfterViewInit, OnDestroy {
    tableId = 'CurrentSchoolComponent';

    userInfo: UserInfo = null;
    school: School;
    currentSchools: CurrentSchool[] = [];

    allowedFormats: string[] = ['.csv'];
    mergeMsg = 'Click the checkbox to enable Merge';
    private includeInListColumn = 'includeInList';
    synCodeTitle: string;
    displayOtherLabel = Constants.displayOtherLabel;

    unsubscribe = new Subject();

    @ViewChild('fileInput') myFileInput: ElementRef;

    constructor(
        private router: Router,
        private httpService: HttpService,
        private ref: ChangeDetectorRef,
        storageService: StorageService,
        private modalService: NgbModal,
        private platformLocation: PlatformLocation,
        private errorMessageService: ErrorMessageService,
    ) {
        super(storageService);
        this.displayedColumns = ['select', 'schoolName', 'classificationName', 'statusName', 'synCode', 'actions'];
        this.selection.changed.pipe(takeUntil(this.unsubscribe)).subscribe(() => this.selectionChanged());
    }

    async ngAfterViewInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.synCodeTitle = Utils.getNameCode(this.userInfo);
        this.tableIsLoading = this.getData();
        this.ref.detectChanges();
    }

    private getData(): Promise<any> {
        return this.httpService.getAuth('current-school').then((data: any) => {
            this.school = data.school;
            this.currentSchools = data.currentSchools;
            _.forEach(this.currentSchools, (currentSchool: CurrentSchool) => {
                currentSchool.statusName = currentSchool.statusId ? currentSchool.status.name : T.unknown;
                currentSchool.classificationName = currentSchool.classificationId ? currentSchool.classification.name : T.unknown;
            });
            this.addOrRemoveIncludeInList((this.school && this.school.currentSchoolDisplayOther))
            this.buildTable(this.currentSchools);
            this.updateTable(this.currentSchools);
            return Promise.resolve();
        });
    }

    protected selectionChanged() {
        super.selectionChanged();
    }

    private removeCurrentSchoolsFromLocalArrays(ids: Array<number>) {
        _.remove(this.currentSchools, c => _.includes(ids, c.id));
        _.remove(this.dataSource.data, c => _.includes(ids, c.id));
        this.dataSource.data = _.clone(this.dataSource.data);
    }

    merge() {
        const modalMergeCurrentSchoolRef = this.modalService.open(MergeCurrentSchoolComponent, Constants.ngbModalLg);
        modalMergeCurrentSchoolRef.componentInstance.items =
            _.filter(this.currentSchools, i => this.getVisibleSelectedIds().includes(i.id));
        modalMergeCurrentSchoolRef.result.then((result: { action: ModalAction }) => {
            switch (result.action) {
                case ModalAction.Done:
                    Utils.showSuccessNotification('Merges successfully saved');
                    this.tableIsLoading = this.getData();
                    this.ref.detectChanges();
                    this.selection.clear();
                    break;
                case ModalAction.Cancel:
                    break;
                default:
                    break;
            }
        }).catch((err) => modalMergeCurrentSchoolRef.dismiss(err));
        this.platformLocation.onPopState(() => {
            modalMergeCurrentSchoolRef.close({ action: ModalAction.LeavePage });
        });
    }

    addCurrentSchool() {
        this.router.navigate(['/admin/add-current-schools']);
    }

    editCurrentSchool(id: number) {
        this.router.navigate(['/admin/edit-current-schools', id]);
    }

    import() {
        const fileList: FileList = this.myFileInput.nativeElement.files;
        if (fileList.length > 0) {
            const file: File = fileList[0];
            const formData: FormData = new FormData();
            formData.append('file', file, file.name);
            this.httpService.postAuthForm('current-school/import', formData, false).then(() => {
                this.router.navigate(['dashboard/sendback']).then(() => {
                    this.router.navigate(['admin/current-schools']);
                });

                Utils.showNotification('Successfully imported the current schools from the file', Colors.success);
            }).catch(async (err: ResponseMessage) => {
                const errMsg: string = await this.errorMessageService.getMessage(err.errorCode, err.errorMessage, err?.params);
                Swal.fire('Error in csv file', errMsg, 'error');
            });
        }
        this.myFileInput.nativeElement.value = '';
    }

    removeSelected() {
        const ids = this.getVisibleSelectedIds();
        Utils.multipleDeletedQuestion(ids.length).then((result) => {
            if (result && result.value) {
                this.httpService.postAuth('current-school/delete-current-schools', ids).then((data: any) => {
                    if (!_.isEmpty(data.notDeletedIds)) {
                        Utils.showNotification(
                            'Some current schools can not be deleted because they are used in student data.',
                            Colors.warning
                        );
                        this.deselectItems(data.deletedIds);
                        this.removeCurrentSchoolsFromLocalArrays(data.deletedIds);
                    } else {
                        this.deselectItems(ids);
                        this.removeCurrentSchoolsFromLocalArrays(ids);
                        Utils.deletedSuccessfully();
                    }
                }).catch(err => console.log(err));
            } else {
                // handle dismiss, result.dismiss can be 'cancel', 'overlay', 'close', and 'timer'
                console.log(result.dismiss)
            }
        });
    }

    deleteCurrentScool(id: number): Promise<any> {
        return Utils.deletedQuestion().then((result) => {
            if (result && result.value) {
                return this.httpService.getAuth(`current-school/delete-current-school/${id}`).then(() => {
                    return Utils.deletedSuccessfully().then(() => {
                        this.deselectItems([id]);
                        this.removeCurrentSchoolsFromLocalArrays([id]);
                        return Promise.resolve(true);
                    });
                });
            } else {
                return Promise.resolve(false);
            }
        });
    }

    private addOrRemoveIncludeInList(displayOther: boolean) {
        if (displayOther) {
            if (!_.includes(this.displayedColumns, this.includeInListColumn)) {
                this.displayedColumns.splice(4, 0, this.includeInListColumn);
            }
        } else {
            const colIndex = this.displayedColumns.findIndex(col => col === this.includeInListColumn);
            if (colIndex > 0) {
                this.displayedColumns.splice(colIndex, 1);
            }
        }
    }

    toggleChanged(currentSchoolDisplayOther: boolean) {
        this.addOrRemoveIncludeInList(currentSchoolDisplayOther);
        this.school.currentSchoolDisplayOther = currentSchoolDisplayOther;
        this.httpService.putAuth(`schools/${this.school.id}/current-school-display-other`, { currentSchoolDisplayOther }).then(() => {
            Utils.DetectChanges(this.ref);
            Utils.showSuccessNotification();
        }).catch(err => {
            console.log(err);
        });
    }

    changedIncludeInList(checked: boolean, item: CurrentSchool) {
        item.includeInList = checked;
        this.httpService.postAuth('current-school/update-include-in-list', item).then((res) => {
            this.getData().then(() => {
                this.selection.clear();
                Utils.showSuccessNotification();
            });
        }).catch(err => console.log(err));
    }

    ngOnDestroy() {
        super.ngOnDestroy();

        this.unsubscribe.next();
        this.unsubscribe.complete();
    }
}
