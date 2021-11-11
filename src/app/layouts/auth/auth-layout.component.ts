import { Component, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators'
import * as _ from 'lodash';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-layout',
    templateUrl: './auth-layout.component.html'
})
export class AuthLayoutComponent implements OnInit, OnDestroy {
    private toggleButton: any;
    private sidebarVisible: boolean;
    mobile_menu_visible: any = 0;
    private _router: Subscription;
    loadNavbar = false;
    public brand = environment.brand;

    constructor(private router: Router, private element: ElementRef) {
        this.sidebarVisible = false;
        this._router = this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
            this.loadNavbar = (event && event.url && _.startsWith(_.lowerCase(event.url), 'no auth ')) ? true : false;
        });
    }

    ngOnInit() {
        this.sidebarClose();
    }

    ngOnDestroy() {
        this._router.unsubscribe();
    }

    sidebarOpen() {
        this.toggleButton = this.element.nativeElement.getElementsByClassName('navbar-toggler')[0];
        const toggleButton = this.toggleButton;
        if (toggleButton) {
            const body = document.getElementsByTagName('body')[0];
            setTimeout(() => {
                toggleButton.classList.add('toggled');
            }, 500);
            body.classList.add('nav-open');

            this.sidebarVisible = true;
        }
    };
    sidebarClose() {
        if (this.loadNavbar) {
            const body = document.getElementsByTagName('body')[0];
            if (this.toggleButton) {
                this.toggleButton.classList.remove('toggled');
            }
            this.sidebarVisible = false;
            body.classList.remove('nav-open');
        }
    };
    sidebarToggle() {
        const body = document.getElementsByTagName('body')[0];
        if (this.sidebarVisible === false) {
            this.sidebarOpen();
            // let $layer = document.createElement('div');
            // $layer.setAttribute('class', 'close-layer');
            // if (body.querySelectorAll('.wrapper-full-page')) {
            //     document.getElementsByClassName('wrapper-full-page')[0].appendChild($layer);
            // } else if (body.classList.contains('off-canvas-sidebar')) {
            //     document.getElementsByClassName('wrapper-full-page')[0].appendChild($layer);
            // }
            // setTimeout(function () {
            //     $layer.classList.add('visible');
            // }, 100);
            // $layer.onclick = function () { // asign a function
            //     body.classList.remove('nav-open');
            //     this.mobile_menu_visible = 0;
            //     $layer.classList.remove('visible');
            //     this.sidebarClose();
            // }.bind(this);

            body.classList.add('nav-open');
        } else {
            // document.getElementsByClassName('close-layer')[0].remove();
            this.sidebarClose();
        }
    }
}
