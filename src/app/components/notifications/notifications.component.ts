import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { LocaleService } from 'app/services/locale.service';
import { ListenerService } from 'app/services/listener.service';
import { HttpService } from 'app/services/http.service';

import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { UserInfo } from '../../entities/userInfo';
import { SubTour } from 'app/entities/sub-tour';
import { Event } from 'app/entities/event';

import * as _ from 'lodash';

@Component({
    selector: 'app-notifications-cmp',
    templateUrl: 'notifications.component.html',
})
export class NotificationsComponent implements OnInit, OnDestroy {
    userInfo: UserInfo = null;
    capacityEvents: Array<any>;
    capacitySubTours: Array<SubTour>;
    notifyCount: number = null;

    subscrCampusList: Subscription;
    subscrCapacityList: Subscription;

    constructor(
        private httpService: HttpService,
        private router: Router,
        private listenerService: ListenerService,
        private localeService: LocaleService
    ) {
        this.subscrCampusList = this.listenerService.campusListStatus().subscribe(() => { this.getCapacity(); });
        this.subscrCapacityList = this.listenerService.capacityListStatus().subscribe(() => { this.getCapacity(); });
    }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.getCapacity();
    }

    ngOnDestroy() {
        this.subscrCampusList.unsubscribe();
        this.subscrCapacityList.unsubscribe();
    }

    private getCapacity() {
        this.capacityEvents = [];
        this.capacitySubTours = [];
        if (this.userInfo.isSysAdmin() || this.userInfo.isSchoolAdmin() || this.userInfo.isSchoolEditor()) {
            return this.httpService.getAuth('events/capacity').then((data: Event[]) => {
                _.forEach(data, (event: Event) => {
                    if (event.isFull) {
                        event.alert = 'Your '
                            + event['schoolTour.name'] + ' on '
                            + this.localeService.transformLocaleDate(event.date, Constants.localeFormats.dateDelimiter)
                            + ' is at capacity';
                        this.capacityEvents.push(event);
                    } else if (event.isAlmostFull && !event.isFull) {
                        event.alert = 'Your '
                            + event['schoolTour.name'] + ' on '
                            + this.localeService.transformLocaleDate(event.date, Constants.localeFormats.dateDelimiter)
                            + ' is almost full';
                        this.capacityEvents.push(event);
                    }
                })
            })
            .then(() => {
                return this.httpService.getAuth('events/null/sub-tours/capacity').then((res: SubTour[]) => {
                    _.forEach(res, (st: SubTour) => {
                        if (st.isFull) {
                            st.alert = `Your ${st.event.schoolTour.name}: ${st.name} on
                             ${this.localeService.transformLocaleDate(st.event.date, Constants.localeFormats.dateDelimiter)}
                             is at capacity`;
                            this.capacitySubTours.push(st);
                        }
                    });
                });
            });
        }
    }

    isMobileMenu() {
        return Utils.isMobileSize();
    };

    editEvent(event: any) {
        this.router.navigate(['dashboard/sendback']).then(() => {
            this.router.navigate(['/events/edit-event', { eventId: event.id, campusId: event.campusId }]);
            _.remove(this.capacityEvents, (item: any) => item.id === event.id);
        });
    }

    editSubTourEvent(subTour: SubTour) {
        this.router.navigate(['dashboard/sendback']).then(() => {
            this.router.navigate(['/events/edit-event', { eventId: subTour.eventId }]);
            _.remove(this.capacitySubTours, (item: SubTour) => item.id === subTour.id);
        });
    }

}
