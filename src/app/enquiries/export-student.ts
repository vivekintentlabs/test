import { Injectable } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { HttpService } from '../services/http.service';
import { LocaleService } from '../services/locale.service';

import { Utils } from '../common/utils';
import { Constants } from '../common/constants';
import { ExportStudentDTO } from 'app/common/dto/export';

import { ManagementSystemCode, ModalAction } from '../common/enums';

import { Student } from 'app/entities/student';
import { ManagementSystem } from 'app/entities/management-system';
import { CustomHttpParams } from 'app/entities/custom-http-params';
import { ExportMapping } from 'app/entities/export-mapping';

import { environment } from 'environments/environment';

import { CopyPassword } from 'app/components/copy-password/copy-password.component';
import { ExportDialog } from 'app/components/export-dialog/export-dialog.component';
import { PageSpinnerService } from 'app/components/page-spinner/page-spinner.service';

import { saveAs } from 'file-saver';

import * as _ from 'lodash';
import * as moment from 'moment';

@Injectable()
export class ExportStudent {

    constructor(
        private httpService: HttpService,
        private localeService: LocaleService,
        private modalService: NgbModal,
        private platformLocation: PlatformLocation,
        private pageSpinnerService: PageSpinnerService,
        ) { }

    private doExport2XML(selectedIds: number[], data: any, managementSystem: ManagementSystem): Promise<Student[]> {
        return this.httpService.postAuth('export-students/set-students-exported-status', { ids: selectedIds }).then((students: Student[]) => {
            let name = '';
            const size = students.length;
            if (size > 1) {
                name = this.determineFileName(true, null, managementSystem);
            } else if (size === 1) {
                const student: Student = _.head(students);
                name = `${student.firstName}_${student.lastName}_${moment().format(this.localeService.getFormat(Constants.localeFormats.date))}`;
            }
            saveAs(new Blob([data], { type: 'text/xml' }), Utils.sanitize(name));
            return Promise.resolve(students);
        });
    }

    public export2XML(managementSystem: ManagementSystem, studentParams: CustomHttpParams): Promise<Student[]> {
        studentParams = studentParams.set('fileFormat', 'xml');
        return this.httpService.getAuth(`export-students?${Utils.toStringEncoded(studentParams)}`)
            .then((exportResult: { data: any, missingSynCodeFields: string[], ids: number[] }) => {
                if (exportResult.missingSynCodeFields.length > 0) {
                    return Utils.missingCodeDialog(true, exportResult.missingSynCodeFields).then((result) => {
                        if (result && result.value) {
                            return this.doExport2XML(exportResult.ids, exportResult.data, managementSystem);
                        } else {
                            return Promise.resolve([]);
                        }
                    });
                } else {
                    return this.doExport2XML(exportResult.ids, exportResult.data, managementSystem);
                }
            });
    }

    public export2CSV(
        isExport: boolean, managementSystem: ManagementSystem, studentParams: CustomHttpParams, isBackup: boolean
    ): Promise<Student[]> {
        if (isBackup) {
            studentParams = new CustomHttpParams().set('isBackup', 'true')
        }
        studentParams = studentParams.set('fileFormat', 'csv');
        return this.httpService.getAuth(`export-students?${Utils.toStringEncoded(studentParams)}`).then((exportResult: any) => {
            if (exportResult.missingSynCodeFields.length > 0) {
                return Utils.missingCodeDialog(isExport, exportResult.missingSynCodeFields).then((result) => {
                    if (result && result.value) {
                        return this.downloadOrExportCsvFile(exportResult.data, isExport, exportResult.ids, managementSystem);
                    } else {
                        return Promise.resolve([]);
                    }
                });
            } else {
                return this.downloadOrExportCsvFile(exportResult.data, isExport, exportResult.ids, managementSystem);
            }
        });
    }

    private downloadOrExportCsvFile(
        data: string, isExport: boolean, studentIds: number[], managementSystem: ManagementSystem
    ): Promise<Student[]> {
        const fileName = this.determineFileName(isExport, studentIds, managementSystem);
        if (isExport) {
            return this.httpService.postAuth('export-students/set-students-exported-status', {
                ids: studentIds
            }).then((students: Student[]) => {
                Utils.export2Csv(data, fileName);
                return Promise.resolve(students);
            });
        } else {
            Utils.export2Csv(data, fileName);
            return Promise.resolve([]);
        }
    }

    public determineFileName(isExport: boolean, studentIds: number[], managementSystem: ManagementSystem): string {
        const fileNameStr = (isExport)
            ? ('Export_' + (managementSystem.id === ManagementSystemCode.synergetic ? managementSystem.name : Constants.schoolManagementSystem) + '_')
            : ((!studentIds) ? 'Backup_' : '');
        return `${environment.brand.exportFilenamePrefix}_` + fileNameStr + moment().format(this.localeService.getFormat(Constants.localeFormats.date));
    }

    exportByMapping(exportMapping: ExportMapping, managementSystem: ManagementSystem, studentIds: number[]): Promise<Student[]> {
        return new Promise((resolve, reject) => {
            try {
                const exportDialogRef = this.modalService.open(ExportDialog, Constants.ngbModalMd);
                exportDialogRef.componentInstance.managementSystem = managementSystem;
                exportDialogRef.componentInstance.exportMapping = exportMapping;
                this.platformLocation.onPopState(() => {
                    exportDialogRef.close({ action: ModalAction.LeavePage });
                });
                exportDialogRef.result.then((res: { action: ModalAction, password?: string }) => {
                    if (res.action === ModalAction.Done) {
                        const promise = this.httpService.postAuth('export/student',
                            { password: res.password, exportMapping, studentIds, managementSystemName: managementSystem.name }
                        ).then((exportDTO: ExportStudentDTO) => {
                            if (exportMapping.canAddPassword) {
                                const copyPasswordRef = this.modalService.open(CopyPassword, Constants.ngbModalMd);
                                copyPasswordRef.componentInstance.password = exportDTO.data;
                            }
                            if (exportMapping.transferMethod === ExportMapping.TRANSFER_METHOD_DIRECT_DOWNLOAD) {
                                const studentName = (exportDTO.students.length > 1) ? '' : `${exportDTO.students[0].firstName}_${exportDTO.students[0].lastName}`;
                                this.directDownload(exportDTO.data, studentName, managementSystem.name);
                            }
                            resolve(exportDTO.students);
                        });
                        this.pageSpinnerService.display(promise, 'Exporting...');
                    } else {
                        resolve([]);
                    }
                });
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    private directDownload(data: any, studentName: string, managementSystemName: string): void {
        const name = studentName ?
            `${studentName}_${moment().format(this.localeService.getFormat(Constants.localeFormats.date))}` :
            `${environment.brand.exportFilenamePrefix}_Export_${managementSystemName}_` + moment().format(this.localeService.getFormat(Constants.localeFormats.date));
        saveAs(new Blob([data], { type: 'text/xml' }), Utils.sanitize(name));
    }
}
