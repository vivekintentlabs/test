import { Component, Input, OnInit } from '@angular/core';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ISchema } from 'ngx-schema-form';

import { Constants } from '../../../common/constants';
import { ModalAction } from '../../../common/enums';
import { Custom, CustomFieldSchema, Type } from '../custom';

import { v4 as uuidv4 } from 'uuid';
import * as _ from 'lodash';

@Component({
    selector: 'app-field-custom-dialog',
    templateUrl: 'field-custom-dialog.component.html'
})
export class AppsCustomFieldDialog implements OnInit {
    @Input() fieldSchema: ISchema;
    customFields: CustomFieldSchema[];
    fieldSchemaId: Type;
    displayOtherLabel = Constants.displayOtherLabel;
    displayOtherOption: boolean = false;
    isAddCustom: boolean = true;
    readonly separatorKeysCodes: number[] = [ENTER, COMMA];

    constructor(
        private activeModal: NgbActiveModal
    ) { }

    ngOnInit(): void {
        this.customFields = _.cloneDeep(Custom.customFields);
        if (this.fieldSchema) {
            this.isAddCustom = false;
            const widgetId = typeof this.fieldSchema.widget === 'object' ? this.fieldSchema.widget.id : this.fieldSchema.widget;
            this.fieldSchemaId = _.find(this.customFields, i => i.fieldSchema.type === this.fieldSchema.type && (i.fieldSchema.widget.id === widgetId || i.fieldSchema.widget === widgetId)).id;
            if (!this.fieldSchemaId) throw new Error('Field not exist');
        } else {
            this.fieldSchemaId = Type.ShortAnswer;
            this.typeChanged(this.fieldSchemaId);
        }
    }

    onUpdate(): void {
        this.activeModal.close({ action: this.isAddCustom ? ModalAction.Create : ModalAction.Update, fieldSchema: this.fieldSchema });
    }

    typeChanged(fieldSchemaId: Type) {
        const prevFieldSchema: ISchema = _.cloneDeep(this.fieldSchema);
        this.fieldSchema = this.customFields.find(f => f.id === fieldSchemaId).fieldSchema;
        if (prevFieldSchema?.title) this.fieldSchema.title = prevFieldSchema.title;
        if (prevFieldSchema?.description) this.fieldSchema.description = prevFieldSchema.description;
        const oneOf = prevFieldSchema?.oneOf || prevFieldSchema?.items?.oneOf;
        if (!_.isEmpty(oneOf)) {
            this.fieldSchema.type === 'array' ? this.fieldSchema.items.oneOf = oneOf : this.fieldSchema.oneOf = oneOf;
        }
    }

    addValue(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;

        // Add our item
        if ((value || '').trim()) {
            const val = value.trim();
            if (this.fieldSchema.type === 'array') {
                this.fieldSchema.items.oneOf.push({ enum: [uuidv4()], description: val, includeInList: true });
            } else {
                this.fieldSchema.oneOf.push({ enum: [uuidv4()], description: val, includeInList: true });
            }
        }
        // Reset the input value
        if (input) {
            input.value = '';
        }
    }

    removeValue(id: string): void {
        const index = this.fieldSchema.type === 'array' ? this.fieldSchema.items.oneOf.findIndex(obj => obj.enum[0] === id) : this.fieldSchema.oneOf.findIndex(obj => obj.enum[0] === id);

        if (index >= 0) {
            this.fieldSchema.type === 'array' ? this.fieldSchema.items.oneOf.splice(index, 1) : this.fieldSchema.oneOf.splice(index, 1);
        }
    }

    displayOtherChanged(value: boolean) {

    }

    onCancel(): void {
        this.activeModal.close({ action: ModalAction.Cancel });
    }

}
