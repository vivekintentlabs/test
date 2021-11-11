import { Component, AfterViewInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { HttpService } from '../../services/http.service';

import { Dashboard } from '../../entities/dashboard';
import { School } from 'app/entities/school';

import { IWidget, ISubWidget } from '../../common/interfaces';
import { Utils } from '../../common/utils';
import { PageLeaveReason } from '../../common/enums';

import * as _ from 'lodash';

@Component({
    selector: 'app-dashboard-config',
    templateUrl: 'dashboard-config.component.html',
    styleUrls: ['./dashboard-config.component.scss']
})
export class DashboardConfigComponent implements AfterViewInit {

    dashboard: Dashboard;
    widgets: Array<IWidget>;
    pristine = true;
    private submitted = false;
    school: School;
    promiseForBtn: Promise<any>;

    constructor(private httpService: HttpService) { }

    ngAfterViewInit() {
        this.httpService.getAuth('dashboard').then((data: Dashboard) => {
            this.dashboard = data;
            this.school = data.school;
            this.widgets = data.dashboardConfig;
        });
    }

    dropWidget(event: CdkDragDrop<{ sequence: number, name: string }>) {
        moveItemInArray(this.widgets, event.previousIndex, event.currentIndex);
    }

    dropSubWidget(event: CdkDragDrop<{ sequence: number, name: string }>, widget: any) {
        moveItemInArray(widget.subWidgets, event.previousIndex, event.currentIndex);
    }

    statusChanged() {
        this.pristine = false;
    }

    statusSubWChanged(widget: IWidget) {
        this.pristine = false;
        if (widget.status) {
            const length = _.filter(widget.subWidgets, (sw: ISubWidget) => sw.status === !widget.status).length;
            if (length === widget.subWidgets.length) {
                return _.find(this.widgets, (i: IWidget) => i.id === widget.id).status = false;
            }
        }
    }

    public doSubmit(): Promise<boolean> {
        if (!this.pristine) {
            return this.submit().then(() => {
                return Promise.resolve(true);
            }).catch((err) => {
                console.log(err);
                this.submitted = false;
                return false;
            });
        } else {
            return Promise.resolve(true);
        }
    }

    private submit(): Promise<void> {
        this.submitted = true;
        this.dashboard.dashboardConfig = _.cloneDeep(this.widgets);
        return this.promiseForBtn = this.httpService.postAuth('dashboard/update', this.dashboard).then(() => {
            this.pristine = true;
            this.submitted = false;
            Utils.showSuccessNotification();
        });
    }

    canDeactivate(): Promise<boolean> {
        return Utils.canDeactivate((!this.pristine) ? 1 : 0, this.submitted, (!this.pristine)).then((can) => {
            if (can === PageLeaveReason.save) {
                return this.doSubmit();
            } else if (can === PageLeaveReason.goBack) {
                return false;
            } else if (can === PageLeaveReason.doNotSave) {
                return true;
            }
        });
    }

    isVisible(w: IWidget) {
        let isVisible = true;
        if (w.id === 'international') {
            isVisible = (this.school.hasInternationals) ? true : false;
        } else if (w.id === 'student_type') {
            isVisible = (this.school.isBoardingEnabled) ? true : false;
        } else if (w.id === 'country_of_origin') {
            isVisible = (this.school.hasInternationals) ? true : false;
        }
        return isVisible;
    }
}
