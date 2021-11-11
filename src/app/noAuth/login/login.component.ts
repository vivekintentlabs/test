import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { HttpService } from '../../services/http.service';
import { LoginService } from '../login.service';

import { emailValidator } from 'app/validators/email.validator';
import { Constants } from 'app/common/constants';
import { T } from 'app/common/t';
import { OperationMode } from 'app/common/enums';

import { Setting } from 'app/entities/setting';

import * as _ from 'lodash';

declare var $: any;
@Component({
    selector: 'app-login-cmp',
    templateUrl: './login.component.html',
    providers: [
        LoginService
    ],
})

export class LoginComponent implements OnInit, OnDestroy {
    loginForm: FormGroup;
    date: Date = new Date();
    loaded = false;
    private toggleButton: any;
    private sidebarVisible: boolean;
    private nativeElement: Node;
    readonly passwordErrorText = Constants.passwordErrorText;
    isUnderMaintenance = false;
    underMaintenanceMsg = T.underMaintenanceMsg;

    constructor(
        private fb: FormBuilder,
        private httpService: HttpService,
        private loginService: LoginService,
        private element: ElementRef
    ) {
        this.nativeElement = element.nativeElement;
        this.sidebarVisible = false;
    }

    ngOnInit() {
        window.scrollTo(0, 0);
        this.httpService.get('login-info').then((operationMode: Setting) => {
            this.isUnderMaintenance = (
                operationMode.intValue === OperationMode.Maintenance ||
                operationMode.intValue === OperationMode.Maintenance_with_cronJobs
            );

            this.httpService.updateCurrentSchoolId(null);
            this.createForm();

            const navbar: HTMLElement = this.element.nativeElement;
            this.toggleButton = navbar.getElementsByClassName('navbar-toggle')[0];
            const body = document.getElementsByTagName('body')[0];
            body.classList.add('login-page');
            body.classList.add('off-canvas-sidebar');
            const card = document.getElementsByClassName('card')[0];
            setTimeout(() => {
                // after 1000 ms we add the class animated to the login/register card
                card.classList.remove('card-hidden');
            }, 700);
        }).catch((error) => console.log(error));
    }

    createForm() {
        this.loginForm = this.fb.group({
            username: ['', Validators.compose([Validators.required, emailValidator])],
            password: ['', Validators.compose([Validators.required, Validators.pattern(Constants.passwordPattern)])]
        });
        this.loaded = true;
    }

    onSubmit() {
        const username = this.loginForm.get('username').value;
        const password = this.loginForm.get('password').value;
        return this.loginService.login('login/login', { username, password });
    }

    sidebarToggle() {
        const toggleButton = this.toggleButton;
        const body = document.getElementsByTagName('body')[0];
        const sidebar = document.getElementsByClassName('navbar-collapse')[0];
        if (this.sidebarVisible === false) {
            setTimeout(function () {
                toggleButton.classList.add('toggled');
            }, 500);
            body.classList.add('nav-open');
            this.sidebarVisible = true;
        } else {
            this.toggleButton.classList.remove('toggled');
            this.sidebarVisible = false;
            body.classList.remove('nav-open');
        }
    }

    ngOnDestroy() {
        const body = document.getElementsByTagName('body')[0];
        body.classList.remove('login-page');
        body.classList.remove('off-canvas-sidebar');
    }

}
