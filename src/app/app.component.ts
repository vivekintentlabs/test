import { Component, OnInit, OnDestroy } from '@angular/core';
import { environment } from 'environments/environment';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';

import zingchart from 'zingchart/es6';

declare var $: any;

interface HeadScript {
    src: string;
    code: string;
}

@Component({
    selector: 'app-my-app',
    templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
    private _router: Subscription;

    constructor(
        private router: Router,
        private titleService: Title
    ) {
        // see https://stackoverflow.com/questions/44204417/dynamically-load-external-javascript-file-from-angular-component
        const google: HeadScript = { src: 'https://maps.googleapis.com/maps/api/js?key=' + environment.googleMapApiKey, code: '' };
        this.addScripts([google]);
    }

    private addScripts(scripts: HeadScript[]) {
        for (let i = 0; i < scripts.length; i++) {
            const node = document.createElement('script');
            if (scripts[i].src !== '') { node.src = scripts[i].src; }
            node.type = 'text/javascript';
            node.async = false;
            node.charset = 'utf-8';
            if (scripts[i].code !== '') { node.appendChild(document.createTextNode(scripts[i].code)) }
            document.getElementsByTagName('head')[0].appendChild(node);
        }
    }

    ngOnInit() {
        this.titleService.setTitle(environment.brand.title);
        // dummy call to force the zingchart library to be loaded before setting the license (angular will otherwise not load the lib)
        const temp: string = zingchart.toString();
        if (temp === '') {
            console.error('could not load zingchart lib')
        }

        const zingChartScript: HeadScript = { src: '', code: 'ZC.LICENSE = [\'19a9e3b3ecdb59c13b81780882b774dd\', \'296a7871392f1b181b1a314b5ead4894\',\'6306aa4008fea11efebfa9e6799f6cc2\'];' };
        this.addScripts([zingChartScript]);
        // if some modal is opened on redirect this will close all the modal and removes backdrop
        this._router = this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
            const body = document.getElementsByTagName('body')[0];
            if (body.classList.contains('modal-open')) {
                body.classList.remove('modal-open');
                $('.modal-backdrop').remove();
            }
        });
    }

    ngOnDestroy() {
        this._router.unsubscribe();
    }
}
