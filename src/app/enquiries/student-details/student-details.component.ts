import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { HttpService } from 'app/services/http.service';
import { DataService } from 'app/services/data.service';

import { Student } from 'app/entities/student';
import { ListItem } from 'app/entities/list-item';
import { StudentStatus } from 'app/entities/student-status';
import { Contact } from 'app/entities/contact';
import { UserInfo } from 'app/entities/userInfo';
import { Campus } from 'app/entities/campus';
import { ManagementSystem } from 'app/entities/management-system';
import { ActivityLog } from 'app/entities/activityLog';
import { YearLevel } from 'app/entities/year-level';
import { YearLevelList } from 'app/entities/year-level-list';
import { School } from 'app/entities/school';
import { ContactRelationship } from 'app/entities/contact-relationship';
import { CustomHttpParams } from 'app/entities/custom-http-params';
import { ExportMapping } from 'app/entities/export-mapping';

import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { FormUtils } from 'app/common/form-utils';
import { list_id, LICode, StudentStatusCode, ModalAction } from 'app/common/enums';
import { Keys } from 'app/common/keys';

import { BaseForm } from 'app/base-form';
import { ExportStudent } from '../export-student';
import { EditStudentComponent } from 'app/components/edit-student/edit-student.component';
import { ActivityLogsComponent } from '../activity-logs/activity-logs.component';
import { StudentStateComponent } from '../student-state/student-state.component';

import * as _ from 'lodash';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { AppsNewApplicationDialog } from 'app/applications/apps-new-application-dialog/apps-new-application-dialog.component';
import { environment } from 'environments/environment';

declare var $: any;

@Component({
    selector: 'app-student-details',
    styleUrls: ['student-details.component.scss'],
    templateUrl: './student-details.component.html'
})
export class StudentDetailsComponent extends BaseForm implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(ActivityLogsComponent) activityLogsComponent;
    @ViewChild(EditStudentComponent) editStudentComponent;
    @ViewChild(StudentStateComponent) studentStateComponent;

    private yearLevelList: YearLevelList;
    private currentSchoolYears: YearLevel[] = [];
    yearLevels: YearLevel[] = [];

    private allStudentStatuses: StudentStatus[] = [];
    private studentStatuses: StudentStatus[] = [];
    relatedContacts: Contact[] = [];
    contactRelationships: ContactRelationship[] = [];

    private financialAids: ListItem[] = [];
    private leadSources: ListItem[] = [];
    private hearAboutUS: ListItem[] = [];
    private contactTypes: ListItem[] = [];
    private applicationDate: ListItem[] = [];
    private student: Student = null;
    private studentAdditionalJsonData: Object;
    private studentList: ListItem[];
    exportMapping: ExportMapping;

    public zeroValue: number = null;
    public listId = list_id; // allow access to enum in html
    public noItemSelected = Constants.noItemSelected; // show constant string in html

    public studentEditFormData: Object;
    public loaded = false;
    public title = 'Add Student';
    userInfo: UserInfo;
    public stage: ListItem;
    public schoolIntakeYearLabel = '';
    public startingYear: number;
    public studentId: number;
    public newStudentId: number;
    public declinedId: number;
    private school: School;
    isEnabledAppModule: boolean;
    private fromUrl = '';

    public sub: Subscription;
    public formIsValid = false;
    public relationshipTableIsValid = false;
    public formIsPristine = true;
    public specialNeed = 'false';
    public hasPrimary = false;

    public isExternalIdReadonly: boolean;

    public eventId: number = null;
    public temp: number;
    public timeZone: string;

    public eventsCount: number;
    public personalToursCount: number;

    trigger1 = false;
    trigger2 = false;
    editContactId = null;
    editingContact = null;
    trigger = false;
    studentLogTrigger = false;

    activityLogsHaveLoaded = false;
    StudentStatusCode = StudentStatusCode;
    public newContact: Contact;
    public campuses: Campus[] = [];
    private isNewStudent = false;
    private contactChangedTrigger = false;
    private contactsData = [];
    isExportedFromApply = false;

    public triggerForAddListItem = false;
    addListItemSub: Subscription;

    managementSystem: ManagementSystem;
    schoolManagementSystem = Constants.schoolManagementSystem;
    dateformats = Constants.dateFormats;
    dateTime = Constants.localeFormats.dateTime;
    dateDelimiter = Constants.localeFormats.dateDelimiter;
    subFormChanges: Subscription;
    studentStateData;
    alumniContactRelationships: string[] = [];
    alumniText = 'Please indicate which related contact is an Alumni';
    externalIdMaxLength = Constants.studentExternalIdsMaxLength;
    public brand = environment.brand;

    constructor(
        private fb: FormBuilder, private httpService: HttpService,
        private ref: ChangeDetectorRef, private route: ActivatedRoute,
        private router: Router, private exportStudent: ExportStudent,
        private dataService: DataService, private modalService: NgbModal,
        private platformLocation: PlatformLocation,
    ) {
        super();
    }

    public ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.sub = this.route.params.subscribe(params => {
            this.studentId = +params['studentId'] || 0;
            this.fromUrl = params['fromUrl'] || '';
            this.isNewStudent = !Boolean(this.studentId);
            Promise.all([ // pre-caching data we need on student page to speed up the page load.
                this.dataService.getAuth('schools/limitedData/' + this.userInfo.schoolId),
                this.getStudent(this.studentId),
                this.dataService.postAuth('activity-log/get-activities-info', [this.studentId]),
                this.dataService.getAuth('student/' + this.studentId + '/related-contacts/'),
                this.dataService.getAuth('student/' + this.studentId + '/related-students/'),
                this.dataService.getAuth('contact/list'),
                this.dataService.getAuth('student/list'),
                this.dataService.getAuth('webform/get-conduct'),
                this.dataService.getAuth('student/student-logs/' + this.studentId)
            ]).then((res: object) => {
                this.school = res[0];
                this.isEnabledAppModule = (this.school && this.school.modules)
                    ? Utils.isSchoolModuleEnabled(this.school.modules, Constants.schoolModules.appModule.name)
                    : false;
                this.studentAdditionalJsonData = res[1];

                this.managementSystem = this.school.managementSystem;
                this.studentAdditionalJsonData[Keys.school] = this.school;

                this.httpService.getAuth(`export/mappings/${this.managementSystem.format}/${ExportMapping.TYPE_PIPELINE}`, false).then((data: ExportMapping) => {
                    this.exportMapping = data;
                }).catch(() => { this.exportMapping = null; });

                if (this.studentId === 0) { // new student
                    this.title = 'Add Student';
                    this.student = new Student();

                    const studentStageDeclined = _.find(this.studentList, i => i.code === LICode.stage_declined);
                    this.studentStatuses = _.filter(this.allStudentStatuses, s => (s.stageId !== studentStageDeclined.id));
                    const studentStatusEnquiry = _.find(this.studentStatuses, s => s.code === StudentStatusCode.student_status_enquiry);
                    this.student.studentStatusId = studentStatusEnquiry ? studentStatusEnquiry.id : null;

                    const financialAidNone = _(this.financialAids).find((item) => item.name === 'None');
                    this.student.financialAidId = financialAidNone != null ? financialAidNone.id : null;
                    this.student.schoolId = Utils.getUserInfoFromToken().schoolId;
                    this.studentAdditionalJsonData[Keys.student] = this.student;
                    this.student.campusId = this.userInfo.campusId;
                    const campus: Campus = _.find(this.campuses, c => c.id === this.student.campusId);
                    this.student.genderId = (campus === undefined || campus.genders.length !== 1) ? null : campus.genders[0].id;
                } else {
                    this.title = 'Edit Student';
                }
                this.campusChange(this.student.campusId);
                this.getAlumniContactRelationship();
                this.prepareStudentScreen();
            });
        });

    }

    ngAfterViewInit() {
        // to reset changed counter to have first time 0 value
        setTimeout(() => {
            this.changed = 0;
        }, 1000);
    }

    private prepareStudentScreen() {
        this.declinedId = _.find(this.allStudentStatuses, x => x.code === StudentStatusCode.student_status_declined).id;
        this.studentStateData = {
            student: this.student,
            studentList: this.studentList,
            yearLevels: this.yearLevels,
            studentStatuses: this.allStudentStatuses
        };
        this.getExportDate();
        this.createForm(this.studentList);
        Utils.DetectChanges(this.ref);
        this.isExternalIdReadonly = true;
        this.checkDeclined();
    }

    getAlumniContactRelationship() {
        return this.dataService.getAuth(`student/${this.studentId}/related-contacts`)
            .then((data: { contacts: Contact[], contactRelationships: ContactRelationship[] }) => {
                this.relatedContacts = data.contacts;
                this.contactRelationships = data.contactRelationships;
                this.alumniContactRelationships = [];
                const alumniIdYes = _.find(this.studentList, x => x.code === LICode.alumni_yes).id;
                const contactRelationships = FormUtils.filterList(this.studentList, list_id.contact_relationship);
                const contactsAlumniYes = _.filter(this.relatedContacts, (c: Contact) => c.alumniId === alumniIdYes);
                if (contactsAlumniYes.length > 0) {
                    _.forEach(contactsAlumniYes, (c: Contact) => {
                        const cr = _.find(data.contactRelationships, (i: ContactRelationship) => i.contactId === c.id);
                        if (cr) {
                            const crContactRelationship = _.find(contactRelationships, (li: ListItem) => li.id === cr.relationshipTypeId);
                            this.alumniContactRelationships.push(crContactRelationship.name);
                        }
                    });
                }
            });
    }


    private getStudent(studentId: number): Promise<object> {
        return this.httpService.getAuth('student/edit-student/' + studentId).then((result: object) => {
            this.student = result[Keys.student];
            this.eventsCount = result['eventsCount'];
            this.personalToursCount = result['personalToursCount'];
            this.studentList = result['studentList'];

            this.allStudentStatuses = result['studentStatuses'];
            this.allStudentStatuses = _.orderBy(this.allStudentStatuses, 'sequence', 'asc');

            this.yearLevelList = new YearLevelList(result['yearLevels']);

            this.financialAids = FormUtils.filterList(this.studentList, list_id.financial_aid);
            this.timeZone = result['timeZone'];
            this.campuses = result['campuses'];

            return Promise.resolve(result);
        });
    }

    private createForm(studentList: ListItem[]) {
        const formJSON = {
            id: [this.student.id],
            schoolId: [this.student.schoolId],
            schoolIntakeYearId: [this.student.schoolIntakeYearId],
            specialNeedsIds: [_.map(this.student.specialNeeds, 'id')],
            studentStatusId: [{ value: this.student.studentStatusId, disabled: !!(this.student.studentStatusId === this.declinedId) }],
            financialAidId: [this.student.financialAidId],
            hearAboutUsId: [this.student.hearAboutUsId],
            leadSourceId: [this.student.leadSourceId],
            notes: this.student.notes,
            markRecord: this.student.markRecord,
            externalId: [this.student.externalId, Validators.maxLength(this.externalIdMaxLength)],
        };

        this.hearAboutUS = FormUtils.filterList(studentList, list_id.hear_about_us);
        this.leadSources = FormUtils.filterList(studentList, list_id.lead_source);
        this.contactTypes = FormUtils.filterList(studentList, list_id.contact_type);
        this.applicationDate = FormUtils.filterList(studentList, list_id.application_date);

        this.formGroup = this.fb.group(formJSON);

        this.loaded = true;
    }

    subscribeFormChanges(): void {
        if (this.subFormChanges) {
            this.subFormChanges.unsubscribe();
        }
        this.subFormChanges = this.formGroup.valueChanges.subscribe(val => {
            this.changed += 1;
        });
    }

    childCmpData(event) {
        this.studentEditFormData = event.formData;
        this.formIsValid = (event.valid === true) ? true : false;
        this.formIsPristine = (event.pristine === true) ? true : false;

        if (this.editStudentComponent) {
            this.changed += 1;
        }
        if (event.campusId !== this.student.campusId) {
            this.campusChange(event.campusId);
        }
    }

    campusChange(campusId: number) {
        this.student.campusId = campusId;
        const currentCampusId = Utils.getCurrentCampusId(campusId, this.campuses);
        this.currentSchoolYears = this.yearLevelList.getCurrentSchoolYearLevels(currentCampusId);
        this.yearLevels = this.yearLevelList.getIntakeYearLevels(currentCampusId);
    }

    doSubmit(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.submitted = true;
            const studentEditFormData = this.editStudentComponent.getFormData();
            let formData: object = _.cloneDeep(this.formGroup.value);
            formData = _.merge(formData, studentEditFormData);
            formData[Keys.dateOfBirth] = Utils.getDateOnly(formData[Keys.dateOfBirth]);
            FormUtils.cleanupForm(formData);

            let route = '';
            if (this.studentId === 0) {
                const userInfo = Utils.getUserInfoFromToken();
                formData['schoolId'] = userInfo.schoolId;
                formData['contacts'] = this.contactsData;
                route = 'student/add-student-with-relationship';
            } else {
                route = 'student/update-student';
            }
            this.httpService.postAuth(route, formData).then((student: Student) => {
                this.newStudentId = student.id;
                Utils.showSuccessNotification();
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }

    onSubmit() {
        this.submit().then(() => {
            this.lastAction(false);
        }).catch((err) => console.log(err));
    }

    onCancel() {
        super.onCancel();
        this.lastAction();
    }

    ngOnDestroy() {
        if (this.subFormChanges) {
            this.subFormChanges.unsubscribe();
        }
        super.ngOnDestroy();
    }

    private lastAction(toNavigate = true) {
        if (toNavigate) {
            const url = this.fromUrl ? this.fromUrl : `/${environment.localization.enquiriesUrl}/students`;
            this.router.navigate([url]);
        } else {
            const urlParams = { studentId: this.studentId ? this.studentId : this.newStudentId };
            if (this.fromUrl) {
                urlParams['fromUrl'] = this.fromUrl;
            }
            Utils.refreshPage(this.router, [`/${environment.localization.enquiriesUrl}/edit-student`, urlParams]);
        }
    }

    updateState() {
        $('#stateModal').modal('show');
    }

    activityLogsChanged(activityLogs: ActivityLog[]) {
        this.student.activityLogs = activityLogs;
        this.studentAdditionalJsonData[Keys.student].activityLogs = activityLogs;
        this.editStudentComponent.calculateScore();
    }

    statusChanged(studentStatusId: number) { // callback when we change the student status in the page
        this.studentStateComponent.updateStage(studentStatusId);
    }

    private checkDeclined() {
        let sBrowser = navigator.userAgent;
        const sUsrAg = navigator.userAgent;
        if (sUsrAg.indexOf('Chrome') > -1) {
            sBrowser = 'Google Chrome';
        } else if (sUsrAg.indexOf('Safari') > -1) {
            sBrowser = 'Apple Safari';
        } else if (sUsrAg.indexOf('Opera') > -1) {
            sBrowser = 'Opera';
        } else if (sUsrAg.indexOf('Firefox') > -1) {
            sBrowser = 'Mozilla Firefox';
        } else if (sUsrAg.indexOf('MSIE') > -1) {
            sBrowser = 'Microsoft Internet Explorer';
        }
        if (sBrowser === 'Apple Safari' || sBrowser === 'Microsoft Internet Explorer') {
            const temp = $('#studentStatus option[value=' + this.declinedId + ']');
            if (this.stage.code !== LICode.stage_declined) {
                temp.remove();
            } else {
                $('#studentStatus').append($('<option>', {
                    'ng-reflect-value': this.declinedId,
                    value: this.declinedId,
                    text: this.stage.name
                }));
                this.formGroup.controls[Keys.studentStatusId].setValue(this.declinedId);
                Utils.DetectChanges(this.ref);
            }
        }
    }

    addActivityLog() {
        this.activityLogsComponent.addActivityLog();
    }

    attendAnEvent() {
        this.activityLogsComponent.attendAnEvent();
    }

    attendAnPersonalTour() {
        this.activityLogsComponent.attendAnPersonalTour();
    }

    activityLogsLoaded(val: boolean) {
        this.activityLogsHaveLoaded = val;
    }

    addApplication() {
        const contactId = _.find(this.contactRelationships, (cr: ContactRelationship) => cr.contactType.code === LICode.contact_type_primary).contactId;
        const primaryContact = _.find(this.relatedContacts, (c: Contact) => c.id === contactId);
        const appsNewApplicationDialogRef = this.modalService.open(AppsNewApplicationDialog, Constants.ngbModalMd);
        appsNewApplicationDialogRef.componentInstance.student = this.student;
        appsNewApplicationDialogRef.componentInstance.contact = primaryContact;
        appsNewApplicationDialogRef.result.then((res: { action: ModalAction, formId: string, id: string }) => {
            switch (res.action) {
                case ModalAction.Done:
                    this.router.navigate([`applications/${res.formId}/fillable-forms/update`, res.id]);
                    break;
                default: break;
            }
        });
        this.platformLocation.onPopState(() => {
            appsNewApplicationDialogRef.close({ action: ModalAction.LeavePage });
        });
    }

    public resetExport() {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Resetting the status will mark this Student as no longer being exported to the Student Management System',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn btn-delete',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Yes, reset it!',
            buttonsStyling: false
        }).then((result) => {
            if (result && result.value) {
                this.httpService.getAuth('export-students/reset-student-exported-status/' + this.studentId).then((res: Student) => {
                    this.student = res;
                    Swal.fire({
                        title: 'Success!',
                        text: 'Student marked as not exported',
                        type: 'success',
                        confirmButtonClass: 'btn btn-success',
                        buttonsStyling: false
                    });
                }).catch(err => console.log(err));
            }
        });
    }

    checkForPrimaryContact() {
        const primaryTypeId = _.find(this.contactTypes, ct => ct.code === LICode.contact_type_primary).id;
        this.hasPrimary = Boolean(_.find(this.contactsData, (contact) => contact.relationship.contactTypeId === primaryTypeId));
        this.relationshipTableIsValid = this.hasPrimary;
    }

    setValidation(isValid) {
        this.hasPrimary = isValid;
        this.relationshipTableIsValid = this.hasPrimary;
    }

    newContactRelationships(contacts) {
        this.contactsData = this.editStudentComponent.relatedContacts = contacts;
        this.checkForPrimaryContact();
        this.editStudentComponent.calculateScore();
    }

    export(export2xml: boolean, exportAll: boolean, isExport = false) {
        const studentParams: CustomHttpParams = new CustomHttpParams().generateIdsToInclude([this.studentId]);
        if (export2xml) {
            if (this.exportMapping) {
                this.exportStudent.exportByMapping(this.exportMapping, this.managementSystem, [this.studentId])
                    .then((exportedStudents: Student[]) => {
                        if (!_.isEmpty(exportedStudents)) {
                            this.updateExportStatus(_.head(exportedStudents));
                        }
                    });
            } else {
                this.exportStudent.export2XML(this.managementSystem, studentParams).then((students: Student[]) => {
                    if (!_.isEmpty(students)) {
                        this.updateExportStatus(_.head(students));
                    }
                });
            }
        } else {
            this.exportStudent.export2CSV(isExport, this.managementSystem, studentParams, exportAll).then((students: Student[]) => {
                if (!_.isEmpty(students)) {
                    this.updateExportStatus(_.head(students));
                }
            });
        }
    }

    updateExportStatus(student: Student) {
        this.student.isExported = student.isExported;
        this.student.exportDate = student.exportDate;
        this.isExportedFromApply = false;
    }

    getExportDate() {
        if (this.student.exportDate && this.student.appStudentMapping?.application?.exportDate) {
            const exportDate = moment(this.student.exportDate);
            const applicationExportDate = moment(this.student.appStudentMapping?.application?.exportDate);
            const isApplyExportNewer = applicationExportDate.isAfter(exportDate);
            if (isApplyExportNewer) {
                this.student.exportDate = this.student.appStudentMapping?.application?.exportDate;
                this.isExportedFromApply = true;
            }
        } else if (!this.student.exportDate && this.student.appStudentMapping?.application?.exportDate) {
            this.student.exportDate = this.student.appStudentMapping?.application?.exportDate;
            this.isExportedFromApply = true;
        }
    }

    contactChanged(event) {
        this.contactChangedTrigger = !this.contactChangedTrigger;
        this.getAlumniContactRelationship();
        this.editStudentComponent.getRelatedContacts().then(() => {
            this.editStudentComponent.calculateScore();
        });
    }

    onStudentStatusChange(event) {
        this.studentStatuses = event.studentStatuses;
        this.formGroup.controls.studentStatusId.setValue(event.studentStatusId);

        if (this.stage.code === LICode.stage_declined) {
            this.formGroup.controls.studentStatusId.disable();
        } else {
            this.formGroup.controls.studentStatusId.enable();

            if (event.schoolIntakeYearId) {
                this.student.schoolIntakeYearId = event.schoolIntakeYearId;
                this.studentAdditionalJsonData[Keys.student][Keys.schoolIntakeYearId] = event.schoolIntakeYearId;
                if (this.editStudentComponent) {
                    this.editStudentComponent.studentEditForm.controls.schoolIntakeYearId.setValue(event.schoolIntakeYearId);
                }
            }
            if (event.startingYear) {
                this.student.startingYear = event.startingYear;
                this.studentAdditionalJsonData[Keys.student][Keys.startingYear] = event.startingYear;
                if (this.editStudentComponent) {
                    this.editStudentComponent.studentEditForm.controls.startingYear.setValue(event.startingYear);
                }
            }
        }

        this.studentLogTrigger = !this.studentLogTrigger;
        this.checkDeclined();
        this.subscribeFormChanges(); // subscribe when form is populated
        // Utils.DetectChanges(this.ref); // I do not know do we need this line
    }

    onStageChange(event) {
        this.stage = event;
    }

}
