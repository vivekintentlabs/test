import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { HttpService } from 'app/services/http.service';
import { ListenerService } from 'app/services/listener.service';
import { StorageService } from 'app/services/storage.service';
import { StateService } from 'app/services/state.service';
import { LocaleService } from 'app/services/locale.service';

import { Utils } from 'app/common/utils';

import { UserInfo } from 'app/entities/userInfo';
import { School } from 'app/entities/school';

import * as _ from 'lodash';

@Component({
    selector: 'app-school-switcher-cmp',
    templateUrl: 'school-switcher.component.html',
    styleUrls: ['school-switcher.component.scss'],
})

export class SchoolSwitcherComponent implements OnInit, OnDestroy {
    userInfo: UserInfo = null;
    schools: Array<School> = [];
    school: School = null;

    subscrSchoolList: Subscription;

    constructor(
        private httpService: HttpService,
        private router: Router,
        private listenerService: ListenerService,
        private ref: ChangeDetectorRef,
        private stateService: StateService,
        private storageService: StorageService,
        private translateService: TranslateService,
        private localeService: LocaleService
    ) {
        this.subscrSchoolList = this.listenerService.schoolListStatus().subscribe(() => { this.getInfo(); });
    }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.httpService.updateCurrentSchoolId(this.userInfo.schoolId);
        this.getInfo();
    }

    ngOnDestroy() {
        this.subscrSchoolList.unsubscribe();
    }

    private getInfo(): Promise<any> {
        if (this.userInfo.isSysAdmin()) {
            this.userInfo = Utils.getUserInfoFromToken();
            return this.httpService.getAuth('schools/list').then((allSchools: School[]) => {
                this.schools = _.sortBy(allSchools, s => _.lowerCase(s.name));
                this.getUsersSchool();
                Utils.DetectChanges(this.ref);
            });
        }
    }

    private getUsersSchool() {
        this.school = null;
        this.school = _(this.schools).find((school) => school.id === this.userInfo.schoolId);
    }

    isMobileMenu() {
        return Utils.isMobileSize();
    };

    schoolChanged(schoolId: number) {
        if (this.userInfo.schoolId !== schoolId) {
            this.storageService.resetFilters();
            this.storageService.resetTableStates();
            // TODO: stateService should be removed in the future
            this.stateService.resetFilter();
            this.setUserSchoolAndRefreshToken(schoolId).then(() => {
                this.setSchoolLocale();
                this.getInfo().then(() => {
                    this.router.navigate(['dashboard/sendback']).then(() => {
                        this.router.navigate(['dashboard']);
                        this.listenerService.eventListChanged();
                        this.listenerService.campusListChanged();
                        this.listenerService.schoolListChanged();
                        Utils.resetSession();
                    });
                });
            }).catch((err) => {
                console.log(err);
            });
        } else {
            console.log('school is already chose');
        }
    }

    private setSchoolLocale() {
        this.translateService.use(this.localeService.getCurrentLocale());
    }

    private setUserSchoolAndRefreshToken(schoolId: number): Promise<void> {
        return this.httpService.postAuth('users/set-school', { schoolId: schoolId }).then(() => {
            this.userInfo = Utils.getUserInfoFromToken();
            this.httpService.updateCurrentSchoolId(schoolId);
            return Promise.resolve();
        });
    }

}
