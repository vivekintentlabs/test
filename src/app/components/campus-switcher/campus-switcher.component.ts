
import {filter} from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';

import { StorageService } from 'app/services/storage.service';

import { Utils } from '../../common/utils';
import { ListenerService } from '../../services/listener.service';
import { StateService } from '../../services/state.service';
import { HttpService } from '../../services/http.service';
import { UserInfo } from '../../entities/userInfo';
import { Subscription } from 'rxjs';
import { Campus } from '../../entities/campus';

import * as _ from 'lodash';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-campus-switcher-cmp',
    templateUrl: 'campus-switcher.component.html',
    styleUrls: ['campus-switcher.component.scss'],
})

export class CampusSwitcherComponent implements OnInit, OnDestroy {
    campuses: Array<Campus | any> = [];
    campus: Campus | any;
    userInfo: UserInfo = null;
    subscrCampusList: Subscription;
    subscrNav: Subscription;
    public showCampusSwitcher: boolean;
    public showUndecided: boolean;
    public disabled: boolean;

    constructor(
        private httpService: HttpService,
        private router: Router,
        private listenerService: ListenerService,
        private ref: ChangeDetectorRef,
        private storageService: StorageService,
        private stateService: StateService,
    ) {
        this.subscrCampusList = this.listenerService.campusListStatus().subscribe(() => { this.onChangeCampuses(); });
        this.subscrNav = this.router.events.pipe(
            filter(event => event instanceof NavigationStart))
            .subscribe((event: NavigationStart) => {
                if (event instanceof NavigationStart) {
                    this.initPath(event.url);
                }
            });
    }

    ngOnInit() {
        if (this.showCampusSwitcher === undefined) {
            this.initPath(window.location.pathname);
        }
        this.getCampuses().then(() => {
            this.updateLocalCampus();
        });
    }

    ngOnDestroy() {
        this.subscrCampusList.unsubscribe();
        this.subscrNav.unsubscribe();
    }

    private getCampuses(): Promise<void> {
        return this.httpService.getAuth('campus/with-extra-data').then((data: any) => {
            this.campuses = data.campuses;
            this.campuses = _.sortBy(this.campuses, ['sequence']);
            const undecidedCampus = _.find(this.campuses, (item: Campus) => item.campusType === Campus.CAMPUS_TYPE_UNDECIDED);
            this.campuses = _.remove(this.campuses, (item: Campus) => item.campusType !== Campus.CAMPUS_TYPE_UNDECIDED);
            this.campuses.push(undecidedCampus);
            return Promise.resolve();
        });
    }

    private initPath(url: string) {
        const temp = url.match(/^[^;]+/);
        switch (temp[0]) {
            case '/dashboard': this.showCampusSwitcher = true; this.showUndecided = true; this.disabled = false; break;
            case `/${environment.localization.enquiriesUrl}/students`: this.showCampusSwitcher = true; this.showUndecided = true; this.disabled = false; break;
            case `/${environment.localization.enquiriesUrl}/students-classic-view`: this.showCampusSwitcher = true; this.showUndecided = true; this.disabled = false; break;
            case `/${environment.localization.enquiriesUrl}/edit-student`: this.showCampusSwitcher = true; this.showUndecided = true; this.disabled = true; break;
            case `/${environment.localization.enquiriesUrl}/add-student`: this.showCampusSwitcher = true; this.showUndecided = true; this.disabled = true; break;
            case `/${environment.localization.enquiriesUrl}/contacts`: this.showCampusSwitcher = true; this.showUndecided = true; this.disabled = false; break;
            case `/${environment.localization.enquiriesUrl}/edit-contact`: this.showCampusSwitcher = true; this.showUndecided = true; this.disabled = true; break;
            case `/${environment.localization.enquiriesUrl}/add-contact`: this.showCampusSwitcher = true; this.showUndecided = true; this.disabled = true; break;
            case '/events/list': this.showCampusSwitcher = true; this.showUndecided = false; this.disabled = false; this.checkUndecided(); break;
            case '/events/edit-event': this.showCampusSwitcher = true; this.showUndecided = false; this.disabled = true; this.checkUndecided(); break;
            case '/events/add-event': this.showCampusSwitcher = true; this.showUndecided = false; this.disabled = true; this.checkUndecided(); break;
            case '/events/personal-tour': this.showCampusSwitcher = true; this.showUndecided = false; this.disabled = false; this.checkUndecided(); break;
            case '/events/edit-personal-tour': this.showCampusSwitcher = true; this.showUndecided = false; this.disabled = true; this.checkUndecided(); break;
            case '/events/add-personal-tour': this.showCampusSwitcher = true; this.showUndecided = false; this.disabled = true; this.checkUndecided(); break;
            case '/analytics/research': this.showCampusSwitcher = true; this.showUndecided = true; this.disabled = false; break;
            case '/analytics/demographic': this.showCampusSwitcher = true; this.showUndecided = true; this.disabled = false; break;
            case `/analytics/${environment.localization.enquiriesUrl}`: this.showCampusSwitcher = true; this.showUndecided = true; this.disabled = false; break;
            case '/analytics/events': this.showCampusSwitcher = true; this.showUndecided = false; this.disabled = false; this.checkUndecided(); break;
            case '/analytics/geographic': this.showCampusSwitcher = true; this.showUndecided = true; this.disabled = false; break;
            case '/analytics/school': this.showCampusSwitcher = true; this.showUndecided = true; this.disabled = false; break;
            case '/admin/year-level': this.showCampusSwitcher = false; this.showUndecided = true; this.disabled = true; break;
            case '/admin/enrolment-target': this.showCampusSwitcher = false; this.showUndecided = true; this.disabled = true; break;
            case '/applications/index': this.showCampusSwitcher = true; this.showUndecided = false; this.disabled = false; break;
            default: this.showCampusSwitcher = true; this.showUndecided = true; this.disabled = true; break;
        }
    }

    private onChangeCampuses() {
        this.getCampuses().then(() => {
            this.userInfo = Utils.getUserInfoFromToken();
            if (this.userInfo.campusId) {
                const userCampus: Campus = _.find(this.campuses, c => c.id === this.userInfo.campusId);
                this.campus = (userCampus) ? userCampus : _.find(this.campuses, c => c.campusType === Campus.CAMPUS_TYPE_MAIN);
                this.campusChanged(this.campus.id);
            } else {
                this.campus = { id: 'all', name: 'All', campusType: 'normal' };
            }
        })
    }

    isMobileMenu() {
        return Utils.isMobileSize();
    };

    campusChanged(campusId: number | string) {
        if (this.userInfo.campusId !== campusId) { // if campus is already not chosen
            this.storageService.resetFilters();
            this.storageService.resetTableStates();
            this.stateService.resetFilter();
            this.httpService.postAuth('users/set-campus', { campusId: (campusId === 'all' ? null : campusId) }).then(() => {
                this.updateLocalCampus();
                this.listenerService.campusListChanged();
                this.listenerService.sidebarToggled();
            }).catch((err) => {
                console.log(err);
            });
        }
    }

    private updateLocalCampus() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.campus = (this.userInfo.campusId) ? this.getCampus(this.userInfo.campusId) : { id: 'all', name: 'All', campusType: 'normal' };
        Utils.DetectChanges(this.ref);
    }

    private getCampus(id: number) {
        const campus: Campus = _.find(this.campuses, c => c.id === id);
        return (campus) ? campus : _.find(this.campuses, c => c.campusType === Campus.CAMPUS_TYPE_MAIN);
    }

    checkUndecided() {
        this.userInfo = Utils.getUserInfoFromToken();
        if (this.userInfo && this.userInfo.campusId !== null && this.campuses.length !== 0) {
            if (Campus.CAMPUS_TYPE_UNDECIDED === _.find(this.campuses, (item: Campus) => item.id === this.userInfo.campusId).campusType) {
                this.campusChanged('all');
            }
        }
    }

}
