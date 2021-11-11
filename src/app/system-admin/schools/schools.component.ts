import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

import { HttpService } from '../../services/http.service';
import { ListenerService } from '../../services/listener.service';
import { LocaleService } from 'app/services/locale.service';
import { StorageService } from 'app/services/storage.service';

import { Utils } from '../../common/utils';
import { Constants } from '../../common/constants';
import { LocalDatePipe } from 'app/common/pipes/date.pipe';

import { UserInfo } from '../../entities/userInfo';
import { SchoolList } from '../../entities/school';

import { BaseTable } from 'app/base-table';

import * as _ from 'lodash';

declare var $: any;

@Component({
    selector: 'app-schools',
    templateUrl: 'schools.component.html'
})
export class SchoolsComponent extends BaseTable<SchoolList> implements AfterViewInit {

    private schools: Array<SchoolList> = [];
    userInfo: UserInfo = null;
    format: string;
    hourMinutes = Constants.dateFormats.hourMinutes;
    dateDelimiterTime = Constants.localeFormats.dateDelimiterTime;
    localeformats = Constants.localeFormats;
    public tableId = 'schoolsTable';
    private localDatePipe: LocalDatePipe;
    schoolTimeZone: string;

    constructor(
        private router: Router,
        private httpService: HttpService,
        private listenerService: ListenerService,
        private localeService: LocaleService,
        storageService: StorageService
    ) {
        super(storageService);
        this.displayedColumns = ['name', 'administrativeAreaName', 'status', 'expirationDate', 'usersCount',
            'activated', 'last24', 'lastLogin', 'actions'];
        this.format = this.localeService.getFormat('date');
        this.localDatePipe = new LocalDatePipe(this.localeService);
    }

    ngAfterViewInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.httpService.getAuth('schools').then((data: Array<SchoolList>) => {
            this.schoolTimeZone = _.find(data, (school: SchoolList) => school.id === this.userInfo.schoolId).timeZoneId
            _.forEach(data, (school: SchoolList) => {
                this.schools.push({
                    id: school.id,
                    name: school.name,
                    administrativeAreaName: school['administrativeArea.name'],
                    status: school.status,
                    expirationDate: school.expirationDate,
                    timeZoneId: school.timeZoneId,
                    activated: school.activated || 0,
                    usersCount: school.usersCount || 0,
                    last24: school.last24 || 0,
                    lastLogin: school.lastLogin
                });
            });
            this.buildTable(this.schools)
        })
    }

    protected buildTable(schools) {
        super.buildTable(schools, true);
        this.updateTable(schools);
        this.dataSource.filterPredicate = (data, filter: string) => {
            const values = [];
            this.displayedColumns.forEach(fieldName => {
                let value;
                if (fieldName === 'expirationDate') {
                    value = this.localDatePipe.transform(data['expirationDate'], this.schoolTimeZone).slice(0, 10);
                } else {
                    value = _.get(data, fieldName);
                }
                if (value) {
                    values.push(_.toLower(value));
                }
            })
            const transformedFilter = filter.trim().toLowerCase();
            return values.find(i => _.includes(i, transformedFilter));
        };
    }

    deleteSchool(id: number) {
        Utils.delete('schools/delete-school/', id, this.httpService).then((deleted: boolean) => {
            if (deleted) {
                _.remove(this.schools, (s: SchoolList) => s.id === id);
                this.buildTable(this.schools);
            }
        });
    }

    addSchool() {
        this.router.navigate(['/admin/add-school']);
    }

    editSchool(id: number) {
        if (this.userInfo.schoolId !== id) {
            this.httpService.postAuth('users/set-school', { schoolId: id }).then(() => {
                Utils.resetSession();
                this.userInfo = Utils.getUserInfoFromToken();
                this.httpService.updateCurrentSchoolId(this.userInfo.schoolId);
                this.router.navigate(['/admin/edit-school', id]);
                this.listenerService.schoolListChanged();
                this.listenerService.campusListChanged();
                this.listenerService.eventListChanged();
            }).catch((err) => {
                console.log(err);
            });
        } else {
            this.router.navigate(['/admin/edit-school', id]);
        }
    }

}
