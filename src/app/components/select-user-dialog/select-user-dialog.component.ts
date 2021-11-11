import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ISelectUserData } from '../../common/interfaces';
import { Constants } from '../../common/constants';
import { HttpService } from '../../services/http.service';

@Component({
    selector: 'app-select-user-dialog',
    templateUrl: './select-user-dialog.component.html'
})
export class SelectUserDialogComponent {
    selectUserForm: FormGroup;
    loaded = false;
    public noItemSelected = Constants.noItemSelected; // show constant string in html

    public static getDialogConfig(data: ISelectUserData) {
        return {
            id: data.htmlId,
            width: '500px',
            minWidth: '200px',
            autoFocus: true,
            hasBackdrop: true,
            disableClose: true,
            data: data
        };
    }

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<SelectUserDialogComponent>,
        public httpService: HttpService,
        @Inject(MAT_DIALOG_DATA) public data: ISelectUserData
    ) {
        this.createForm();
    }

    private createForm() {
        this.selectUserForm = this.fb.group({
            userId: [null, Validators.compose([Validators.required])]
        });
        this.loaded = true;
    }

    public onSubmit() {
        this.dialogRef.close(this.selectUserForm.controls.userId.value);
        this.lastAction();
    }

    public onCancel() {
        this.dialogRef.close();
        this.lastAction();
    }

    private lastAction() {
        this.selectUserForm = null;
        this.loaded = false;
    }
}
