import { Component, Inject, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { AddListItemCmpData, IAddCurrentSchoolCmpData } from '../../common/interfaces';
import { Constants } from '../../common/constants';
import { HttpService } from '../../services/http.service';

import * as _ from 'lodash';
declare var $: any;

@Component({
    selector: 'app-add-other-dialog',
    templateUrl: './add-other-dialog.html',
})
export class AddOtherDialogComponent {
    private static paddingForPopUp = 100; // 100 is a padding from the bottom
    addOtherForm: FormGroup;
    title = '';
    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    requiredTextFieldMaxLength;
    promiseForBtn: Promise<any>;
    @Output() onAdd = new EventEmitter<any>();

    public static getDialogConfig(data) {
        return {
            id: data.htmlId,
            width: '500px',
            minWidth: '200px',
            autoFocus: true,
            hasBackdrop: true,
            disableClose: true,
            data
        };
    }

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<AddOtherDialogComponent>,
        public httpService: HttpService,
        @Inject(MAT_DIALOG_DATA) public allData: AddListItemCmpData | IAddCurrentSchoolCmpData
    ) {
        this.title = this.allData['listId'] ? 'List Item' : 'Current School';
        this.requiredTextFieldMaxLength = this.allData['listId'] ? Constants.requiredListItemNameMaxLength : Constants.requiredSchoolNameMaxLength;
        this.createForm();
        this.jqueryInit();
    }

    private createForm() {
        this.addOtherForm = this.fb.group({
            name: ['', Validators.compose([
                Validators.required, Validators.minLength(this.requiredTextFieldMinLength), Validators.maxLength(this.requiredTextFieldMaxLength)
            ])],
            schoolId: [this.allData.schoolId, Validators.compose([Validators.required])],
        });
        if (this.allData['listId']) {
            this.addOtherForm.addControl('listId', new FormControl(this.allData['listId'], Validators.compose([Validators.required])));
        }
    }

    onSubmit() {
        this.onAdd.emit(this.addOtherForm.value);
    }

    public onCancel() {
        this.closeDialog();
        this.addOtherForm = null;
    }

    private closeDialog(): void {
        this.dialogRef.close();
    }

    private jqueryInit() {
        if (this.allData.isPublicPage) {
            const iframeHeight = window.innerHeight; // the height of webform iframe
            // align otherPopUp a little higher if it is too low
            if (iframeHeight - this.allData.top < Constants.otherPopupHeight) {
                this.allData.top = iframeHeight - Constants.otherPopupHeight - AddOtherDialogComponent.paddingForPopUp;
            }
            $(document).ready(() => {
                $('#' + this.allData.htmlId).parent().parent().css('align-items', 'baseline');
                $('#' + this.allData.htmlId).parent().parent().css('margin-top', this.allData.top);
            });
        }
    }
}
