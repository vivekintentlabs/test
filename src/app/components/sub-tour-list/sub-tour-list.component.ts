import { Component, Input, forwardRef, EventEmitter, Output, SimpleChanges, OnChanges } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

import { ISelectFormControl } from 'app/common/interfaces';
import { Constants } from 'app/common/constants';

import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
    selector: 'app-sub-tour-list',
    templateUrl: './sub-tour-list.component.html',
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => SubTourListComponent),
        multi: true
    }]
})
export class SubTourListComponent implements ControlValueAccessor, OnChanges {
    @Input() options: ISelectFormControl[];
    @Input() multiple: boolean;
    @Input() placeholder: string;
    @Input() isOnlineRegistration: boolean;
    @Input() isRequired: boolean;
    @Output() changed = new EventEmitter();

    isDisabled: boolean;
    _value;
    set value(val: any) {
        this._value = val;
        this.onChange(val);
        this.onTouched(val);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (_.has(changes, 'options')) {
            this.initOptions();
        }
    }

    onChange: any = () => { };
    onTouched: any = () => { };

    registerOnChange(fn: any) {
        this.onChange = fn;
    }

    registerOnTouched(fn: any) {
        this.onTouched = fn;
    }

    writeValue(value: any) {
        this._value = value;
        this.initOptions();
    }

    setDisabledState(isDisabled: boolean) {
        this.isDisabled = isDisabled;
    }

    subtourChanged(value: any) {
        this.value = value;
        this.changed.emit();
    }

    onToggle(event) {
        if (this.options && event) {
            this.value = this.options.filter(i => i.checked);
            this.changed.emit();
        }
    }

    initOptions() {
        if (this.multiple) {
            _.forEach(this.options, o => {
                o.checked = _.find(this._value, s => s.id === o.id) ? true : false;
            });
        } else {
            return;
        }
    }

}
