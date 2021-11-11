import { Component, Input, SimpleChanges, OnChanges, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { HttpService } from 'app/services/http.service';
import { DataService } from 'app/services/data.service';
import { StorageService } from 'app/services/storage.service';
import { SchoolQuery } from 'app/state/school';

import { Calculation } from 'app/common/calculation';
import { Utils } from 'app/common/utils';
import { T } from 'app/common/t';
import { LICode, ModalAction } from 'app/common/enums';
import { Constants } from 'app/common/constants';

import { ListItem } from 'app/entities/list-item';
import { RankingScore } from 'app/entities/ranking-score';
import { UserInfo } from 'app/entities/userInfo';
import { Student } from 'app/entities/student';
import { ContactRelationship } from 'app/entities/contact-relationship';
import { Contact } from 'app/entities/contact';

import { BaseTable } from 'app/base-table';
import { MergeStudentComponent } from 'app/components/merge-enquiry/merge-student.component';
import { SelectStudentModalComponent } from '../select-student-modal/select-student-modal.component';
import { EditStudentModalComponent } from '../edit-student-modal/edit-student-modal.component';

import * as moment from 'moment';
import * as _ from 'lodash';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-related-students-cmp',
    templateUrl: 'related-students.component.html',
    styleUrls: ['./related-students.component.scss']
})

export class RelatedStudentsComponent extends BaseTable<Student> implements OnChanges {

    public allStudents: Student[] = [];
    public contactRelationships: object[] = [];
    public contactRelationshipsNew: ContactRelationship[] = [];
    public students: any[] = [];
    public contacts: Contact[] = [];
    private stages: ListItem[] = [];
    private applicationDate: ListItem[] = [];
    private rankingScores: RankingScore[];
    public userInfo: UserInfo = null;
    @Input() contactId: number;
    @Input() currentContact: Contact;
    @Input() studentId: number;
    @Input() contactChangedTrigger: boolean;
    @Input() isModal = false;
    @Input() timeZone: string;
    @Output() emitTrigger = new EventEmitter();
    @Output() userOutput = new EventEmitter<{ action: ModalAction, selectedIds?: number[] }>();

    public existingStudentIds: number[] = [];
    public tableId = 'relatedStudents';
    startingMonth$ = this.schoolQuery.startingMonth$;

    constructor(
        private httpService: HttpService,
        private router: Router,
        private dataService: DataService,
        storageService: StorageService,
        private modalService: NgbModal,
        private platformLocation: PlatformLocation,
        private schoolQuery: SchoolQuery,
    ) {
        super(storageService);
        this.userInfo = Utils.getUserInfoFromToken();
        this.displayedColumns = ['name', 'score', 'schoolIntakeYear', 'startingYear', 'stageName',
            'studentStatus', 'relationshipName'];
    }

    ngOnChanges(changes: SimpleChanges) {
        this.tableIsLoading = this.getStudents().then(() => {
            const students: Student[] = Utils.clone(this.allStudents);
            this.addOrRemoveActionsColumn();
            this.addOrRemoveSelectColumn();
            this.getData(students);
            this.buildTable(this.students);

        });
    }

    getStudents(): Promise<any> {
        if (this.contactId) {
            return this.dataService.getAuth('contact/' + this.contactId + '/related-students/').then((result) => {
                this.getResultData(result);
            });
        } else if (this.studentId) {
            return this.dataService.getAuth('student/' + this.studentId + '/related-students/').then((result) => {
                this.getResultData(result);
            });
        }
    }

    getResultData(result) {
        this.contactRelationshipsNew = [];
        this.students = [];
        this.stages = result['stages'];
        this.applicationDate = result['applicationDate'];
        this.rankingScores = result['rankingScores'];
        this.allStudents = result['students'];
        this.contacts = result['contacts'];
        this.contactRelationships = result['contactRelationships'];
        this.emitTrigger.emit(this.allStudents);
        _.forEach(this.contactRelationships, (item: Object) => {
            const contactRelationship = new ContactRelationship(
                item['studentId'],
                item['contactId'],
                item['relationshipType'],
                item['contactType'],
            );
            this.contactRelationshipsNew.push(contactRelationship);
        });
    }

    private getData(students) {
        this.students = [];
        _.forEach(students, (student: Student) => {
            let stage;
            const dateAppR: string = _(student.activityLogs)
                .filter((item) => (item.activity && item.activity.code === LICode.activity_application_submitted)).map('date').max();
            const actualApplicationDate: Date = dateAppR !== undefined ? moment(dateAppR).toDate() : null;
            let stageName = T.unknown;
            if (student.studentStatus) {
                stage = _.find(this.stages, (itemstage) => itemstage.id === student.studentStatus.stageId);
                stageName = (stage) ? stage.name : '';
            }
            const relationshipName = [];
            if (this.contactId) {
                const relationship = _.find(this.contactRelationshipsNew, { studentId: student.id });
                relationshipName.push(relationship.relationshipType.name + ' (' + relationship.contactType.name + ')');
            } else if (this.studentId) {
                const contactRelationshipsNew = _.filter(this.contactRelationshipsNew, { studentId: student.id });
                const contactIds = _.map(contactRelationshipsNew, 'contactId');
                const contacts = [];
                _.forEach(this.contacts, (contact: Contact) => {
                    if (_.includes(contactIds, contact.id)) {
                        contacts.push(contact)
                    }
                });
                _.forEach(contacts, (contact: Contact) => {
                    const relationship = _.find(this.contactRelationshipsNew, { studentId: student.id, contactId: contact.id });
                    relationshipName.push(
                        contact.lastName + ', ' + contact.firstName + ': ' + relationship.relationshipType.name +
                        ' (' + relationship.contactType.name + ')'
                    );
                });
            }
            const score = Calculation.calculateScore(actualApplicationDate, student.hasAlumni, student.siblingsId, student.religionId,
                student.currentSchool, this.rankingScores, this.applicationDate);
            this.students.push({
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                score,
                startingYear: student.startingYear,
                schoolIntakeYear: student.schoolIntakeYear ? student.schoolIntakeYear.name : '',
                stageName,
                studentStatus: student.studentStatus ? student.studentStatus.status : T.unknown,
                relationshipName: relationshipName.join('; '),
            });
        });
    }

    protected buildTable(students) {
        this.existingStudentIds = [];
        students.forEach(student => {
            student.name = `${student.lastName}, ${student.firstName}`;
            this.existingStudentIds.push(student.id);
        });
        super.buildTable(students, false);
        this.updateTable(students);
    }

    editStudent(id: number) {
        if (this.isModal) { return; }

        this.router.navigate(['dashboard/sendback']).then((hasNavigated: boolean) => {
            if (hasNavigated) {
                this.router.navigate([`/${environment.localization.enquiriesUrl}/edit-student`, { studentId: id }]);
            }
        });
    }

    addOrEditStudentModal(studentId: number) {
        if (studentId || studentId === 0) {
            const editStudentModaltRef = this.modalService.open(EditStudentModalComponent, Constants.ngbModalLg);
            editStudentModaltRef.componentInstance.studentId = studentId;
            editStudentModaltRef.componentInstance.contactId = this.contactId;
            editStudentModaltRef.componentInstance.currentContact = this.currentContact;
            editStudentModaltRef.componentInstance.isRelationComponent = true;
            editStudentModaltRef.result.then((res: { action: ModalAction, changedStudent?: Student }) => {
                switch (res.action) {
                    case ModalAction.Update: this.studentIsChanged(); break;
                    default: break;
                }
            });
            this.platformLocation.onPopState(() => {
                editStudentModaltRef.close({ action: ModalAction.LeavePage });
            });
        }
    }

    unlinkRelationship(unlinkStudentId: number) {
        return Utils.unlinkQuestion().then((result) => {
            if (result && result.value) {
                this.httpService.postAuth('student/' + unlinkStudentId + '/unlink/' + this.contactId, {}).then(() => {
                    Utils.unlinkedSuccess();
                    this.dataService.resetPageDependentData();
                    this.ngOnChanges(null);
                    this.emitTrigger.emit(this.allStudents);
                }).catch(err => {
                    console.log(err);
                });
            }
        });
    }

    selectStudent() {
        this.ngOnChanges(null);
        const selectStudentModaltRef = this.modalService.open(SelectStudentModalComponent, Constants.ngbModalLg);
        selectStudentModaltRef.componentInstance.addNewStudent = true;
        selectStudentModaltRef.componentInstance.existingStudentIds = this.existingStudentIds;
        selectStudentModaltRef.componentInstance.schoolTimeZone = this.timeZone;
        selectStudentModaltRef.result.then((res: { action: ModalAction, selectedStudent?: Student }) => {
            switch (res.action) {
                case ModalAction.Select: this.onStudentSelect(res.selectedStudent); break;
                case ModalAction.Create: this.addOrEditStudentModal(0); break;
                default: break;
            }
        });
        this.platformLocation.onPopState(() => {
            selectStudentModaltRef.close({ action: ModalAction.LeavePage });
        });
    }

    onStudentSelect(student: Student) {
        this.addOrEditStudentModal(student.id);
    }

    private studentIsChanged() {
        this.emitTrigger.emit(this.allStudents);
        this.ngOnChanges(null);
    }

    mergeStudents() {
        if (this.isModal) {
            this.userOutput.emit({ action: ModalAction.MergeStudents, selectedIds: this.getVisibleSelectedIds() });
            this.dataService.resetPageDependentData();
            this.selection.clear();
        } else {
            this.openMergeStudents();
        }
    }

    mergeDone() {
        this.userOutput.emit({ action: ModalAction.Done });
    }

    openMergeStudents() {
        const modalMergeStudentstRef = this.modalService.open(MergeStudentComponent, Constants.ngbModalXl);
        modalMergeStudentstRef.componentInstance.ids = this.getVisibleSelectedIds();
        modalMergeStudentstRef.componentInstance.contactId = this.contactId;
        modalMergeStudentstRef.componentInstance.schoolTimeZone = this.timeZone;
        modalMergeStudentstRef.result.then((res: { action: ModalAction, id?: number }) => {
            if (res.action === ModalAction.MergeStudents) {
                this.dataService.resetPageDependentData();
                this.ngOnChanges(null);
                this.selection.clear();
                Utils.showSuccessNotification('Students successfully merged');
            }
        });
        this.platformLocation.onPopState(() => {
            modalMergeStudentstRef.close({ action: ModalAction.LeavePage });
        });
    }

    private addOrRemoveActionsColumn() {
        if (this.isModal && _.includes(this.displayedColumns, 'actions')) {
            this.displayedColumns.splice(this.displayedColumns.length - 1, 1);
        }
        if (!this.isModal && !_.includes(this.displayedColumns, 'actions')) {
            this.displayedColumns.splice(this.displayedColumns.length, 0, 'actions');
        }
    }

    private addOrRemoveSelectColumn() {
        if (this.contactId && !_.includes(this.displayedColumns, 'select')) {
            this.displayedColumns.splice(0, 0, 'select');
        }
    }

}
