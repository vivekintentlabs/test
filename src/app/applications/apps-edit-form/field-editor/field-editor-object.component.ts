import { Component, Input } from '@angular/core';
import { ISchema } from 'ngx-schema-form';

@Component({
    selector: 'sf-field-editor-object',
    templateUrl: 'field-editor-object.component.html'
})
export class FieldEditorObjectComponent {
    @Input() fieldSchema: ISchema;
}
