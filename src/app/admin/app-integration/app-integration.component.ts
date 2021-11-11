import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { BaseForm } from 'app/base-form';
import { Constants } from 'app/common/constants';
import { Utils, Colors } from 'app/common/utils';
import { Keys } from 'app/common/keys';

import { HttpService } from 'app/services/http.service';

import { UserInfo } from 'app/entities/userInfo';
import { School } from 'app/entities/school';

import * as _ from 'lodash';

@Component({
    selector: 'app-integration-cmp',
    templateUrl: 'app-integration.component.html'
})
export class AppIntegrationComponent extends BaseForm implements OnInit, OnDestroy {
    userInfo: UserInfo = null;
    school: School;
    loaded = false;
    noItemSelected = Constants.noItemSelected;

    constructor(private fb: FormBuilder, private httpService: HttpService) {
        super();
    }

    public ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.httpService.getAuth('schools/get-school/' + this.userInfo.schoolId).then((data: Object) => {
            this.school = data[Keys.school];
            this.createForm(this.school);
            this.loaded = true;
        }).catch(err => console.log(err));
    }

    private createForm(school: School) {
        this.formGroup = this.fb.group({
            googleTrackingId: [school.googleTrackingId, Validators.compose([Validators.minLength(5), Validators.maxLength(20)])],
            googleTrackingIsEnabled: [school.googleTrackingIsEnabled],
        });
        this.listenToFormChanges();
    }

    onSubmit() {
        this.submit().catch((error) => {
            console.log(error);
        });
    }

    doSubmit(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.httpService.postAuth('schools/set-acc-info', this.formGroup.value).then(() => {
                const emptyValue: boolean = _.isEmpty(this.formGroup.controls.googleTrackingId.value);
                const isEnabled: boolean = this.formGroup.controls.googleTrackingIsEnabled.value === true;
                const emptyFieldAndEnabled = (emptyValue && isEnabled);
                if (emptyValue) {
                    this.school.googleTrackingIsEnabled = false;
                    this.formGroup.controls.googleTrackingIsEnabled.setValue(false);
                }
                this.formGroup.markAsPristine();
                if (emptyFieldAndEnabled) {
                    Utils.showNotification('A Valid Google Tracking ID is required in order to enable this option', Colors.warning);
                } else {
                    Utils.showSuccessNotification();
                }
                resolve(true);
            }).catch(err => {
                reject(err);
            });
        });
    }

}
