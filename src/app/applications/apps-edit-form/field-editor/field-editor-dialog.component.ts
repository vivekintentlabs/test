import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { FormProperty, ISchema } from 'ngx-schema-form';
import * as _ from 'lodash';

@Component({
  selector: 'sf-field-editor-dialog',
  templateUrl: 'field-editor-dialog.component.html',
})
export class FieldEditorDialog {
  fieldSchema: ISchema = {};
  isDebug: boolean;

  constructor(
    public dialogRef: MatDialogRef<FieldEditorDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { formProperty: FormProperty, isDebug?: boolean }) {

    this.fieldSchema = _.cloneDeep(data.formProperty.schema);
    this.isDebug = !!data.isDebug;
  }
}
