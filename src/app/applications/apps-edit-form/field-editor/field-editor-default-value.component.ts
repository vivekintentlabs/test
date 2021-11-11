import { Component, Input } from '@angular/core';
import { ISchema } from 'ngx-schema-form';

@Component({
    selector: 'sf-field-editor-default-value',
    templateUrl: 'field-editor-default-value.component.html'
})
export class FieldEditorDefaultValueComponent {
    @Input() fieldSchema: ISchema;
}
