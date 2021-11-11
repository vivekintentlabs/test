import { Component, Input, OnInit } from '@angular/core';
import { AppConstants } from 'app/applications/constants';
import { ISchema } from 'ngx-schema-form';

@Component({
    selector: 'sf-field-editor-choice-limit',
    templateUrl: 'field-editor-choice-limit.component.html',
})
export class FieldEditorChoiceLimitComponent implements OnInit {
    @Input() fieldSchema: ISchema;
    minItemsToggle = false;
    maxItemsToggle = false;
    maxAppFilesToUpload = AppConstants.maxAppFilesToUpload;

    ngOnInit(): void {
        this.minItemsToggle = !!this.fieldSchema.minItems;
        this.maxItemsToggle = !!this.fieldSchema.maxItems;
    }

    choiceLimitChanged(toggle: boolean, key: 'minItems' | 'maxItems') {
        if (!toggle) {
            key === 'maxItems' ? delete this.fieldSchema.maxItems : this.fieldSchema[key] = 0;
        } else if (toggle && this.fieldSchema[key] === 0) {
            this.fieldSchema[key] = 1;
        }
    }

    minItemsChanged(minItems: number) {
        if (this.maxItemsToggle && minItems >= this.fieldSchema.maxItems) this.fieldSchema.maxItems = minItems;
    }
}
