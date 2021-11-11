import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { BaseForm } from 'app/base-form';
import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { ManagementSystemCode } from 'app/common/enums';
import { Keys } from 'app/common/keys';

import { HttpService } from '../../services/http.service';
import { UserInfo } from '../../entities/userInfo';

import { CurrentSchool } from '../../entities/current-school';
import { ListItem } from '../../entities/list-item';
import { School } from '../../entities/school';

@Component({
    selector: 'app-add-current-school',
    templateUrl: './add-current-school.component.html'
})
export class AddCurrentSchoolComponent extends BaseForm implements OnInit, OnDestroy {
    loaded = false;
    title = 'Add Current School';
    userInfo: UserInfo = null;
    currentSchool: CurrentSchool;
    school: School;
    classifications: Array<ListItem> = [];
    statuses: Array<ListItem> = [];
    noItemSelected = Constants.noItemSelected;
    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    requiredSchoolNameMaxLength = Constants.requiredSchoolNameMaxLength;
    synCodeMaxLength = Constants.synCodeMaxLength;
    length60 = Constants.length60;
    currentSchoolId: number;
    codeName: string;

    constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private httpService: HttpService) {
        super();
    }

    public ngOnInit() {
        this.currentSchoolId = (this.route.params['value'].id) ? this.route.params['value'].id : 0;
        this.userInfo = Utils.getUserInfoFromToken();
        this.codeName = Utils.getNameCode(this.userInfo);

        this.httpService.getAuth('current-school/get-current-school/' + this.currentSchoolId).then((result: Object) => {
            this.school = result[Keys.school];
            const currentSchool = result[Keys.currentSchool];
            if (this.currentSchoolId === 0) { // new currentSchool
                this.title = 'Add Current School';
                this.currentSchool = new CurrentSchool();
                this.currentSchool.schoolId = Utils.getUserInfoFromToken().schoolId;
            } else {
                this.title = 'Edit Current School';
                this.currentSchool = currentSchool;
            }
            this.classifications = result['classificationList'];
            this.statuses = result['statusList'];
            this.createForm();
        });
    }

    createForm() {
        this.formGroup = this.fb.group({
            id: [this.currentSchool.id],
            schoolName: [this.currentSchool.schoolName, Validators.compose([
                Validators.required,
                Validators.minLength(this.requiredTextFieldMinLength), Validators.maxLength(this.requiredSchoolNameMaxLength)
            ])],
            classificationId: [this.currentSchool.classificationId],
            statusId: [this.currentSchool.statusId],
            includeInList: [(this.currentSchool.includeInList) ? this.currentSchool.includeInList : false],
            synCode: [this.currentSchool.synCode, Validators.compose([Validators.maxLength(this.synCodeMaxLength)])]
        });
        this.loaded = true;
        this.listenToFormChanges();
    }

    protected doSubmit(): Promise<void> {
        const url = 'current-school/' + ((this.formGroup.value.id) ? 'update' : 'add') + '-current-school';
        return this.httpService.postAuth(url, this.formGroup.value).then(() => {
            Utils.showSuccessNotification();
            return Promise.resolve();
        });
    }

    onSubmit() {
        this.submit().then(() => {
            this.lastAction();
        }).catch(err => {
            console.log(err);
        });
    }

    onCancel() {
        super.onCancel();
        this.lastAction();
    }

    private lastAction() {
        this.router.navigate(['/admin/current-schools']);
    }

}
