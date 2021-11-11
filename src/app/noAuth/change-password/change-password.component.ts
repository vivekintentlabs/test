import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { emailValidator } from '../../validators/email.validator';
import { Constants } from '../../common/constants';
import { LoginService } from '../login.service';

declare var $: any;

declare interface User {
    email?: string; // required, must be valid email format
    password?: string; // required, value must be equal to confirm password.
    confirmPassword?: string; // required, value must be equal to password.
}

@Component({
    selector: 'app-change-password-cmp',
    templateUrl: './change-password.component.html',
    providers: [
        LoginService
    ]
})
export class ChangePasswordComponent implements OnInit, OnDestroy {
    chngPwdForm: FormGroup;
    public user: User;
    readonly passwordErrorText = Constants.passwordErrorText;

    constructor(
        private fb: FormBuilder,
        private httpService: HttpService,
        private loginService: LoginService,
        private router: Router,
    ) {
        this.chngPwdForm = this.fb.group({
            email: ['.', Validators.compose([Validators.required, emailValidator])],
            password: ['', Validators.compose([Validators.required, Validators.pattern(Constants.passwordPattern)])],
            confirmPassword: ['', Validators.compose([Validators.required, Validators.pattern(Constants.passwordPattern)])],
            paramAccessCode: ['']
        });
    }

    checkFullPageBackgroundImage() {
        const $page = $('.full-page');
        const imageSrc = $page.data('image');

        if (imageSrc !== undefined) {
            const imageContainer = '<div class="full-page-background" style="background-image: url(' + imageSrc + ') "/>';
            $page.append(imageContainer);
        }
    }

    public checkAccessCode() {
        const paramAccessCode = this.router.parseUrl(this.router.url).queryParams['access_code'];
        this.httpService.post('login-aditional/checkAccessCode', { access_code: paramAccessCode }).then((user) => {
            this.chngPwdForm.controls['email'].setValue(user['email']);
            this.chngPwdForm.controls['paramAccessCode'].setValue(paramAccessCode);
        }).catch((error) => {
            this.router.navigate(['/noAuth/login']);
        });
    }

    ngOnInit() {
        const body = document.getElementsByTagName('body')[0];
        body.classList.add('lock-page');
        body.classList.add('off-canvas-sidebar');
        this.checkAccessCode();
        this.checkFullPageBackgroundImage();
        this.user = {
            password: '',
            confirmPassword: ''
        };
    }

    ngOnDestroy() {
        const body = document.getElementsByTagName('body')[0];
        body.classList.remove('lock-page');
        body.classList.remove('off-canvas-sidebar');
    }

    onSubmit() {
       return this.loginService.login('login-aditional/resetPassword', this.chngPwdForm.value, 'Your password has been reset successfully');
    }

}
