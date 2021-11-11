import { Component, OnInit, Input, SimpleChanges, OnChanges } from '@angular/core';

// import 'rxjs/add/operator/toPromise';
import { DataService } from 'app/services/data.service';
import { StudentLog } from 'app/entities/student-log';
import * as _ from 'lodash';
import { T } from 'app/common/t';
import { BaseTable } from 'app/base-table';
import { StorageService } from 'app/services/storage.service';


@Component({
    selector: 'app-student-logs',
    templateUrl: './student-logs.component.html',
    styleUrls: ['./student-logs.component.scss'],
})

export class StudentLogsComponent extends BaseTable<StudentLog> implements OnInit, OnChanges {
    @Input() studentId: number;
    @Input() trigger = false;

    public tableId = 'studentLogTable';
    public studentLogs: StudentLog[]

    constructor(private dataService: DataService, storageService: StorageService) {
        super(storageService);
        this.displayedColumns = ['date', 'status', 'note', 'user'];
    }

    public ngOnInit() {
        if (this.studentId != null) {
            this.tableIsLoading = this.getData()
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.trigger != null && !changes.trigger.firstChange) {
            this.dataService.resetOne('student/student-logs/' + this.studentId)
            this.ngOnInit()
        }
    }

    private getData(): Promise<any> {
        return this.dataService.getAuth('student/student-logs/' + this.studentId).then((studentLogs: StudentLog[]) => {
            this.studentLogs = studentLogs;
            this.buildTable(this.studentLogs);
            return Promise.resolve();
        });
    }

    protected buildTable(studentLogs: StudentLog[]) {
        studentLogs.forEach(studentLog => {
            studentLog['status'] = studentLog.studentStatus === null ? T.unknown : studentLog.studentStatus.status
        });
        super.buildTable(studentLogs);
        this.updateTable(studentLogs);
    }

}
