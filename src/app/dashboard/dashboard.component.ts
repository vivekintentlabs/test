import { Component, OnDestroy, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { HttpService } from '../services/http.service';
import { ListenerService } from '../services/listener.service';

import { Utils } from '../common/utils';

import { UserInfo } from '../entities/userInfo';
import { Dashboard } from '../entities/dashboard';
import { IWidget, ISubWidget } from '../common/interfaces';

import * as _ from 'lodash';
@Component({
    selector: 'app-dashboard',
    templateUrl: 'dashboard.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['dashboard.component.scss']
})
export class DashboardComponent implements AfterViewInit, OnDestroy {

    campusId: number | string;
    subscrCampusList: Subscription;
    userInfo: UserInfo = null;
    widgets: IWidget[];

    constructor(private listenerService: ListenerService, private httpService: HttpService) {
        this.subscrCampusList = this.listenerService.campusListStatus().subscribe(() => { this.getUserInfo(); });
    }

    ngAfterViewInit() {
        this.getUserInfo();
        this.httpService.getAuth('dashboard').then((data: Dashboard) => {
            this.widgets = data.dashboardConfig;
        });
    }

    ngOnDestroy() {
        this.subscrCampusList.unsubscribe();
    }

    getUserInfo() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = (this.userInfo.campusId == null) ? 'all' : this.userInfo.campusId;
    }

    isWidgetOnDashBoard(widgetId: string) {
        const widget: IWidget = this.getWidget(widgetId);
        return (widget && widget.status);
    }

    isSubWidgetOnDashBoard(widgetId: string, id: string) {
        const widget: IWidget = this.getWidget(widgetId);
        const subWidget: ISubWidget = _.find(widget.subWidgets, (sw: ISubWidget) => sw.id === id)
        return (widget && widget.status && subWidget && subWidget.status);
    }

    getWidget(widgetId: string) {
        return _.find(this.widgets, (w: IWidget) => w.id === widgetId);
    }

}
