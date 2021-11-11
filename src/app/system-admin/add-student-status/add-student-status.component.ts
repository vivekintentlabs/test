import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';

import { BaseForm } from 'app/base-form';
import { Utils } from '../../common/utils';
import { Constants } from '../../common/constants';
import { Keys } from 'app/common/keys';
import { ApplicationStatus } from 'app/common/enums';

import { TranslateService } from '@ngx-translate/core';
import { HttpService } from '../../services/http.service';

import { ListItem } from '../../entities/list-item';
import { UserInfo } from '../../entities/userInfo';
import { StudentStatus } from '../../entities/student-status';

@Component({
    selector: 'app-add-student-status',
    templateUrl: './add-student-status.component.html'
})
export class AddStudentStatusComponent extends BaseForm implements OnInit {
    loaded = false;
    title = 'Add Student Status';
    description$;
    userInfo: UserInfo = null;
    stages: ListItem[] = [];
    studentStatus: StudentStatus;
    noItemSelected = Constants.noItemSelected; // show constant string in html
    fieldRequired = Constants.fieldRequired; // show constant string in html
    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    nameMaxLength = Constants.nameMaxLength;
    length50 = Constants.length50;
    synCodeMaxLength = Constants.synCodeMaxLength;
    codeName: string;

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private httpService: HttpService,
        private translate: TranslateService,
    ) {
        super();
    }

    public ngOnInit() {
        const paramId = (this.route.params['value'].id) ? this.route.params['value'].id : null;
        this.userInfo = Utils.getUserInfoFromToken();
        this.codeName = Utils.getNameCode(this.userInfo);
        if (paramId) {
            this.title = 'Edit Student Status';
            this.httpService.getAuth('student-status/get-student-status/' + paramId).then((result) => {
                this.studentStatus = result[Keys.studentStatus];
                this.stages = result['stages'];
                this.description$ = this.translate.get('Finalized').pipe(map((val: string) =>
                    this.studentStatus.description ? this.studentStatus.description.replace(ApplicationStatus.Finalized, val) : ''));
                this.createForm();
            }).catch(err => console.log(err));
        } else {
            this.httpService.getAuth('student-status/get-student-stages/').then((res: ListItem[]) => {
                this.stages = res;
                this.studentStatus = new StudentStatus();
                this.createForm();
            }).catch(err => console.log(err));
        }
    }

    onSubmit() {
        this.submit().then(() => {
            this.lastAction();
        });
    }

    onCancel() {
        super.onCancel();
        this.lastAction();
    }

    private lastAction() {
        this.router.navigate(['/system-admin/student-status']);
    }

    createForm() {
        this.formGroup = this.fb.group({
            id: this.studentStatus.id,
            stageId: [this.studentStatus.stageId, Validators.compose([Validators.required])],
            status: [this.studentStatus.status, Validators.compose([
                Validators.required,
                Validators.minLength(Constants.requiredTextFieldMinLength), Validators.maxLength(this.nameMaxLength)
            ])],
            synCode: [this.studentStatus.synCode, Validators.compose([Validators.maxLength(this.synCodeMaxLength)])]
        });
        this.loaded = true;
        this.listenToFormChanges();
    }

    protected doSubmit(): Promise<void> {
        const url = 'student-status/' + (this.formGroup.value.id ? 'update' : 'add') + '-student-status';
        return this.httpService.postAuth(url, this.formGroup.value).then(() => {
            Utils.showSuccessNotification();
            return Promise.resolve();
        });
    }

}
