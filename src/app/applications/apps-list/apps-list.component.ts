
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { BaseTable } from 'app/base-table';

import { Application } from 'app/entities/application';
import { ExportMapping } from 'app/entities/export-mapping';
import { ManagementSystem } from 'app/entities/management-system';
import { School } from 'app/entities/school';
import { UserInfo } from 'app/entities/userInfo';

import { ApplicationStatus, ModalAction } from 'app/common/enums';
import { StartingYearPipe } from 'app/common/pipes/starting-year.pipe';
import { Colors, Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { MergeAppFormTemplateInfoDTO } from 'app/common/dto/merge-app-form-template-info';
import { ApplicationSummaryDoc } from '../interfaces/documents/app-summary-doc';
import { TimeStamp } from '../interfaces/types';
import { ExportApplicationDTO } from 'app/common/dto/export';

import { PageSpinnerService } from 'app/components/page-spinner/page-spinner.service';
import { ExportDialog } from 'app/components/export-dialog/export-dialog.component';
import { CopyPassword } from 'app/components/copy-password/copy-password.component';
import { ApplicationsService } from 'app/applications/applications.service';
import { StorageService } from 'app/services/storage.service';
import { LocaleService } from 'app/services/locale.service';
import { SchoolInfo, SchoolQuery } from 'app/state/school';
import { AppListService } from './state/app-list.service';
import { AppListQuery } from './state/app-list.query';
import { AppListStore } from './state/app-list.store';
import { HttpService } from 'app/services/http.service';
import { ListenerService } from 'app/services/listener.service';

import { environment } from 'environments/environment';

import { SweetAlertResult } from 'sweetalert2';

import * as _ from 'lodash';
import * as moment from 'moment';


interface ApplicationSummaryView {
    id: string;
    exportDate: string;
    applicationId: string;
    updatedAt: TimeStamp;
    isUpdatedApp: boolean;
    studentName: string;
    startingYear: string;
    intakeYearLevel: string;
    applicationStatus: string;
    submittedAt: TimeStamp;
    contactName: string;
    mobilePhone: string;
}

@Component({
    selector: 'apps-list',
    templateUrl: 'apps-list.component.html',
    providers: [
        AppListService,
        AppListQuery,
        AppListStore
    ]
})

export class AppsListComponent extends BaseTable<ApplicationSummaryView> implements OnInit, OnDestroy {
    public tableId = 'applicationsListTable';

    public statusInProgress = ApplicationStatus.InProgress;
    public tooltipText = `Please select at least 1 ${ApplicationStatus.Submitted} application`;
    public school: School = null;

    private startingYearPipe: StartingYearPipe;
    userInfo: UserInfo = null;
    formId: string;
    formTemplates: MergeAppFormTemplateInfoDTO[] = [];
    applicationMapping: Application[] = [];
    startingMonth: number;
    managementSystem: ManagementSystem;
    dateFormat = Constants.localeFormats.date;
    private unsubscribe = new Subject();

    exportMapping: ExportMapping;
    selectedInProgressApplications: ApplicationSummaryView[] = [];
    selectedNotInProgressApplicationIds: string[] = [];
    campusId: number | 'all';

    constructor(
        private router: Router,
        private appsService: ApplicationsService,
        private localeService: LocaleService,
        storageService: StorageService,
        private pageSpinnerService: PageSpinnerService,
        private schoolQuery: SchoolQuery,
        private modalService: NgbModal,
        private platformLocation: PlatformLocation,
        private httpService: HttpService,
        private listenerService: ListenerService,
        private appListService: AppListService,
        private appListQuery: AppListQuery,
    ) {
        super(storageService);
        this.listenerService.campusListStatus().pipe(takeUntil(this.unsubscribe)).subscribe(() => this.campusChange());
        this.displayedColumns = [
            'select', 'exportInfo', 'updatedAt', 'studentName', 'startingYear', 'intakeYearLevel',
            'applicationStatus', 'submittedAt', 'contactName', 'mobilePhone', 'actions'
        ];
        this.startingYearPipe = new StartingYearPipe();
    }

    public ngOnInit(): Promise<void> {
        this.appListQuery.appListData$.pipe(takeUntil(this.unsubscribe)).subscribe((appSummaries: ApplicationSummaryDoc[]) => {
            this.buildTable(appSummaries);
        });
        this.school = this.appsService.getSchool();
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = this.userInfo.campusId || 'all';
        this.schoolQuery.school$.pipe(takeUntil(this.unsubscribe)).subscribe((school: SchoolInfo) => {
            this.managementSystem = school.managementSystem;
        });
        this.schoolQuery.startingMonth$.pipe(takeUntil(this.unsubscribe)).subscribe((i: number) => this.startingMonth = i);
        if (this.userInfo.isSysAdmin()) {
            this.displayedColumns.splice(this.displayedColumns.length - 1, 0, 'applicationId');
        }
        return Promise.all([
            this.appsService.getFormTemplates().then((formTemplates: MergeAppFormTemplateInfoDTO[]) => {
                this.formTemplates = formTemplates;
                this.formId = _.head(formTemplates).applicationId;
            }),
            this.appsService.getApplications().then((applicationMapping: Application[]) => {
                this.applicationMapping = applicationMapping;
            }),
            this.httpService.getAuth(`export/mappings/${this.managementSystem.format}/${ExportMapping.TYPE_APPLY}`, false).then((data: ExportMapping) => {
                this.exportMapping = data;
            }).catch(() => { this.exportMapping = null; })
        ]).then(() => {
            this.getFillableFormSummaries();
        });
    }

    campusChange() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = this.userInfo.campusId || 'all';
        this.pageSpinnerService.display(this.getFillableFormSummaries());
        this.resetSearchText();
    }

    openUpdatedApp(applicationId: string): void {
        window.open(`${this.formId}/fillable-forms/${applicationId}?type=active`, '_blank');
    }

    edit(appSummary: ApplicationSummaryDoc): void {
        if (appSummary.applicationStatus !== this.statusInProgress) {
            this.router.navigate([`${this.appsService.BASE_URL}/${this.formId}/fillable-forms/update`, appSummary.applicationId]);
        }
    }

    preview(appSummary: ApplicationSummaryDoc): void {
        if (appSummary.applicationStatus !== this.statusInProgress) return;
        this.router.navigate([`${this.appsService.BASE_URL}/${this.formId}/fillable-forms/${appSummary.applicationId}/preview`]);
    }

    getFillableFormSummaries(): Promise<void> {
        return this.appsService.getFillableFormSummaries(this.formId).then((appSummaries: ApplicationSummaryDoc[]) => {
            return this.appListService.set(appSummaries);
        }).catch(console.error);
    }

    deleteSelected(): Promise<boolean> {
        return Utils.multipleDeletedQuestion(this.visibleSelectedCount, '<br> Student Status will be reverted back to the pre-application value').then((result: SweetAlertResult) => {
            if (result?.value) {
                this.pageSpinnerService.display(this.deleteApplications(this.getVisibleSelectedIds()), 'Application is being deleted...');
            } else {
                return Promise.resolve(false);
            }
        });
    }

    delete(appSummary: ApplicationSummaryDoc): Promise<boolean> {
        return Utils.deletedQuestion('<br> Student Status will be reverted back to the pre-application value').then((result: SweetAlertResult) => {
            if (result?.value) {
                this.pageSpinnerService.display(this.deleteApplications([appSummary.applicationId]), 'Applications are being deleted...');
            } else {
                return Promise.resolve(false);
            }
        });
    }

    private deleteApplications(applicationIds: string[]): Promise<void> {
        return this.appsService.deleteFillableForms(applicationIds, this.formId).then(() => {
            this.deselectItems(applicationIds);
            this.appListService.remove(applicationIds);
            Utils.showSuccessNotification('Application(s) successfully deleted.');
        }).catch((err) => {
            console.log(err);
        });
    }

    protected buildTable(appSummaries): void {
        const dataForTable: ApplicationSummaryView[] = [];
        _.forEach(appSummaries, (appSummary: ApplicationSummaryDoc) => {
            dataForTable.push({
                id: appSummary.applicationId,
                exportDate: this.getExportDate(appSummary.applicationId),
                applicationId: appSummary.applicationId,
                updatedAt: appSummary.updatedAt,
                isUpdatedApp: (appSummary.submittedAt && appSummary.submittedAt._seconds < appSummary.updatedAt._seconds) ? true : false,
                studentName: `${appSummary.studentApplicationSummaryInfo.firstName} ${appSummary.studentApplicationSummaryInfo.lastName}`,
                startingYear: this.startingYearPipe.transform(appSummary.studentApplicationSummaryInfo.startingYear, this.startingMonth, true),
                intakeYearLevel: appSummary.studentApplicationSummaryInfo.intakeYearLevel || '',
                applicationStatus: appSummary.applicationStatus || '',
                submittedAt: appSummary.submittedAt,
                contactName: `${appSummary.contactApplicationSummaryInfo.firstName} ${appSummary.contactApplicationSummaryInfo.lastName}`,
                mobilePhone: appSummary.contactApplicationSummaryInfo.mobilePhone || ''
            });
        });
        super.buildTable(dataForTable);
        this.dataSource.sortingDataAccessor = (data: ApplicationSummaryView, sortHeaderId: string) => {
            switch (sortHeaderId) {
                case 'exportInfo': return Utils.getUnixTimestamp(_.get(data, 'exportDate'));
                case 'updatedAt':
                case 'submittedAt':
                    return data[sortHeaderId]?._seconds;
                default: return _.toLower(_.get(data, sortHeaderId));
            }
        };
        this.updateTable(dataForTable);
    }

    export(): void {
        const appsExportDialogRef = this.modalService.open(ExportDialog, Constants.ngbModalMd);
        appsExportDialogRef.componentInstance.managementSystem = this.managementSystem;
        appsExportDialogRef.componentInstance.exportMapping = this.exportMapping;
        appsExportDialogRef.componentInstance.selectedInProgressApplicationsCount = this.selectedInProgressApplications.length;
        appsExportDialogRef.componentInstance.visibleSelectedCount = this.visibleSelectedCount;
        appsExportDialogRef.result.then((res: { action: ModalAction, password?: string }) => {
            switch (res.action) {
                case ModalAction.Done:
                    const promise = this.httpService.postAuth('export/application',
                        {
                            formId: this.formId,
                            password: res.password,
                            exportMapping: this.exportMapping,
                            applicationIds: this.selectedNotInProgressApplicationIds,
                            managementSystemName: this.managementSystem.name
                        }
                    ).then((exportDTO: ExportApplicationDTO) => {
                        if (this.exportMapping.canAddPassword) {
                            const copyPasswordRef = this.modalService.open(CopyPassword, Constants.ngbModalMd);
                            copyPasswordRef.componentInstance.password = exportDTO.data;
                        }
                        if (this.exportMapping.transferMethod === ExportMapping.TRANSFER_METHOD_DIRECT_DOWNLOAD) {
                            const studentName = (this.visibleSelectedCount - this.selectedNotInProgressApplicationIds.length) === 1
                                ? this.getStudentName(this.selectedNotInProgressApplicationIds[0]) : '';
                            this.directDownload(exportDTO.data, studentName);
                        }
                        this.afterExport(exportDTO.applications);
                        this.deselectItems<string>(this.getVisibleSelectedIds<string>());
                    });

                    this.pageSpinnerService.display(promise, 'Exporting...');
                    break;
                default: break;
            }
        });
        this.platformLocation.onPopState(() => {
            appsExportDialogRef.close({ action: ModalAction.LeavePage });
        });
    }

    download(): void {
        this.appsService.downloadDocuments(this.formId, this.selectedNotInProgressApplicationIds).then((res) => {
            if (res.action === ModalAction.Done) {
                this.deselectItems<string>(this.getVisibleSelectedIds<string>());
            }
        })
    }

    private directDownload(data: any, studentName: string): void {
        const name = studentName ?
            `${studentName}_${moment().format(this.localeService.getFormat(Constants.localeFormats.date))}` :
            `${environment.brand.exportFilenamePrefix}_Export_${this.managementSystem.name}_` + moment().format(this.localeService.getFormat(Constants.localeFormats.date));
        saveAs(new Blob([data], { type: 'text/xml' }), Utils.sanitize(name));
    }

    private afterExport(applications: Application[]): void {
        if (_.isArray(applications)) {
            _.forEach(applications, app => {
                const application = _.find(this.dataSource.data, i => i.applicationId === app.id);
                if (application) {
                    application.exportDate = moment(app.exportDate).format(this.localeService.getFormat(Constants.localeFormats.date));
                }
            });
        }
    }

    private getExportDate(applicationId: string): string {
        const exportDate = _.find(this.applicationMapping, app => app.id === applicationId)?.exportDate;
        if (!exportDate) return '';
        return moment(exportDate).format(this.localeService.getFormat(this.dateFormat));
    }

    private getStudentName(applicationId: string): string {
        const applicationSummary = _.find(this.appListQuery.appListData, (appSummary: ApplicationSummaryDoc) => appSummary.applicationId === applicationId);
        return applicationSummary ? `${applicationSummary.studentApplicationSummaryInfo.firstName}_${applicationSummary.studentApplicationSummaryInfo.lastName}` : '';
    }

    onChecked(): void {
        const applicationIds = this.getVisibleSelectedIds<string>();
        const selectedApplications = _.filter(this.dataSource.data, (as: ApplicationSummaryView) => applicationIds.includes(as.id));
        this.selectedInProgressApplications = _.filter(selectedApplications, (as: ApplicationSummaryView) => as.applicationStatus === ApplicationStatus.InProgress);
        this.selectedNotInProgressApplicationIds = _.map(_.differenceBy(selectedApplications, this.selectedInProgressApplications), 'applicationId');
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

}
