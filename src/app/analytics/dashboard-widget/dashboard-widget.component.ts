import { Component, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators/takeUntil';

import { ListenerService } from 'app/services/listener.service';
import { SchoolQuery } from 'app/state/school';

import { IWidget, ISubWidget, IWidgetParams } from '../../common/interfaces';
import { Utils } from 'app/common/utils';

import { UserInfo } from 'app/entities/userInfo';

import * as _ from 'lodash';

@Component({
    selector: 'app-dashboard-widget',
    template: ''
})
export class DashboardWidgetComponent {
    @Input() isDashboard = false;
    @Input() widget: IWidget;

    public loaded = false;
    public widgetParams: IWidgetParams;
    startingMonth$ = this.schoolQuery.startingMonth$;

    protected userInfo: UserInfo;
    protected unsubscribe = new Subject();


    constructor(
        protected listenerService: ListenerService,
        protected schoolQuery: SchoolQuery,
    ) {
        this.listenerService.campusListStatus().pipe(takeUntil(this.unsubscribe)).subscribe(() => this.campusIsChanged());
    }

    isSubWidgetOnDashBoard(id: string) {
        if (this.isDashboard) {
            const subWidget: ISubWidget = _.find(this.widget.subWidgets, (sw: ISubWidget) => sw.id === id);
            return (subWidget && subWidget.status);
        } else {
            return true;
        }
    }

    protected onCampusChanged() { }

    protected campusIsChanged(): void {
        this.userInfo = Utils.getUserInfoFromToken();
        this.onCampusChanged();
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

}
