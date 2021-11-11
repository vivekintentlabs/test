import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NavItem, NavItemType } from '../../md/md.module';
import { Location, PopStateEvent } from '@angular/common';
import { Subscription, SubscriptionLike as ISubscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { Constants } from '../../common/constants';
import { Utils } from '../../common/utils';
import { UserInfo } from '../../entities/userInfo';

import { LocaleService } from '../../services/locale.service';
import { HttpService } from '../../services/http.service';
import { AppStateService } from '../../services/app-state.service';

import { NavbarComponent } from '../../shared/navbar/navbar.component';
import PerfectScrollbar from 'perfect-scrollbar';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-layout',
    templateUrl: './admin-layout.component.html',
    styleUrls: ['admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
    public navItems: NavItem[];
    public version = Constants.version;
    public build = Constants.build;
    public backendBuild = undefined;
    public dbBuild = undefined;

    private _router: Subscription;
    private lastPoppedUrl: string;
    private yScrollStack: number[] = [];
    url: string;
    location: Location;

    private sub: Subscription;
    private locationSub: ISubscription;
    public userInfo: UserInfo = null;
    public brand = environment.brand;

    @ViewChild('sidebar') sidebar: any;
    @ViewChild(NavbarComponent) navbar: NavbarComponent;

    constructor(
        location: Location,
        private router: Router,
        private httpService: HttpService,
        private translate: TranslateService,
        private localeService: LocaleService,
        private appStateService: AppStateService,
    ) {
        this.location = location;
        this.userInfo = Utils.getUserInfoFromToken();
        const locale = this.localeService.getCurrentLocale();
        this.translate.use(locale);
        this.translate.setDefaultLang(locale);
    }

    private pad(numberString: string, max: number) {
        return numberString.length < max ? this.pad('0' + numberString, max) : numberString;
    }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        return this.httpService.getAuth('setting/get-versions').then((versions: any) => {
            this.backendBuild = this.pad(versions.BUILD_VERSION.toString(), 4);
            this.dbBuild = this.pad(versions.DB_VERSION.toString(), 4);
            this.appStateService.updateStateSchool();
        }).then(() => {
            const elemMainPanel = <HTMLElement>document.querySelector('.main-panel');
            const elemSidebar = <HTMLElement>document.querySelector('.sidebar .sidebar-wrapper');
            this.locationSub = this.location.subscribe((ev: PopStateEvent) => {
                this.lastPoppedUrl = ev.url;
            });
            this.sub = this.router.events.subscribe((event: any) => {
                if (event instanceof NavigationStart) {
                    if (event.url !== this.lastPoppedUrl) {
                        this.yScrollStack.push(window.scrollY);
                    }
                } else if (event instanceof NavigationEnd) {
                    if (event.url === this.lastPoppedUrl) {
                        this.lastPoppedUrl = undefined;
                        window.scrollTo(0, this.yScrollStack.pop());
                    } else {
                        window.scrollTo(0, 0);
                    }
                }
            });
            this._router = this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
                elemMainPanel.scrollTop = 0;
                this.navbar.sidebarClose();
            });
            const html = document.getElementsByTagName('html')[0];
            if (window.matchMedia(`(min-width: 960px)`).matches && !Utils.isMac()) {
                let ps = new PerfectScrollbar(elemMainPanel);
                ps = new PerfectScrollbar(elemSidebar);
                html.classList.add('perfect-scrollbar-on');
            } else {
                html.classList.add('perfect-scrollbar-off');
            }

            this.navItems = [
                { type: NavItemType.NavbarLeft, title: 'Dashboard', iconClass: 'fa fa-dashboard' },

                {
                    type: NavItemType.NavbarRight,
                    title: '',
                    iconClass: 'fa fa-bell-o',
                    numNotifications: 5,
                    dropdownItems: [
                        { title: 'Notification 1' },
                        { title: 'Notification 2' },
                        { title: 'Notification 3' },
                        { title: 'Notification 4' },
                        { title: 'Another Notification' }
                    ]
                },
                {
                    type: NavItemType.NavbarRight,
                    title: '',
                    iconClass: 'fa fa-list',

                    dropdownItems: [
                        { iconClass: 'pe-7s-mail', title: 'Messages' },
                        { iconClass: 'pe-7s-help1', title: 'Help Center' },
                        { iconClass: 'pe-7s-tools', title: 'Settings' },
                        'separator',
                        { iconClass: 'pe-7s-lock', title: 'Lock Screen' },
                        { iconClass: 'pe-7s-close-circle', title: 'Log Out' }
                    ]
                },
                { type: NavItemType.NavbarLeft, title: 'Search', iconClass: 'fa fa-search' },

                { type: NavItemType.NavbarLeft, title: 'Account' },
                {
                    type: NavItemType.NavbarLeft,
                    title: 'Dropdown',
                    dropdownItems: [
                        { title: 'Action' },
                        { title: 'Another action' },
                        { title: 'Something' },
                        { title: 'Another action' },
                        { title: 'Something' },
                        'separator',
                        { title: 'Separated link' },
                    ]
                },
                { type: NavItemType.NavbarLeft, title: 'Log out' }
            ];
        });
    }

    ngAfterViewInit() {
        this.runOnRouteChange();
    }

    ngOnDestroy() {
        Utils.disposeModal('#modalET');
        if (this.sub != null) {
            this.sub.unsubscribe();
        }
        if (this._router != null) {
            this._router.unsubscribe();
        }
        if (this.locationSub != null) {
            this.locationSub.unsubscribe();
        }
    }

    runOnRouteChange(): void {
        if (window.matchMedia(`(min-width: 960px)`).matches && !Utils.isMac()) {
            const elemSidebar = <HTMLElement>document.querySelector('.sidebar .sidebar-wrapper');
            const elemMainPanel = <HTMLElement>document.querySelector('.main-panel');
            let ps = new PerfectScrollbar(elemMainPanel);
            ps = new PerfectScrollbar(elemSidebar);
            ps.update();
        }
    }
}
