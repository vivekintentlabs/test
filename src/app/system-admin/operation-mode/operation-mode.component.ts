import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { BaseForm } from 'app/base-form';
import { Utils } from 'app/common/utils';
import { OperationMode } from 'app/common/enums';

import { HttpService } from 'app/services/http.service';

import { UserInfo } from 'app/entities/userInfo';
import { Setting } from 'app/entities/setting';

import * as _ from 'lodash';
import Swal from 'sweetalert2';


@Component({
    selector: 'app-operation-mode',
    templateUrl: 'operation-mode.component.html'
})
export class OperationModeComponent extends BaseForm implements AfterViewInit, OnDestroy {

    public userInfo: UserInfo = null;
    public operationModes;
    public loaded = false;

    constructor(private fb: FormBuilder, private router: Router, private httpService: HttpService) {
        super();
    }

    ngAfterViewInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.operationModes = [
            { value: OperationMode.Normal, name: OperationMode[OperationMode.Normal] },
            { value: OperationMode.Maintenance, name: OperationMode[OperationMode.Maintenance] },
            { value: OperationMode.Maintenance_with_cronJobs, name: OperationMode[OperationMode.Maintenance_with_cronJobs] },
        ];
        this.httpService.getAuth('setting/get-operation-mode').then((operationMode: Setting) => {
            this.createForm(operationMode.intValue);
            this.loaded = true;
        });
    }

    private createForm(operationMode: number | null) {
        this.formGroup = this.fb.group({
            operationMode: [operationMode, Validators.required]
        });
        this.listenToFormChanges();
    }

    onSubmit() {
        if (this.userInfo.isSysAdmin) {
            this.submitPrompt();
        } else {
            this.router.navigate(['/dashboard']);
        }
    }

    private submitPrompt() {
        Swal.fire({
            title: 'Are you sure?',
            text: 'You want to change it!',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn btn-success',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Yes',
            buttonsStyling: false
        }).then((result) => {
            if (result && result.value) {
                this.submit().then(() => {
                    Swal.fire({
                        title: 'Success!',
                        text: 'Changes saved successfuly',
                        type: 'success',
                        confirmButtonClass: 'btn btn-success',
                        buttonsStyling: false
                    });
                }).catch((err) => {
                    console.log(err);
                });
            }
        });
    }

    doSubmit() {
        return new Promise<void>((resolve, reject) => {
            const value = this.formGroup.value.operationMode;
            this.httpService.postAuth('setting/set-operation-mode', { operationMode: value }).then(() => {
                resolve();
            }).catch((err) => {
                console.log(err);
                reject();
            });
        });
    }

    onCancel() {
        super.onCancel();
        this.router.navigate(['/dashboard']);
    }
}
