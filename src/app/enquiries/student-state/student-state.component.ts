import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { HttpService } from 'app/services/http.service';
import { SchoolQuery } from 'app/state/school';

import { Student } from 'app/entities/student';
import { ListItem } from 'app/entities/list-item';
import { StudentStatus } from 'app/entities/student-status';
import { YearLevel } from 'app/entities/year-level';

import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { LICode, list_id, StudentStatusCode } from 'app/common/enums';

import * as _ from 'lodash';

declare var $: any;

@Component({
    selector: 'app-student-state',
    templateUrl: './student-state.component.html',
    styleUrls: ['student-state.component.scss'],
})

export class StudentStateComponent implements OnChanges {
    @Input() data: { student: Student, studentList: ListItem[], yearLevels: YearLevel[], studentStatuses: StudentStatus[] };

    @Output() statusIsChanged = new EventEmitter<{
        studentStatusId: number, studentStatuses: StudentStatus[], schoolIntakeYearId: number, startingYear: number
    }>();
    @Output() stage = new EventEmitter<ListItem>();

    public stateForm: FormGroup;

    studentStates: ListItem[];
    private allStudentStatuses: StudentStatus[] = [];
    private studentStatuses: StudentStatus[] = [];
    declinedStatuses: StudentStatus[] = [];
    private stages: ListItem[] = [];

    stateReasons: ListItem[];

    public noItemSelected = Constants.noItemSelected; // show constant string in html
    public startingYears: number[] = [];

    studentStage: ListItem;
    studentStageDeclined: ListItem;
    schoolIntakeYearLabel = '';
    startingMonth$ = this.schoolQuery.startingMonth$;

    constructor(
        private fb: FormBuilder,
        private httpService: HttpService,
        private schoolQuery: SchoolQuery,
    ) { }

    public ngOnChanges(changes: SimpleChanges) {
        if (changes.data) {
            this.allStudentStatuses = this.data.studentStatuses;

            this.stateReasons = _.filter(this.data.studentList, i => i.list.id === list_id.reason);
            this.studentStates = _.filter(this.data.studentList, i => i.list.id === list_id.student_state);
            this.stages = _.filter(this.data.studentList, i => i.list.id === list_id.stage);

            this.studentStageDeclined = _.find(this.data.studentList, i => i.code === LICode.stage_declined);
            this.declinedStatuses = _.filter(this.allStudentStatuses, s => s.stageId === this.studentStageDeclined.id);
            this.startingYears = Utils.getStartingYears();

            this.updateSchoolIntakeYearLabel(this.data.student.schoolIntakeYearId);
            this.updateStage(this.data.student.studentStatusId);

            this.createStateForm();
            this.emitData(this.data.student.studentStatusId);
        }
    }

    private createStateForm() {
        this.stateForm = this.fb.group({
            stateId: [null, Validators.required],
            studentStatusId: [null, Validators.required],
            schoolIntakeYearId: [null, Validators.required],
            startingYear: [null, Validators.required],
            reasonId: [null, Validators.required],
            studentId: this.data.student.id,
            isDeclined: false,
            schoolId: this.data.student.schoolId
        });
    }

    private updateSchoolIntakeYearLabel(schoolIntakeYearId) {
        this.schoolIntakeYearLabel = '';
        if (schoolIntakeYearId) {
            const yearLevel = _.find(this.data.yearLevels, i => i.id === schoolIntakeYearId);
            if (yearLevel) {
                this.schoolIntakeYearLabel = yearLevel.name + ', ';
            }
        }
    }

    stateChanged(stateId: number) {
        if (stateId) {
            const selectedStudentState = _.find(this.studentStates, s => s.id === stateId);

            if (selectedStudentState) {
                if (selectedStudentState.code === LICode.state_deferred) {
                    const studentStatus = _.find(this.allStudentStatuses, s => s.code === StudentStatusCode.student_status_enquiry);
                    this.updateStudentStatusList(_.find(this.stages, s => s.id === studentStatus.stageId));

                    this.stateForm.controls.isDeclined.setValue(false);
                    this.stateForm.controls.reasonId.setValue(null);
                    this.stateForm.controls.studentStatusId.setValue(null);
                    this.stateForm.controls.schoolIntakeYearId.enable();
                    this.stateForm.controls.startingYear.enable();
                }

                if (selectedStudentState.code === LICode.state_declined) {
                    const studentStatus = _.find(this.allStudentStatuses, s => s.code === StudentStatusCode.student_status_declined);
                    this.updateStudentStatusList(_.find(this.stages, s => s.id === studentStatus.stageId));

                    this.stateForm.controls.isDeclined.setValue(true);
                    this.stateForm.controls.reasonId.setValue(null);
                    this.stateForm.controls.studentStatusId.setValue(null);

                    this.stateForm.controls.schoolIntakeYearId.reset();
                    this.stateForm.controls.schoolIntakeYearId.disable();
                    this.stateForm.controls.startingYear.reset();
                    this.stateForm.controls.startingYear.disable();
                }
            }
        } else {
            this.createStateForm();
        }
    }

    private emitData(studentStatusId: number) {
        this.statusIsChanged.emit({
            studentStatusId,
            studentStatuses: this.studentStatuses,
            schoolIntakeYearId: (this.stateForm.controls.schoolIntakeYearId.enabled) ? this.stateForm.value.schoolIntakeYearId : null,
            startingYear:  (this.stateForm.controls.startingYear.enabled) ? this.stateForm.value.startingYear : null,
        });
    }

    private updateStudentStatusList(studentStage: ListItem) {
        this.studentStage = studentStage;
        this.studentStatuses = (studentStage.code === LICode.stage_declined)
            ? _.filter(this.allStudentStatuses, s => (s.stageId === this.studentStageDeclined.id))
            : _.filter(this.allStudentStatuses, s => s.stageId !== this.studentStageDeclined.id);
    }

    saveState() {
        this.httpService.postAuth('student/update-student-status', this.stateForm.value).then((data: any) => {
            $('#stateModal').modal('hide');
            this.updateStage(data.studentLog.studentStatusId);
            this.emitData(this.stateForm.controls.studentStatusId.value);
            this.resetStateForm();
            Utils.showSuccessNotification();
            setTimeout(() => {
                this.cancelStateForm();
            }, 100);
        }).catch((e) => {
            console.log(e);
        });
    }

    private updateStage(currentStudentStatusId: number) {
        this.studentStage = new ListItem();
        this.studentStage.name = 'choosing student status';
        if (currentStudentStatusId) {
            const studentStatus = _.find(this.allStudentStatuses, s => s.id === currentStudentStatusId);
            if (studentStatus) {
                this.studentStage = _.find(this.stages, s => s.id === studentStatus.stageId);
                if (this.studentStage) {
                    this.updateStudentStatusList(this.studentStage);
                }
            }
        }
        this.stage.emit(this.studentStage);
    }

    cancelStateForm() {
        this.resetStateForm();
    }

    private resetStateForm() {
        this.stateForm.controls.isDeclined.reset();
        this.stateForm.controls.reasonId.reset();
        this.stateForm.controls.schoolIntakeYearId.reset();
        this.stateForm.controls.startingYear.reset();
        this.stateForm.controls.stateId.reset();
        this.stateForm.controls.studentStatusId.reset();
    }

}
