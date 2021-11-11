import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { emailValidator } from 'app/validators/email.validator';
import { Constants } from 'app/common/constants';

import { LoginService } from '../login.service';
import { HttpService } from '../../services/http.service';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-register-cmp',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
    providers: [
        LoginService
    ]
})
export class RegisterComponent implements OnInit, OnDestroy {
    registerForm: FormGroup;
    readonly termsOfServiceUrl = Constants.termsOfServiceUrl;
    readonly privacyPolicyUrl = Constants.privacyPolicyUrl;
    readonly passwordErrorText = Constants.passwordErrorText;
    public environment = environment;

    constructor(
        private fb: FormBuilder,
        private httpService: HttpService,
        private loginService: LoginService,
        private router: Router
        ) {
        this.registerForm = this.fb.group({
            email: ['.', Validators.compose([Validators.required, emailValidator])],
            password: ['', Validators.compose([Validators.required, Validators.pattern(Constants.passwordPattern)])],
            confirmPassword: ['', Validators.compose([Validators.required, Validators.pattern(Constants.passwordPattern)])],
            acceptTosAndPp: ['', Validators.requiredTrue],
            paramAccessCode: ['']
        });
    }

    ngOnInit() {
        this.checkAccessCode();
        const body = document.getElementsByTagName('body')[0];
        body.classList.add('lock-page');
        body.classList.add('off-canvas-sidebar');
        const card = document.getElementsByClassName('card')[0];
        setTimeout(function () {
            // after 1000 ms we add the class animated to the login/register card
            card.classList.remove('card-hidden');
        }, 1000);
    }

    ngOnDestroy() {
        const body = document.getElementsByTagName('body')[0];
        body.classList.remove('lock-page');
        body.classList.remove('off-canvas-sidebar');
    }

    public checkAccessCode() {
        const paramAccessCode = this.router.parseUrl(this.router.url).queryParams['access_code'];
        this.httpService.post('login-aditional/checkAccessCode', { access_code: paramAccessCode }).then((user) => {
            this.registerForm.controls['email'].setValue(user['email']);
            this.registerForm.controls['paramAccessCode'].setValue(paramAccessCode);
        }).catch((error) => {
            this.router.navigate(['noAuth/login']);
        });
    }

    onSubmit() {
        this.loginService.login('login-aditional/register', this.registerForm.value, 'Your password has been succesfully set');
    }

}
