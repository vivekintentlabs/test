import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { HttpService } from '../../services/http.service';
import { StorageService } from '../../services/storage.service';

import { Utils } from '../../common/utils';
import { Constants } from '../../common/constants';

import { UserInfo } from '../../entities/userInfo';
import { ListItem } from '../../entities/list-item';
import { StudentStatus } from '../../entities/student-status';

import { BaseTable } from '../../base-table';

import * as _ from 'lodash';

@Component({
    selector: 'data-table-student-status',
    templateUrl: 'student-status.component.html',
    styleUrls: ['student-status.component.scss']
})
export class StudentStatusComponent extends BaseTable<StudentStatus> implements AfterViewInit {

    public statuses: any[] = [];
    public userInfo: UserInfo = null;
    reservedBySystem = Constants.reservedBySystem;
    public tableId = 'studentStatusTable';
    public synCodeTitle = '';
    public dataLength = 0;

    constructor(private router: Router, private httpService: HttpService, private ref: ChangeDetectorRef,
                storageService: StorageService) {
        super(storageService);
        this.displayedColumns = ['stage', 'status', 'synCode', 'actions'];
    }

    ngAfterViewInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.synCodeTitle = Utils.getNameCode(this.userInfo);
        Utils.DetectChanges(this.ref);
        this.httpService.getAuth('student-status').then((results) => {
            const stages: ListItem[] = results['stages'];
            _.forEach(results['studentStatusesJson'], (status: StudentStatus) => {
                const stage = _.find(stages, (item: ListItem) => item.id === status.stageId);
                this.statuses.push({
                    id: status.id, sequence: status.sequence, stage: stage.name, status: status.status, synCode: status.synCode, isModifiable: status.isModifiable, isDeletable: status.isDeletable, code: status.code
                });
            });
            this.lastAction();
        });
    }

    protected buildTable(statuses: StudentStatus[]) {
        this.dataLength = statuses.length;
        super.buildTable(statuses, true);
        this.updateTable(statuses);
    }

    private lastAction() {
        this.statuses = _.orderBy(this.statuses, ['sequence'], 'asc');
        this.buildTable(this.statuses);
    }

    addStudentStatus() {
        this.router.navigate(['/system-admin/add-student-status']);
    }

    editStudentStatus(id: number) {
        this.router.navigate(['/system-admin/edit-student-status', id]);
    }

    deleteStudentStatus(id: number) {
        Utils.delete('student-status/delete-student-status/', id, this.httpService).then((deleted: boolean) => {
            if (deleted) {
                _.remove(this.statuses, (status: any) => status.id === id);
                this.lastAction();
            }
        });
    }

    changeSequence(id: number, sequence: number, up: boolean) {
        let prewOrNext = null;

        if (up) {
            prewOrNext = _.maxBy(_.filter(this.statuses, s => s.sequence < sequence), 'sequence');
        } else {
            prewOrNext = _.minBy(_.filter(this.statuses, s => s.sequence > sequence), 'sequence');
        }

        if (prewOrNext) {
            const current = _.find(this.statuses, s => s.id === id);
            try {
                current.sequence = prewOrNext.sequence;
                prewOrNext.sequence = sequence;
                this.update([current, prewOrNext]).then(() => {
                    this.lastAction();
                });
            } catch (error) {
                console.log(error);
            }
        }
    }

    private update(statuses: StudentStatus[]): Promise<any> {
        return this.httpService.postAuth('student-status/change-sequence', { statuses }).then(() => {
            return Promise.resolve();
        }).catch(err => {
            console.log(err);
            return Promise.reject(err);
        });
    }

}
