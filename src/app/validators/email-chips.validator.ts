import { AbstractControl, FormControl } from '@angular/forms';
import { emailValidator } from './email.validator';


export function emailChipsValidator(control: AbstractControl): { [key: string]: any } | null {
    let isValid = true;
    if (control.value) {
        const emailList = control.value.split(',').map(i => i.trim()).filter(i => i);
        emailList.forEach(email => {
            const tmpControl = new FormControl(email, emailValidator);
            if (tmpControl.invalid) {
                isValid = false;
            }
        });
    }
    return isValid ? null : { 'error': { value: control.value } };
}
