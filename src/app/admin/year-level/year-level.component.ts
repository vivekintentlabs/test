import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { HttpService } from 'app/services/http.service';

import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { ManagementSystemCode } from 'app/common/enums';

import { UserInfo } from 'app/entities/userInfo';
import { Campus } from 'app/entities/campus';
import { YearLevel, IYearLevel } from 'app/entities/year-level';
import { YearLevelList } from 'app/entities/year-level-list';
import { CampusYearLevel } from 'app/entities/campus-year-level';

import * as _ from 'lodash';
import Swal from 'sweetalert2';

declare var $: any;

@Component({
    selector: 'app-year-level',
    templateUrl: 'year-level.component.html',
    styleUrls: ['./year-level.component.scss']
})

export class YearLevelComponent implements OnInit, OnDestroy {
    yearLevels: YearLevelList;
    currentItem: YearLevel = null;
    deleteIds: number[] = [];
    yearLevelForm: FormGroup = null;
    isNew = false;
    collectDescription = false;
    userInfo: UserInfo = null;
    campuses: Campus[] = [];
    specificCampusId: number = null;
    specificCampus: Campus = null;
    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    synCodeMaxLength = Constants.synCodeMaxLength;
    nameMaxLength = Constants.nameMaxLength;
    synCodeTitle: string;

    promiseForBtn: Promise<any>;

    constructor(private httpService: HttpService, private fb: FormBuilder, private ref: ChangeDetectorRef, private router: Router) { }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.synCodeTitle = Utils.getNameCode(this.userInfo);
        this.getYearLevels().then(() => {
            const userCampus = _.find(this.campuses, c => c.id === this.userInfo.specificCampusId);
            this.specificCampusId = (userCampus) ? userCampus.id : this.userInfo.mainCampusId;
            this.specificCampus = this.campuses.find(c => c.id === this.specificCampusId);
        });
    }

    getYearLevels() {
        return this.httpService.getAuth('year-level').then((result: any) => {
            this.yearLevels = new YearLevelList(result.yearLevels);
            this.campuses = _.filter(result.campuses, c => c.campusType !== Campus.CAMPUS_TYPE_UNDECIDED);
            this.campuses = _.orderBy(this.campuses, ['sequence']);
        });
    }

    campusChanged(specificCampusId: number) {
        this.userInfo = Utils.getUserInfoFromToken();
        if (this.userInfo.specificCampusId !== specificCampusId) {
            this.httpService.postAuth('users/set-specific-campus', { specificCampusId: specificCampusId }).then(() => {
                this.specificCampusId = specificCampusId;
                this.specificCampus = this.campuses.find(c => c.id === this.specificCampusId);
            }).catch((err) => {
                console.log(err);
            });
        } else {
            console.log('specificCampusId is already chosen');
        }
    }

    changeSequence(id: number, sequence: number, up: boolean) {
        this.httpService.postAuth('year-level/change-sequence', { id: id, sequence: sequence, up: up }).then((yearLevels: YearLevel[]) => {
            this.yearLevels.updateYearLevelSequences(yearLevels);
            Utils.showSuccessNotification();
        }).catch(err => {
            console.log(err);
        });
    }

    addItem() {
        this.isNew = true;
        this.currentItem = new YearLevel();
        this.createYearLevelForm(this.currentItem);
        $('#yearLevelModal').modal('show');
    }

    edit(item) {
        this.isNew = false;
        this.currentItem = item;
        this.createYearLevelForm(this.currentItem);
        $('#yearLevelModal').modal('show');
    }

    updateCampusYearLevel(value: boolean, item: CampusYearLevel, fieldName: string) {
        item[fieldName] = value;
        this.httpService.postAuth('year-level/update-campus-year-level', item).then((res) => {
            Utils.showSuccessNotification();
        }).catch(err => {
            item[fieldName] = !value
            console.log(err);
        });
    }

    private createYearLevelForm(yearLevel: YearLevel) {
        this.yearLevelForm = this.fb.group({
            id: [yearLevel.id],
            name: [yearLevel.name, Validators.compose([
                Validators.required, Validators.minLength(this.requiredTextFieldMinLength), Validators.maxLength(this.nameMaxLength)
            ])],
            synCode: [yearLevel.synCode, Validators.compose([Validators.maxLength(this.synCodeMaxLength)])]
        });
    }

    onSubmit() {
        this.promiseForBtn = this.submit().then(() => {
            $('#yearLevelModal').modal('hide');
        }).catch(err => {
            console.log(err);
            return Promise.resolve();
        });
    }

    private submit() {
        const url = this.isNew ? 'year-level/add' : 'year-level/update';
        return this.httpService.postAuth(url, this.yearLevelForm.value).then((resultYearLevel: YearLevel) => {
            const currentYearLevel = this.yearLevels.find(yearLevel => yearLevel.id === resultYearLevel.id);

            if (currentYearLevel) {
                currentYearLevel.name = resultYearLevel.name;
                currentYearLevel.synCode = resultYearLevel.synCode;
            } else {
                this.yearLevels.push(resultYearLevel);
            }

            Utils.showSuccessNotification();
            return Promise.resolve();
        })
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
                return this.httpService.getAuth('year-level/delete/' + item.id).then((res) => {
                    _.remove(this.yearLevels, y => y.id === item.id);
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'Your item has been deleted.',
                        type: 'success',
                        confirmButtonClass: 'btn btn-success',
                        buttonsStyling: false
                    });
                }).catch(err => console.log(err));
            }
        });
    }

    ngOnDestroy() {
        Utils.disposeModal('#yearLevelModal');
    }

}
