import { Component, Input, forwardRef, OnInit, OnDestroy } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgForm, FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Constants } from 'app/common/constants';

import { emailValidator } from 'app/validators/email.validator';

import * as _ from 'lodash';

interface IEmailList {
    email: string;
    valid: boolean;
}


@Component({
    selector: 'app-email-chips',
    templateUrl: './email-chips.component.html',
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => EmailChipsComponent), multi: true },
    ]
})
export class EmailChipsComponent implements OnInit, ControlValueAccessor, OnDestroy {
    selectable = true;
    removable = true;
    addOnBlur = true;
    readonly separatorKeysCodes: number[] = [ENTER, COMMA];

    @Input() parentForm: NgForm;
    @Input() formControlName: string;
    @Input() placeholder: string = 'Email(s)';
    public emailsForm: FormGroup;

    public _emails: IEmailList[] = [];

    private val: string;
    set emails(val: string) {
        if (val && this.val !== val) {
            this.val = val;
            this.getEmails(val);
            this.onChange(val);
            this.onTouch(val);
        }
    }

    private ngUnsubScribe = new Subject();

    constructor(private fb: FormBuilder) { }

    onChange: any = () => { };
    onTouch: any = () => { };

    ngOnInit() {
        this.emailsForm = this.fb.group({
            [this.formControlName]: ['', Validators.compose([emailValidator, Validators.maxLength(Constants.emailMaxLength)])]
        });
    }

    add(event: MatChipInputEvent): void {
        const input = event.input;
        const enteredEmails = event.value || '';

        if (enteredEmails) {
            this.getEmails(enteredEmails, input);
        }
    }

    private getEmails(emails: string, input = null) {
        const emailList = emails.split(',').map(i => i.trim()).filter(i => i);

        _.forEach(emailList, (email: string) => {
            if (!_.find(this._emails, item => item.email === email)) {
                const control = new FormControl(email, emailValidator);
                this._emails.push({ email: email, valid: control.valid });
            }
        })

        if (input) {
            input.value = '';
            this.emailsForm.markAsPristine();
        }
    }

    remove(email: string): void {
        const index = _.findIndex(this._emails, i => i.email === email);

        if (index >= 0) {
            this._emails.splice(index, 1);
        }
        this.emailsForm.reset();
        this.onChange(this.getEmailsString());
    }

    private getEmailsString(): string {
        const allEmails = this._emails.map(i => i.email);
        allEmails.push(this.emailsForm.value[this.formControlName]);
        return allEmails.join(',');
    }

    writeValue(emails: string) {
        this.emails = emails;
    }

    registerOnChange(fn: any) {
        this.emailsForm.valueChanges.pipe(takeUntil(this.ngUnsubScribe)).subscribe(() => {
            fn(this.getEmailsString());
        });
        this.onChange = fn;
    }

    registerOnTouched(fn: any) {
        this.onTouch = fn;
    }

    ngOnDestroy() {
        this.ngUnsubScribe.next();
        this.ngUnsubScribe.complete();
    }

}
