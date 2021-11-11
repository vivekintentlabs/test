import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { HttpService } from 'app/services/http.service';
import { LocaleService } from 'app/services/locale.service';

import { MinifiedStudent } from 'app/common/interfaces';
import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';

import { CustomHttpParams } from 'app/entities/custom-http-params';

import * as _ from 'lodash';
import * as moment from 'moment';
import { environment } from 'environments/environment';

@Injectable()
export class StudentsService {
    private _total = 0;

    constructor(
        private httpService: HttpService,
        private localeService: LocaleService,
    ) { }

    get total() {
        return this._total;
    }

    set total(value: number) {
        this._total = value;
    }

    getStudents(studentParams: CustomHttpParams): Promise<MinifiedStudent[]> {
        return this.httpService.getAuth(`students?${Utils.toStringEncoded(studentParams)}`)
            .then((result: { students: MinifiedStudent[], total: number }) => {
                this._total = (result.total !== null) ? result.total : this._total;
                const students = result.students;
                _.forEach(students, student => {
                    const exportDate = moment(student.exportDate);
                    const exportDateStr = exportDate.format(this.localeService.getFormat(Constants.localeFormats.date));
                    const applicationExportDate = moment(student.applicationExportDate);
                    const applicationExportDateStr = applicationExportDate.format(this.localeService.getFormat(Constants.localeFormats.date));
                    if (student.exportDate && student.applicationExportDate) {
                        const isApplyExportNewer = applicationExportDate.isAfter(exportDate);
                        student.exportInfo = `Exported ${isApplyExportNewer ? 'from Apply' : ''} on ${isApplyExportNewer ? applicationExportDateStr : exportDateStr}`;
                    } else if (!student.exportDate) {
                        student.exportInfo = `Exported from Apply on ${applicationExportDateStr}`;
                    } else {
                        student.exportInfo = `Exported on ${exportDateStr}`;
                    }
                });
                return students;
            });
    }

    import(fileList: FileList, router: Router): Promise<void> {
        if (fileList.length > 0) {
            const file: File = fileList[0];
            const formData: FormData = new FormData();
            formData.append('file', file, file.name);

            return this.httpService.postAuthForm('student/import', formData, false).then(() => {
                router.navigate(['dashboard/sendback']).then(() => {
                    router.navigate([`${environment.localization.enquiriesUrl}/students`]);
                });
            });
        }
    }

    delete(studentId: number): Promise<boolean> {
        return Utils.delete('student/delete-student/', studentId, this.httpService);
    }

    bulkDelete(studentParams: CustomHttpParams): Promise<object> {
        return this.httpService.deleteAuth(`students?${Utils.toStringEncoded(studentParams)}`);
    }

}
