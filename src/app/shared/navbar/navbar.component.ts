import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Inject } from '@angular/core';
import { Router, UrlTree, UrlSegmentGroup, UrlSegment, PRIMARY_OUTLET, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { PersistState } from '@datorama/akita';

import { AppRoutes } from '../../sidebar/sidebar-routes.config';
import { Constants } from '../../common/constants';
import { Utils } from '../../common/utils';
import { UserInfo } from '../../entities/userInfo';
import { School } from '../../entities/school';

import { ListenerService } from '../../services/listener.service';
import { HttpService } from '../../services/http.service';
import { StateService } from '../../services/state.service';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { DataService } from '../../services/data.service';

declare var $: any;
import * as _ from 'lodash';
import { EnrolmentTarget } from 'app/entities/enrolmentTarget';

const misc: any = {
    navbar_menu_visible: 0,
    active_collapse: true,
    disabled_collapse_init: 0,
};

@Component({
    selector: 'app-navbar-cmp',
    templateUrl: 'navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})

export class NavbarComponent implements OnInit, OnDestroy {
    private nativeElement: Node;
    private toggleButton: any;
    private sidebarVisible: boolean;

    listTitles: any[];
    userInfo: UserInfo = null;
    debugMode: boolean = Constants.debugMode;
    Constants = Constants;
    title = '';
    mobile_menu_visible = false;
    private ngUnsubScribe = new Subject();

    @ViewChild('app-navbar-cmp') button: any;

    constructor(
        private location: Location,
        private element: ElementRef,
        private router: Router,
        private listenerService: ListenerService,
        private httpService: HttpService,
        private stateService: StateService,
        private translate: TranslateService,
        private dataService: DataService,
        @Inject('persistStorage') private persistStorage: PersistState,
    ) {
        this.nativeElement = element.nativeElement;
        this.sidebarVisible = false;
        this.listenerService.schoolListStatus().pipe(takeUntil(this.ngUnsubScribe)).subscribe(() => this.getNavBarTitles());
        this.listenerService.sidebarStatus().pipe(takeUntil(this.ngUnsubScribe)).subscribe(() => { this.sidebarToggle(); });
        this.translate.onLangChange.pipe(takeUntil(this.ngUnsubScribe)).subscribe((event: LangChangeEvent) => {
            this.getNavBarTitles();
        });
    }

    ngOnInit() {
        this.getNavBarTitles();

        const navbar: HTMLElement = this.element.nativeElement;
        const body = document.getElementsByTagName('body')[0];
        this.toggleButton = navbar.getElementsByClassName('navbar-toggler')[0];
        if (body.classList.contains('sidebar-mini')) {
            misc.sidebar_mini_active = true;
        }
        if (body.classList.contains('hide-sidebar')) {
            misc.hide_sidebar_active = true;
        }
        // tslint:disable-next-line:max-line-length
        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).pipe(takeUntil(this.ngUnsubScribe)).subscribe((event: NavigationEnd) => {
            this.sidebarClose();
        });
    }

    ngOnDestroy() {
        this.ngUnsubScribe.next();
        this.ngUnsubScribe.complete();
    }

    private getNavBarTitles() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.httpService.getAuth('schools/get/' + this.userInfo.schoolId).then((school: School) => {
            const isEnabledAppModule = (school && school.modules)
                ? Utils.isSchoolModuleEnabled(school.modules, Constants.schoolModules.appModule.name)
                : false;
            let enrolment = '';
            let year = '';
            this.translate.get('et.enrolment').pipe(takeUntil(this.ngUnsubScribe)).subscribe((res: string) => enrolment = res);
            this.translate.get('et.year').pipe(takeUntil(this.ngUnsubScribe)).subscribe((res: string) => year = res);
            this.listTitles = AppRoutes.getAppRoutes(this.userInfo, Constants.debugMode, enrolment, year, isEnabledAppModule).filter(listTitle => listTitle);
            this.title = this.getTitle();

            this.router.events.pipe(takeUntil(this.ngUnsubScribe)).subscribe((val) => {
                if (val instanceof NavigationEnd) {
                    this.listTitles = AppRoutes.getAppRoutes(this.userInfo, Constants.debugMode, enrolment, year, isEnabledAppModule).filter(listTitle => listTitle);
                    this.title = this.getTitle();
                }
            });
        });
    }

    minimizeSidebar() {
        const body = document.getElementsByTagName('body')[0];

        if (misc.sidebar_mini_active === true) {
            body.classList.remove('sidebar-mini');
            misc.sidebar_mini_active = false;
        } else {
            setTimeout(() => {
                body.classList.add('sidebar-mini');
                misc.sidebar_mini_active = true;
            }, 300);
        }

        // we simulate the window Resize so the charts will get updated in realtime.
        const simulateWindowResize = setInterval(() => {
            window.dispatchEvent(new Event('resize'));
        }, 180);

        // we stop the simulation of Window Resize after the animations are completed
        setTimeout(() => {
            clearInterval(simulateWindowResize);
        }, 1000);
    }

    hideSidebar() {
        const body = document.getElementsByTagName('body')[0];
        const sidebar = document.getElementsByClassName('sidebar')[0];

        if (misc.hide_sidebar_active === true) {
            setTimeout(() => {
                body.classList.remove('hide-sidebar');
                misc.hide_sidebar_active = false;
            }, 300);
            setTimeout(() => {
                sidebar.classList.remove('animation');
            }, 600);
            sidebar.classList.add('animation');
        } else {
            setTimeout(() => {
                body.classList.add('hide-sidebar');
                // $('.sidebar').addClass('animation');
                misc.hide_sidebar_active = true;
            }, 300);
        }

        // we simulate the window Resize so the charts will get updated in realtime.
        const simulateWindowResize = setInterval(() => {
            window.dispatchEvent(new Event('resize'));
        }, 180);

        // we stop the simulation of Window Resize after the animations are completed
        setTimeout(() => {
            clearInterval(simulateWindowResize);
        }, 1000);
    }

    onResize(event) {
        return Utils.isMobileSize();
    }

    sidebarOpen() {
        const $toggle = document.getElementsByClassName('navbar-toggler')[0];
        const toggleButton = this.toggleButton;
        const body = document.getElementsByTagName('body')[0];
        setTimeout(function () {
            toggleButton.classList.add('toggled');
        }, 500);
        body.classList.add('nav-open');
        setTimeout(function () {
            $toggle.classList.add('toggled');
        }, 430);

        body.classList.add('nav-open');
        this.mobile_menu_visible = true;
        this.sidebarVisible = true;
    }

    sidebarClose() {
        const $toggle = document.getElementsByClassName('navbar-toggler')[0];
        const body = document.getElementsByTagName('body')[0];
        this.toggleButton.classList.remove('toggled');

        this.sidebarVisible = false;
        body.classList.remove('nav-open');

        setTimeout(() => {
            $toggle.classList.remove('toggled');
        }, 400);

        this.mobile_menu_visible = false;
    }

    sidebarToggle() {
        (this.sidebarVisible === false) ? this.sidebarOpen() : this.sidebarClose();
    }

    getTitle() {
        const title: any = this.location.prepareExternalUrl(this.location.path());
        for (let i = 0; i < this.listTitles.length; i++) {
            if (this.listTitles[i].type === 'link' && this.listTitles[i].path === title) {
                return this.listTitles[i].title;
            } else if (this.listTitles[i].type === 'sub') {
                for (let j = 0; j < this.listTitles[i].children.length; j++) {
                    const subtitle = this.listTitles[i].path + '/' + this.listTitles[i].children[j].path;
                    if (subtitle === title) {
                        return this.listTitles[i].children[j].title;
                    }
                }
            }
        }
        let pathTitle = '';
        const tree: UrlTree = this.router.parseUrl(title);
        const g: UrlSegmentGroup = tree.root.children[PRIMARY_OUTLET];
        const s: UrlSegment[] = g.segments;
        const name = s[1].path;
        switch (name) {
            case 'edit-school': pathTitle = 'School Details'; break;
            case 'edit-student': pathTitle = 'Student Details'; break;
            case 'edit-contact': pathTitle = 'Contact Details'; break;
            case 'edit-user': pathTitle = 'User Details'; break;
            case 'edit-event': pathTitle = 'Event Details'; break;
            case 'edit-personal-tour': pathTitle = 'Personal Tour Details'; break;
            default: pathTitle = ''; break;
        }
        return pathTitle;
    }

    getPath() {
        return this.location.prepareExternalUrl(this.location.path());
    }

    isMobileMenu() {
        return Utils.isMobileSize();
    }

    userProfile() {
        $('#userProfileModal').modal('show');
    }

    showFeedback() {
        $('#feedbackModal').modal('show');
    }

    logout() {
        console.log('logging out because clicked logout in the navbar');
        Utils.resetSession();
        localStorage.removeItem('token');
        this.httpService.updateCurrentSchoolId(null);
        this.stateService.resetFilter();
        this.dataService.resetAll();
        this.persistStorage.clearStore();
        this.router.navigate(['noAuth/login']);
    }

}
