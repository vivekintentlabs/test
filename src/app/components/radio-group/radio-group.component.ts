import { Component, Input, forwardRef, Output, EventEmitter, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, RadioControlValueAccessor } from '@angular/forms';

import { ICheckboxItem } from 'app/common/interfaces';

@Component({
    selector: 'app-radio-group',
    templateUrl: './radio-group.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => RadioGroupComponent),
            multi: true
        }
    ]
})
export class RadioGroupComponent extends RadioControlValueAccessor implements OnInit {
    @Input() options: ICheckboxItem[];
    @Input() id?: string; // is needed only if on the same page more than one formControlName with exactly the same value exists.
    _value: any;
    isDisabled: boolean;
    @Output() changed = new EventEmitter();

    private setValue(val) {
        this._value = val;
        this.onChange(val);
        this.onTouched(val);
    }

    onChange: any = () => { }
    onTouched: any = () => { }

    ngOnInit() {
        this.name = this.id ? this.id + this.formControlName : this.formControlName;
    }

    writeValue(value: any) {
        if (value) {
            this.value = value;
        }
        this.setValue(value);
    }

    registerOnChange(fn: any) {
        this.onChange = fn;
    }

    registerOnTouched(fn: any) {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }

    clicked(value) {
        this.value = value;
        this.setValue(value);
        this.changed.emit();
    }
}
