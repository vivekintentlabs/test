import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import PerfectScrollbar from 'perfect-scrollbar';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AppRoutes } from './sidebar-routes.config';
import { HttpService } from '../services/http.service';
import { ListenerService } from '../services/listener.service';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';

import { School } from '../entities/school';
import { UserInfo } from '../entities/userInfo';

import { Constants } from '../common/constants';
import { Utils } from '../common/utils';
import { environment } from 'environments/environment';

declare const $: any;

@Component({
    selector: 'app-sidebar-cmp',
    templateUrl: 'sidebar.component.html',
    styleUrls: ['sidebar.component.scss']
})

export class SidebarComponent implements OnInit, OnDestroy {
    menuItems: any[];
    school: School;
    debugMode: boolean = Constants.debugMode;
    userInfo: UserInfo = null;
    private ngUnsubScribe = new Subject();
    public brand = environment.brand;

    constructor(
        private router: Router,
        private httpService: HttpService,
        private listenerService: ListenerService,
        private translate: TranslateService
    ) {
        this.listenerService.schoolListStatus().pipe(takeUntil(this.ngUnsubScribe)).subscribe(() => this.ngOnInit());
        this.translate.onLangChange.pipe(takeUntil(this.ngUnsubScribe)).subscribe((event: LangChangeEvent) => {
            this.getMenuItems();
        });
    }

    isMobileMenu() {
        return Utils.isMobileSize();
    }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        if (this.userInfo.isSchoolAdminOrLower) {
            this.httpService.getAuth('schools/get/' + this.userInfo.schoolId).then((school: School) => {
                this.school = school;
                this.getMenuItems();
            });
        } else {
            this.getMenuItems();
        }
    }

    ngOnDestroy() {
        this.ngUnsubScribe.next();
        this.ngUnsubScribe.complete();
    }

    private getMenuItems() {
        let enrolment = '';
        let year = '';
        this.translate.get('et.enrolment').pipe(takeUntil(this.ngUnsubScribe)).subscribe((res: string) => enrolment = res);
        this.translate.get('et.year').pipe(takeUntil(this.ngUnsubScribe)).subscribe((res: string) => year = res);
        const isEnabledAppModule = (this.school && this.school.modules)
            ? Utils.isSchoolModuleEnabled(this.school.modules, Constants.schoolModules.appModule.name)
            : false;
        this.menuItems = AppRoutes.getAppRoutes(this.userInfo, this.debugMode, enrolment, year, isEnabledAppModule);
    }

    showModal() {
        $('#modalET').modal('show');
    }

    updatePS(): void {
        if (window.matchMedia(`(min-width: 960px)`).matches && !Utils.isMac()) {
            const elemSidebar = document.querySelector('.sidebar .sidebar-wrapper') as HTMLElement;
            const ps = new PerfectScrollbar(elemSidebar, { wheelSpeed: 2, suppressScrollX: true });
        }
    }

    userProfile() {
        $('#userProfileModal').modal('show');
        this.listenerService.sidebarToggled();
    }

    showFeedback() {
        $('#feedbackModal').modal('show');
        this.listenerService.sidebarToggled();
    }

    logout() {
        console.log("logging out because clicked logout in the sidebar");
        localStorage.removeItem('token');
        this.httpService.updateCurrentSchoolId(null);
        this.router.navigate(['noAuth/login']);
    }

}
