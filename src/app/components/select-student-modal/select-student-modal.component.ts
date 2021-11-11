import { Component, OnInit, AfterViewInit, Input, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { StorageService } from 'app/services/storage.service';
import { DataService } from 'app/services/data.service';

import { Student } from 'app/entities/student';

import { LICode, ModalAction } from 'app/common/enums';

import { BaseTable } from 'app/base-table';

import * as _ from 'lodash';

@Component({
    selector: 'app-select-student-modal',
    templateUrl: './select-student-modal.component.html',
    styleUrls: ['../select-css/select-css.scss']
})
export class SelectStudentModalComponent extends BaseTable<Student> implements OnInit, AfterViewInit {
    tablePostFix = 'table';
    @Input() contact: number;
    @Input() addNewStudent: boolean;
    @Input() existingStudentIds: number[];
    public students: Student[] = [];
    public tableId = 'selectStudent';

    public someFocusVariable = false

    constructor(
        private ref: ChangeDetectorRef,
        private dataService: DataService,
        private activeModal: NgbActiveModal,
        storageService: StorageService
    ) {
        super(storageService);
        this.displayedColumns = ['firstName', 'lastName', 'primaryContactName'];
    }

    ngOnInit() {
        if (this.students) {
            this.buildTable();
        }
    }

    ngAfterViewInit() {
        this.tableIsLoading = this.getData();
        this.ref.detectChanges();
    }

    private getData(): Promise<any> {
        return this.dataService.getAuth('student/list').then((students: any) => {
            this.students = students;
            _.forEach(this.students, (student: Student) => {
                if (student.contactRelationships) {
                    const primaryContactRelationships = _.filter(student.contactRelationships, (relationship) =>
                        relationship['contactType']['code'] === LICode.contact_type_primary);
                    student.contactRelationships = primaryContactRelationships;
                }
            });
            this.buildTable();
            return Promise.resolve();
        });
    }

    protected buildTable() {
        const students: Student[] = _.filter(this.students, (student) =>
            !_.includes(this.existingStudentIds, student.id))
        students.forEach(student => {
            student.primaryContactName = (student.contactRelationships.length === 0) ? ''
                : student.contactRelationships[0].contact.lastName + ', ' + student.contactRelationships[0].contact.firstName;
        });
        super.buildTable(students, true, false);
        this.updateTable(students);
    }

    createNewStudent() {
        this.activeModal.close({ action: ModalAction.Create });
    }

    selectStudent(selectedStudent: Student) {
        this.activeModal.close({ action: ModalAction.Select, selectedStudent: selectedStudent });
    }

    onCancelSelectStudent() {
        this.activeModal.close({ action: ModalAction.Cancel });
    }

}
