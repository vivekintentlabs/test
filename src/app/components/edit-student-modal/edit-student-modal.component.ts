import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Utils } from 'app/common/utils';
import { FormUtils } from 'app/common/form-utils';
import { list_id, ModalAction } from 'app/common/enums';
import { Keys } from 'app/common/keys';

import { HttpService } from 'app/services/http.service';

import { Student } from 'app/entities/student';
import { ListItem } from 'app/entities/list-item';
import { UserInfo } from 'app/entities/userInfo';
import { School } from 'app/entities/school';
import { Contact } from 'app/entities/contact';

import * as _ from 'lodash';

@Component({
    selector: 'app-edit-student-modal',
    templateUrl: './edit-student-modal.component.html'
})
export class EditStudentModalComponent implements OnInit {
    @Input() studentId: number;
    @Input() contactId: number;
    @Input() currentContact: Contact;
    @Input() isRelationComponent: boolean;

    private student: Student;
    private userInfo: UserInfo;
    private studentList: ListItem[];

    studentAdditionalJsonData: object;
    currentContactRelationship = [];
    title = '';

    constructor(private httpService: HttpService, private activeModal: NgbActiveModal) { }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        if (this.studentId !== null) {
            this.title = `${Boolean(this.studentId) ? 'Edit' : 'Add'} Student details`;
            if (this.contactId) {
                this.httpService.getAuth('contact/' + this.contactId + '/related-students/' + this.studentId).then((result: any) => {
                    this.currentContactRelationship = result.contactRelationship;
                });
            }
            let school;
            return this.httpService.getAuth('schools/get/' + this.userInfo.schoolId).then((schoolData: School) => {
                school = schoolData;
                return this.getStudent().then((studentAdditionalJsonData: object) => {
                    this.studentAdditionalJsonData = studentAdditionalJsonData;
                    this.studentAdditionalJsonData[Keys.school] = school;
                    this.studentAdditionalJsonData[Keys.student] = this.student;
                });
            });
        }
    }

    studentIsChanged(changedStudent: Student) {
        if (changedStudent) {
            this.activeModal.close({ action: ModalAction.Update, changedStudent });
        } else {
            this.onCancel();
        }
    }

    private getStudent(): Promise<object> {
        return this.httpService.getAuth('student/edit-student/' + this.studentId).then((result: any) => {
            this.student = result.student;
            this.studentList = result.studentList;

            if (this.studentId === 0) { // for creating new student in modal
                this.student = new Student();
                const financialAids = FormUtils.filterList(this.studentList, list_id.financial_aid);
                const financialAidNone = _(financialAids).find((item) => item.name === 'None');
                this.student.financialAidId = financialAidNone != null ? financialAidNone.id : null;
                this.student.schoolId = Utils.getUserInfoFromToken().schoolId;
                this.student.campusId = this.userInfo.campusId;
            }
            return result;
        });
    }

    onCancel() {
        this.activeModal.close({ action: ModalAction.Cancel });
    }

}
