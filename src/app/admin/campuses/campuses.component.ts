import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { PlatformLocation } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { ModalAction } from 'app/common/enums';

import { HttpService } from 'app/services/http.service';
import { ListenerService } from 'app/services/listener.service';
import { StorageService } from 'app/services/storage.service';

import { UserInfo } from 'app/entities/userInfo';
import { School } from 'app/entities/school';
import { Campus } from 'app/entities/campus';
import { Student } from 'app/entities/student';
import { Country } from 'app/entities/country';
import { ListItem } from 'app/entities/list-item';

import { BaseTable } from 'app/base-table';

import { EditCampusComponent } from '../edit-campus/edit-campus.component';

import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { environment } from 'environments/environment';

declare var $: any;

@Component({
    selector: 'app-campuses-cmp',
    templateUrl: 'campuses.component.html',
    styleUrls: ['./campuses.component.scss']
})
export class CampusesComponent extends BaseTable<Campus> implements OnInit, OnDestroy {
    @Input() school: School;
    campuses: Campus[] = [];
    genders: ListItem[] = [];
    countries: Country[] = [];
    studentsForCampusToBeDeleted: Student[] = [];
    campusesExceptOneToBeDeleted: Campus[] = [];
    destinationCampusId: number;
    toBeDeletedCampusId: number = null;
    campusUndecided: Campus;
    userInfo: UserInfo;

    tableId = 'campusesTable';
    synCodeTitle = '';

    constructor(
        private httpService: HttpService,
        private listenerService: ListenerService,
        storageService: StorageService,
        private modalService: NgbModal,
        private platformLocation: PlatformLocation,
    ) {
        super(storageService);
        this.displayedColumns = ['sequence', 'name', 'synCode', 'address', 'location', 'actions'];
    }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.synCodeTitle = Utils.getNameCode(this.userInfo);
        this.tableIsLoading = this.httpService.getAuth('campus/with-extra-data').then((data: any) => {
            this.genders = data.genders;
            this.countries = data.countries;
            data.campuses = _.sortBy(data.campuses, ['sequence']);
            _.forEach(data.campuses, (campus: Campus) => {
                if (campus.campusType !== Campus.CAMPUS_TYPE_UNDECIDED) {
                    this.campuses.push(campus);
                } else {
                    this.campusUndecided = campus;
                }
            });
            this.buildTable(this.campuses);
        });
    }

    protected buildTable(campuses: Campus[]) {
        super.buildTable(campuses, true);
        this.updateTable(campuses);
    }

    sequenceChanged(event: CdkDragDrop<Campus[]>) {
        if (event.previousIndex !== event.currentIndex) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
            this.campuses = _.cloneDeep(event.container.data);
            this.campuses.forEach((c, index) => {
                c.sequence = index;
            });
            this.buildTable(this.campuses);
            return this.httpService.postAuth('campus/update-sequences', this.campuses).then(() => {
                this.listenerService.campusListChanged();
                Utils.showSuccessNotification();
            });
        }
    }

    addCampus() {
        if (this.userInfo.isSysAdmin()) {
            this.openEditCampus(null);
        } else {
            Swal.fire({
                html: `Please contact ${environment.brand.name} to add more campuses to your school account.\
                    <br><br>\
                    <button class="btn btn-cancel cancel">Cancel</button>\
                    <button class="btn btn-primary contact-us">Contact Us</button>`,
                type: 'warning',
                showConfirmButton: false,
                onOpen(swalSchoolUsers: HTMLElement) {
                    $(swalSchoolUsers).find('.contact-us').off().click((e) => {
                        window.open(`mailto:${environment.brand.contactEmail}?subject=I would like to add an additional campus`, '_blank');
                        Swal.close();
                    });
                    $(swalSchoolUsers).find('.cancel').off().click((e) => {
                        Swal.close();
                    });
                }
            });
        }
    }

    editCampus(id: number) {
        this.openEditCampus(id);
    }

    private openEditCampus(id: number | null) {
        const editCampusRef = this.modalService.open(EditCampusComponent, Constants.ngbModalLg);
        editCampusRef.componentInstance.campusId = id;
        editCampusRef.componentInstance.school = this.school;
        editCampusRef.componentInstance.countries = this.countries;
        editCampusRef.componentInstance.genders = this.genders;
        editCampusRef.componentInstance.synCodeTitle = this.synCodeTitle;
        editCampusRef.result.then((res: { action: ModalAction, campus?: Campus }) => {
            switch (res.action) {
                case ModalAction.Update:
                    this.updateCampuses(res.campus);
                    this.listenerService.campusListChanged();
                    break;
                default: break;
            }
        });
        this.platformLocation.onPopState(() => {
            editCampusRef.close({ action: ModalAction.LeavePage });
        });
    }

    updateCampuses(campus: Campus) {
        const index = this.campuses.findIndex((e) => e.id === campus.id);
        if (index === -1) {
            this.campuses.push(campus);
        } else {
            this.campuses[index] = campus;
        }

        this.buildTable(this.campuses);
    }

    onDeleteCampus(campusId: number) {
        this.toBeDeletedCampusId = campusId;
        return this.httpService.getAuth('campus/count-students-for-campus/' + campusId).then((count: number) => {
            const note = (this.campuses.length === 2) ? '<br>Note: Any undecided students will also be moved to the selected campus' : '';
            if (count) {
                const self = this;
                Swal.fire({
                    title: 'Choose an action?',
                    html: `This campus includes ` + count + ` student(s). If you delete it,
                    all these students will be deleted. <br>Select Campus to assign the students to a different campus
                    or delete all students that belong to this campus (this cannot be undone).
                    ` + note + `
                    <br><br><br>
                    <button class="btn btn-cancel cancel">Cancel</button>
                    <button class="btn btn-delete delete">Delete students</button>
                    <button class="btn btn-success select-campus">Select Campus</button>`,
                    type: 'warning',
                    showConfirmButton: false,
                    onOpen(swal1: HTMLElement) {
                        $(swal1).find('.delete').off().click((e) => {
                            Swal.close();
                            return self.deleteConfirmation(campusId);
                        });
                        $(swal1).find('.select-campus').off().click((e) => {
                            Swal.close();
                            return self.selectDestinationCampus(campusId);
                        });
                        $(swal1).find('.cancel').off().click((e) => {
                            Swal.close();
                            return false;
                        });
                    }
                });
            } else { // if campus doesn't have students
                this.deleteConfirmation(campusId);
            }
        });
    }

    selectDestinationCampus(currentCampusId: number) {
        this.campusesExceptOneToBeDeleted = [];
        _.forEach(this.campuses, (campus: Campus) => {
            if (campus.id !== currentCampusId) {
                this.campusesExceptOneToBeDeleted.push(campus);
            }
        });
        if (this.campusesExceptOneToBeDeleted.length > 1) {
            this.campusesExceptOneToBeDeleted.push(this.campusUndecided);
        }
        this.destinationCampusId = _.find(this.campusesExceptOneToBeDeleted, (c: Campus) => c.campusType === 'main')['id'];
        $('#destinationCampusModal').modal('show');
    }

    onCancelDestinationCampusModal() {
        $('#destinationCampusModal').modal('hide');
    }

    assignStudentsToCampus() {
        if (this.destinationCampusId) {
            this.httpService.postAuth(
                'campus/change-campus-for-students/',
                { sourceCampusId: this.toBeDeletedCampusId, destinationCampusId: this.destinationCampusId }
            ).then(() => {
                this.deleteCampus(this.toBeDeletedCampusId);
            });
        }
        $('#destinationCampusModal').modal('hide');
    }

    deleteConfirmation(campusId: number) {
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
                this.deleteCampus(campusId);
            }
        });
    }

    deleteCampus(campusId: number) {
        this.userInfo = Utils.getUserInfoFromToken();
        this.httpService.postAuth('campus/delete/', { campusId }).then(() => {
            _.remove(this.campuses, (item: Campus) => campusId === item.id);
            this.listenerService.campusListChanged();
            this.buildTable(this.campuses);
            Utils.showSuccessNotification();
            if (this.destinationCampusId) {
                const campus = _.find(this.campuses, (c: Campus) => c.id === this.destinationCampusId);
                const campusName = campus ? campus.name : 'Undecided';
                this.destinationCampusId = null;
                return Swal.fire({
                    title: 'Success!',
                    text: 'Your data has been successfully moved to ' + campusName,
                    type: 'success',
                    confirmButtonClass: 'btn btn-success',
                    buttonsStyling: false
                });
            } else {
                Utils.deletedSuccessfully();
            }
        });
    }

    ngOnDestroy() {
        Utils.disposeModal('#destinationCampusModal');
    }

}
