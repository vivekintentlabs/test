import { Component, Input, OnInit } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Constants } from 'app/common/constants';
import { ApplicationStatus, ModalAction, StudentStatusCode } from 'app/common/enums';
import { Colors, Utils } from 'app/common/utils';
import { StudentStatus } from 'app/entities/student-status';
import { TimeStamp } from 'app/applications/interfaces/types';

import { ApplicationsService } from 'app/applications/applications.service';
import { FillableAppFormService } from 'app/applications/apps-edit-fillableform/state/fillable-app-form.service';
import { FillableAppFormQuery } from 'app/applications/apps-edit-fillableform/state/fillable-app-form.query';

import { ApplicationFinalizedDialog } from '../apps-finalized-dialog/apps-finalized-dialog.component';

import * as _ from 'lodash';

interface AppStatusViewableState {
    name: ApplicationStatus;
    visited: boolean;
    allowed: boolean;
    loading: boolean;
    allowedStates: ApplicationStatus[];
    msg?: string;
}

@Component({
    selector: 'apps-progress-status',
    templateUrl: 'apps-progress-status.component.html',
    styleUrls: ['apps-progress-status.component.scss']
})

export class AppsProgressStatusComponent implements OnInit {
    finalized = ApplicationStatus.Finalized;
    appStates: AppStatusViewableState[] = [
        { name: ApplicationStatus.InProgress, visited: false, allowed: false, loading: false, allowedStates: [] },
        { name: ApplicationStatus.Submitted, visited: false, allowed: false, loading: false, allowedStates: [ApplicationStatus.InReview] },
        {
            name: ApplicationStatus.InReview, visited: false, allowed: false, loading: false,
            allowedStates: [ApplicationStatus.Submitted, ApplicationStatus.Pending, ApplicationStatus.Finalized]
        },
        {
            name: ApplicationStatus.Pending, visited: false, allowed: false, loading: false,
            allowedStates: [ApplicationStatus.Submitted, ApplicationStatus.InReview, ApplicationStatus.Finalized]
        },
        { name: this.finalized, visited: false, allowed: false, loading: false, allowedStates: [], msg: Constants.incompleteFormText }
    ];
    @Input() appStatus: ApplicationStatus;
    @Input() docId: string;
    @Input() formId: string;
    curAppState: AppStatusViewableState;
    studentStatusAppCompleted: StudentStatus;
    isValidForm$ = this.fillableAppFormQuery.isValid$;

    constructor(
        private appsService: ApplicationsService,
        private modalService: NgbModal,
        private platformLocation: PlatformLocation,
        private fillableAppFormService: FillableAppFormService,
        private fillableAppFormQuery: FillableAppFormQuery,
    ) { }

    /**
     * Inits component data, a native callback method
     * @return {void}
     */
    ngOnInit() {
        this.curAppState = _.find(this.appStates, (c: AppStatusViewableState) => c.name === this.appStatus);
        this.curAppState.visited = true;
        this.setVisitedStatuses();
        this.setAllowed();
        return this.appsService.getStudentStatusByCode(StudentStatusCode.student_status_app_completed)
            .then((studentStatus: StudentStatus) => {
                this.studentStatusAppCompleted = studentStatus;
            });
    }

    updateAppStatus(appState: AppStatusViewableState) {
        if (this.curAppState.loading) {
            return;
        }
        if (appState.name === this.finalized) {
            return this.openFinalizedDialog(appState);
        }
        const originalAppState = this.curAppState;
        this.curAppState = appState;
        this.setVisitedStatuses();
        this.curAppState.loading = true;
        const model = this.fillableAppFormService.getModel();
        return this.appsService.updateFillableFormStatus(this.docId, this.formId, this.curAppState.name, model)
            .then((res) => {
                this.curAppState.loading = false;
                this.setAllowed();
                this.fillableAppFormService.resetFormChanged();
                this.fillableAppFormService.setAppStatus(appState.name);
                this.fillableAppFormService.setAppUpdatedAt(res.updatedAt);
                Utils.showNotification('Saving Application Changes', Colors.success);
                return res;
            })
            .catch(err => {
                this.rollbackCurrentAppState(originalAppState);
                return err;
            });
    }

    private openFinalizedDialog(appState: AppStatusViewableState) {
        const originalAppState = this.curAppState;
        this.curAppState = appState;
        this.setVisitedStatuses();
        this.curAppState.loading = true;
        const modalApplicationFinalizedRef = this.modalService.open(ApplicationFinalizedDialog, Constants.ngbModalLg);
        modalApplicationFinalizedRef.componentInstance.docId = this.docId;
        modalApplicationFinalizedRef.componentInstance.formId = this.formId;
        modalApplicationFinalizedRef.componentInstance.appStateName = appState.name;
        modalApplicationFinalizedRef.componentInstance.studentStatusAppCompleted = this.studentStatusAppCompleted;
        modalApplicationFinalizedRef.componentInstance.model = this.fillableAppFormService.getModel();
        modalApplicationFinalizedRef.result.then((res: { action: ModalAction, updatedAt: TimeStamp }) => {
            switch (res.action) {
                case ModalAction.Done:
                    this.curAppState.loading = false;
                    this.setAllowed();
                    this.fillableAppFormService.resetFormChanged();
                    this.fillableAppFormService.setAppStatus(ApplicationStatus.Finalized);
                    this.fillableAppFormService.setAppUpdatedAt(res.updatedAt);
                    Utils.showNotification('Saving Application Changes', Colors.success);
                    break;
                case ModalAction.Cancel:
                    this.rollbackCurrentAppState(originalAppState);
                    break;
                default:
                    break;
            }
        }).catch((err) => modalApplicationFinalizedRef.dismiss(err));
        this.platformLocation.onPopState(() => {
            this.rollbackCurrentAppState(originalAppState);
            modalApplicationFinalizedRef.close({ action: ModalAction.LeavePage });
        });
    }

    private rollbackCurrentAppState(originalAppState: AppStatusViewableState) {
        this.curAppState.loading = false;
        this.curAppState = originalAppState;
        this.setVisitedStatuses();
    }

    private setAllowed() {
        this.appStates.forEach(appState => {
            appState.allowed = this.curAppState.allowedStates.indexOf(appState.name) !== -1;
        });
    }

    private setVisitedStatuses() {
        const reachedIndex = _.findIndex(this.appStates, state => state.name === this.curAppState.name);
        this.appStates.forEach((appState, i) => {
            appState.visited = i <= reachedIndex;
        });
    }
}
