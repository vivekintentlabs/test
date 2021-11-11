import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from 'app/services/http.service';

import { emailValidator } from 'app/validators/email.validator';
import { Setting } from 'app/entities/setting';
import { T } from 'app/common/t';
import { OperationMode } from 'app/common/enums';
import { Utils, Colors } from 'app/common/utils';


@Component({
    selector: 'app-forgot-password-cmp',
    templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
    fgrtPwdForm: FormGroup;
    date: Date = new Date();
    loaded = false;

    isUnderMaintenance = true;
    underMaintenanceMsg = T.underMaintenanceMsg;

    constructor(private fb: FormBuilder, private httpService: HttpService) {
    }

    createForm() {
        this.fgrtPwdForm = this.fb.group({
            email: ['', Validators.compose([Validators.required, emailValidator])]
        });
        this.loaded = true;
    }

    onSubmit() {
        this.httpService.post('login-aditional/forgot-password', { email: this.fgrtPwdForm.value.email }).then(() => {
            Utils.showNotification('Your message has been successfully sent. ', Colors.success);
        });
    }

    ngOnInit() {
        this.httpService.get('login-aditional').then((setting: Setting) => {
            this.isUnderMaintenance = (
                setting.intValue === OperationMode.Maintenance ||
                setting.intValue === OperationMode.Maintenance_with_cronJobs
            );
            this.createForm();
        });
        const body = document.getElementsByTagName('body')[0];
        body.classList.add('lock-page');
        body.classList.add('off-canvas-sidebar');
        setTimeout(function () {
            // after 1000 ms we add the class animated to the login/register card
            const card = document.getElementsByClassName('card')[0];
            card.classList.remove('card-hidden');
        }, 1000);
    }

    ngOnDestroy() {
        const body = document.getElementsByTagName('body')[0];
        body.classList.remove('lock-page');
        body.classList.remove('off-canvas-sidebar');
    }
}
