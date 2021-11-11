import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { list_id } from '../../common/enums';
import { Constants } from '../../common/constants';
import { AddListItemCmpData } from '../../common/interfaces';
import { Utils } from '../../common/utils';

import { ListItem } from '../../entities/list-item';
import { HttpService } from '../../services/http.service';

import * as _ from 'lodash';
declare var $: any;


@Component({
    selector: 'app-add-list-item-dialog',
    templateUrl: './add-list-item-dialog.html',
})
export class AddListItemDialogComponent {
    listItemForm: FormGroup;
    title = 'List Item';
    loaded = false;
    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    length50 = Constants.length50;

    public static getDialogConfig(data: AddListItemCmpData) {
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
        public dialogRef: MatDialogRef<AddListItemDialogComponent>,
        public httpService: HttpService,
        @Inject(MAT_DIALOG_DATA) public allData: AddListItemCmpData
    ) {
        if (this.allData.listId) {
            this.title = _.startCase(list_id[this.allData.listId]);
        }
        this.createForm();
        this.jqueryInit();
    }

    private createForm() {
        this.listItemForm = this.fb.group({
            name: ['', Validators.compose([
                Validators.required, Validators.minLength(Constants.requiredTextFieldMinLength), Validators.maxLength(this.length50)
            ])],
            listId: [this.allData.listId, Validators.compose([Validators.required])],
            schoolId: [this.allData.schoolId, Validators.compose([Validators.required])],
        });
        this.loaded = true;
    }

    public onSubmit() {
        if (this.allData.beforeRefactoring) {
            if (this.allData.isPublicPage) {
                const listItem = ListItem.newListItem(this.listItemForm.controls.name.value)
                this.allData.items.push(listItem, ..._.remove(this.allData.items, s => s.id === 0)); // moves Other to end of the array
                this.allData.control.setValue(listItem.id);
            } else {
                this.httpService.postAuth('list-items/add', this.listItemForm.value).then((listItem: ListItem) => {
                    this.allData.items.push(listItem, ..._.remove(this.allData.items, s => s.id === 0)); // moves Other to end of the array
                    this.allData.control.setValue(listItem.id);
                    Utils.showSuccessNotification();
                }).catch(err => console.log(err));
            }
        }
    }

    public onCancel() {
        if (this.allData.beforeRefactoring) {
            this.allData.control.setValue(this.allData.defaultValue)
        }

        this.lastAction();
    }

    private lastAction() {
        this.closeDialog();
        this.listItemForm = null;
        this.loaded = false;
    }

    private closeDialog(): void {
        this.dialogRef.close();
    }

    private jqueryInit() {
        if (this.allData.isPublicPage) {
            $(document).ready(() => {
                $('#' + this.allData.htmlId).parent().parent().css('align-items', 'baseline');
                $('#' + this.allData.htmlId).parent().parent().css('margin-top', this.allData.top);
            });
        }
    }
}
