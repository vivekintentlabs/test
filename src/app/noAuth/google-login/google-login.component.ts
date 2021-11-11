import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { LoginService } from '../login.service';

@Component({
    selector: 'app-google-login-cmp',
    templateUrl: './google-login.component.html',
    providers: [
        LoginService
    ]
})
export class GoogleLoginComponent implements OnInit, OnDestroy {

    constructor(
        private loginService: LoginService,
        private activatedRoute: ActivatedRoute
    ) { }

    ngOnInit() {
        const body = document.getElementsByTagName('body')[0];
        body.classList.add('lock-page');
        body.classList.add('off-canvas-sidebar');
        const card = document.getElementsByClassName('card')[0];
        setTimeout(function () {
            // after 1000 ms we add the class animated to the login/register card
            card.classList.remove('card-hidden');
        }, 700);
        const params = this.activatedRoute.snapshot.queryParams;
        return this.loginService.login('login-aditional/google-login', params);
    }

    ngOnDestroy() {
        const body = document.getElementsByTagName('body')[0];
        body.classList.remove('lock-page');
        body.classList.remove('off-canvas-sidebar');
    }

}
