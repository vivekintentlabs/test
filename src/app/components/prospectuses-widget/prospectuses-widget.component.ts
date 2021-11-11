import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';

import { Constants } from 'app/common/constants';
import { Utils } from 'app/common/utils';
import { Keys } from 'app/common/keys';

import { ActivityLog } from '../../entities/activityLog';
import { Prospectus } from '../../entities/local/prospectus';
import { UserInfo } from '../../entities/userInfo';
import { Campus } from '../../entities/campus';
import { ListenerService } from '../../services/listener.service';
import { Subscription } from 'rxjs';

import * as moment from 'moment';
import * as _ from 'lodash';
import { environment } from 'environments/environment';

declare var $: any;

@Component({
    selector: 'app-prospectuses-widget',
    templateUrl: 'prospectuses-widget.component.html',
    styleUrls: ['prospectuses-widget.component.scss']
})
export class ProspectusesWidgetComponent implements OnInit, OnDestroy {
    campusId: number | string;
    allProspectuses: Array<Prospectus> = [];
    prospectuses: Array<Prospectus> = [];
    lastFiveSentprospectuses: Array<Prospectus> = [];
    totalCount = 0;
    loaded = false;

    campuses: Array<Campus> = [];
    userInfo: UserInfo = null;
    subscrCampusList: Subscription;
    dash = '- -';
    dateDelimiter = Constants.localeFormats.dateDelimiter;
    url = `/analytics/${environment.localization.enquiriesUrl}`;
    private currentYear = moment().year();

    constructor(private httpService: HttpService, private router: Router, private listenerService: ListenerService) {
        this.subscrCampusList = this.listenerService.campusListStatus().subscribe(() => { this.campusChange(); });
    }

    public ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        return this.httpService.getAuth('activity-log/prospectuses/').then((result: any) => {
            this.campuses = result.campuses;
            _.forEach(result.prospectuses, (al: ActivityLog) => {
                const date: moment.Moment = moment(al.date);
                _.forEach(al.student.contactRelationships, (relationship) => {
                    this.allProspectuses.push({
                        year: date.year(),
                        month: date.format(Constants.dateFormats.shortMonth),
                        date: al.date,
                        contact: relationship[Keys.contact],
                        createdAt: date.format(Constants.dateFormats.dayMonthYearSlashed),
                        leadSource: al.leadSource,
                        studentId: al.student.id,
                        campusId: al.student.campusId
                    });
                });
            });
            this.campusChange();
        });
    }

    private filterByYear() {
        this.prospectuses = _.filter(this.allProspectuses, (p: Prospectus) => p.year === this.currentYear);
        this.getLastFive();
    }

    private getLastFive() {
        this.lastFiveSentprospectuses = _.take(_.orderBy(this.prospectuses, p => moment(p.createdAt, Constants.dateFormats.dayMonthYearSlashed).format(), 'desc'), 5);
        this.totalCount = _.filter(this.prospectuses, (p: Prospectus) => p.year === this.currentYear).length;
        this.loaded = true;
    }

    campusChange() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = (this.userInfo.campusId === null) ? 'all' : this.userInfo.campusId;
        this.campusChanged(this.campusId);
    }

    campusChanged(campusId: number | string) {
        this.filterByYear();
        if (campusId !== 'all') {
            this.prospectuses = _.filter(this.prospectuses, (item: Prospectus) => item.campusId === campusId);
            this.totalCount = _.filter(this.prospectuses, (p: Prospectus) => p.year === this.currentYear).length;
        } else {
            this.totalCount = _.filter(this.allProspectuses, (p: Prospectus) => p.year === this.currentYear).length;
        }
        this.getLastFive();
    }

    goToStudent(id: number) {
        this.router.navigate([`/${environment.localization.enquiriesUrl}/edit-student`, { studentId: id }]);
    }

    ngOnDestroy() {
        this.subscrCampusList.unsubscribe();
    }

}
