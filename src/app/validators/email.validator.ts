import { AbstractControl } from '@angular/forms';

import * as validator from 'validator';


export function emailValidator(control: AbstractControl): { [key: string]: any } | null {
    let isValid = true;
    if (control.value) {
        const email = control.value.trim();
        isValid = validator.isEmail(email);
    }
    return isValid ? null : { 'error': { value: control.value } };
}
