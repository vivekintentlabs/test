import { Component, Input, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, CheckboxControlValueAccessor } from '@angular/forms';

import { ICheckboxItem } from 'app/common/interfaces';

import * as _ from 'lodash';

@Component({
    selector: 'app-checkbox-group',
    templateUrl: './checkbox-group.component.html',
    styleUrls: ['./checkbox-group.component.scss'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => CheckboxGroupComponent),
        multi: true
    }]
})
export class CheckboxGroupComponent extends CheckboxControlValueAccessor {
    @Input() options: ICheckboxItem[];
    @Input() columnWidth?: string;

    onChange: any = () => { }
    onTouch: any = () => { }

    set value(val) {
        this.onChange(val);
        this.onTouch(val);
    }

    onToggle(event) {
        if (this.options && event) {
            const checkedOptions = this.options.filter(i => i.checked);
            const selectedValues = checkedOptions.map(i => i.id);
            this.writeValue(selectedValues);
        }
    }

    writeValue(value: any) {
        if (value) {
            this.value = value;
        }
    }

    registerOnChange(fn: any) {
        this.onChange = fn;
    }

    registerOnTouched(fn: any) {
        this.onTouch = fn;
    }

}
