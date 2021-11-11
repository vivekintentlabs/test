import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IAddCurrentSchoolCmpData } from '../../common/interfaces';
import { Constants } from '../../common/constants';

declare var $: any;

@Component({
    selector: 'app-add-current-school-dialog',
    templateUrl: './add-current-school-dialog.html',
})

export class AddCurrentSchoolDialogComponent {
    currentSchoolForm: FormGroup;
    loaded = false;
    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    length60 = Constants.length60;

    public static getDialogConfig(data: IAddCurrentSchoolCmpData) {
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
        public dialogRef: MatDialogRef<AddCurrentSchoolDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IAddCurrentSchoolCmpData
    ) {
        this.createForm();
        this.jqueryInit();
    }

    private createForm() {
        this.currentSchoolForm = this.fb.group({
            schoolName: [
                '',
                Validators.compose([
                    Validators.required,
                    Validators.minLength(this.requiredTextFieldMinLength),
                    Validators.maxLength(this.length60)
                ])
            ],
            schoolId: [this.data.schoolId, Validators.compose([Validators.required])],
        });
        this.loaded = true;
    }

    public onSubmit() {
        this.lastAction();
    }

    public onCancel() {
        this.lastAction();
    }

    private lastAction() {
        this.closeDialog();
        this.currentSchoolForm = null;
        this.loaded = false;
    }

    private closeDialog(): void {
        this.dialogRef.close();
    }

    private jqueryInit() {
        if (this.data.isPublicPage) {
            $(document).ready(() => {
                $('#' + this.data.htmlId).parent().parent().css('align-items', 'baseline');
                $('#' + this.data.htmlId).parent().parent().css('margin-top', this.data.top);
            });
        }
    }

}
