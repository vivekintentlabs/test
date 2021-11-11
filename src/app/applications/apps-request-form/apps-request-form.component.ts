import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';

import { Utils, Colors } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { ContactClaim } from 'app/common/interfaces';
import { Contact } from 'app/entities/contact';
import { Student } from 'app/entities/student';
import { emailValidator } from 'app/validators/email.validator';
import { ApplicationsService } from 'app/applications/applications.service';
import { AppRequest } from 'app/applications/interfaces/app-request';
import { AppStudentFillableFormInfo } from '../interfaces/app-student-fillableform-info';
import { ApplicationStatus } from 'app/common/enums';
import { MergeAppRequestInfoDTO } from 'app/common/dto/merge-app-request-info';

import * as _ from 'lodash';

enum SubmitStatus {
    NewContactStudent = -1,
    NewStudent = -2
}

type StudentWithFillableFormInfo = Student & AppStudentFillableFormInfo

@Component({
    selector: 'apps-request-form',
    templateUrl: 'apps-request-form.component.html',
    styleUrls: ['apps-request-form.component.scss']
})

export class AppsRequestFormComponent implements OnInit, AfterViewInit {
    readonly TOTAL_PAGES: number = 3;
    requestForm: FormGroup = null;
    displayedContactColumns: string[] = ['name', 'updated', 'address', 'mobile', 'actions'];
    displayedStudentColumns: string[] = ['name', 'updated', 'status', 'actions'];
    dataSourceContacts: MatTableDataSource<Contact>;
    dataSourceStudents: MatTableDataSource<Student>;
    date = Constants.localeFormats.dateTimeShort;
    @ViewChild('stepper') private myStepper: MatStepper;

    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    nameMaxLength = Constants.nameMaxLength;
    shouldHideContacts = true;
    shouldHideStudents = true;
    selectedContact: Contact = null;
    contactClaim: ContactClaim = null;
    SubmitStatus: typeof SubmitStatus = SubmitStatus;
    readonly SITE_KEY = Constants.reCaptchaV2SiteKey;
    captchaResponse = null;
    appRequestIntroduction = '';
    emptyAppPublishedFormMsg = null;
    private formId: string;

    promiseForBtn: Promise<any>;

    constructor(
        private router: Router,
        public appsService: ApplicationsService,
        private route: ActivatedRoute,
        private fb: FormBuilder,
        private elementRef: ElementRef
    ) { }

    /**
     * Inits component data, a native callback method
     * @return {void}
     */
    ngOnInit() {
        const schoolUniqId = this.route.params['value'].schoolUniqId;
        this.formId = this.route.params['value'].formId;
        return this.appsService.getAppRequestIntroduction(schoolUniqId, this.formId, 1)
        .then((appRequestInfo: MergeAppRequestInfoDTO) => {
            if (appRequestInfo.hasPublishedForm) {
                if (appRequestInfo.introductionText) this.appRequestIntroduction = appRequestInfo.introductionText;
                this.requestForm = this.fb.group({
                    schoolUniqId: schoolUniqId,
                    email: ['', Validators.compose([
                        Validators.required,
                        emailValidator,
                        Validators.minLength(Constants.emailMinLength),
                        Validators.maxLength(Constants.emailMaxLength)
                    ])
                    ],
                    code: ['', Validators.compose([
                        Validators.required,
                        Validators.pattern(Constants.digitsPattern),
                        Validators.minLength(6),
                        Validators.maxLength(6)
                    ])
                    ],
                    contactFirstName: ['', Validators.compose([
                        Validators.required,
                        Validators.minLength(this.requiredTextFieldMinLength),
                        Validators.maxLength(this.nameMaxLength)
                    ])],
                    contactLastName: ['', Validators.compose([
                        Validators.required,
                        Validators.minLength(this.requiredTextFieldMinLength),
                        Validators.maxLength(this.nameMaxLength)
                    ])],
                    studentFirstName: ['', Validators.compose([
                        Validators.required,
                        Validators.minLength(this.requiredTextFieldMinLength),
                        Validators.maxLength(this.nameMaxLength)
                    ])],
                    studentLastName: ['', Validators.compose([
                        Validators.required,
                        Validators.minLength(this.requiredTextFieldMinLength),
                        Validators.maxLength(this.nameMaxLength)
                    ])]
                });
            } else {
                this.emptyAppPublishedFormMsg = Constants.emptyAppPublishedForm;
            }
            return appRequestInfo;
        });
    }

    ngAfterViewInit() {
        this.elementRef.nativeElement.ownerDocument.body.style.backgroundColor = '#fff';
        Utils.onElementHeightChange(document.body, '');
    }

    captchaResolved(captchaResponse: string) {
        this.captchaResponse = captchaResponse;
    }

    selectContactItem(status: boolean, id: number) {
        if (status) {
            const contact: Contact = _.find(this.dataSourceContacts.data, c => c.id === id);
            this.selectedContact = contact;
            const students = _.map(contact.contactRelationships, 'student');
            this.shouldHideStudents = (students.length < 1);
            this.dataSourceStudents.data = students;
        }
    }

    backFromSummary() {
        if (!this.dataSourceContacts) {
            this.myStepper.selectedIndex = this.TOTAL_PAGES / 2;
        } else {
            this.myStepper.previous();
        }
    }

    getAppButtonText(appFillableFormInfo: AppStudentFillableFormInfo) {
        let res = 'Start Application';
        if (appFillableFormInfo?.applicationStatus === ApplicationStatus.InProgress) {
            res = (appFillableFormInfo?.isTaken) ? 'Application In Progress' : 'Continue Application';
        } else if (appFillableFormInfo?.isSnapshot) {
            res = (appFillableFormInfo?.isTaken) ? 'Application Is Submitted' : 'View Application';
        }
        return res;
    }

    private getNewContact(): Contact {
        const contact: Contact = new Contact();
        contact.firstName = this.requestForm.controls.contactFirstName.value;
        contact.lastName = this.requestForm.controls.contactLastName.value;
        contact.email = this.requestForm.controls.email.value;
        contact.schoolId = this.contactClaim.schoolId;
        return contact;
    }

    private getNewStudent(): Student {
        const student: Student = new Student();
        student.firstName = this.requestForm.controls.studentFirstName.value;
        student.lastName = this.requestForm.controls.studentLastName.value;
        student.schoolId = this.contactClaim.schoolId;
        student.campusId = this.contactClaim.mainCampusId;
        student.contacts = [];
        return student;
    }

    handleApplication(appFillableFormInfo: StudentWithFillableFormInfo, docId: number) {
        if (appFillableFormInfo?.applicationStatus === ApplicationStatus.InProgress) {
            this.continueApplication(appFillableFormInfo.applicationId);
        } else if (appFillableFormInfo?.isSnapshot) {
            this.viewApplication(appFillableFormInfo.applicationId);
        } else {
            this.startApplication(docId);
        }
    }

    startApplication(id: number) {
        let selectedStudent: Student;
        switch (id) {
            case SubmitStatus.NewContactStudent:
                this.selectedContact = this.getNewContact();
                selectedStudent = this.getNewStudent();
                break;
            case SubmitStatus.NewStudent:
                selectedStudent = this.getNewStudent();
                break;
            default:
                selectedStudent = _.find(this.dataSourceStudents.data, s => s.id === id);
                break;
        }

        Utils.showNotification(`Starting application`, Colors.info);
        return this.promiseForBtn = this.appsService.createFillableFormWithContactAndStudent(this.formId, this.selectedContact, selectedStudent).then((res) => {
            if (res?.docId) {
                this.router.navigate([`/application/${this.formId}/${res.docId}`]);
            }
        }).catch(err => {
            console.log(err);
            this.promiseForBtn = null;
        });
    }

    continueApplication(applicationId: string) {
        if (applicationId) {
            return this.appsService.setContactToken(this.selectedContact.id)
            .then(() => {
                this.router.navigate([`/application/${this.formId}/${applicationId}`]);
            });
        }
    }

    viewApplication(applicationId: string) {
        if (applicationId) {
            return this.appsService.setContactToken(this.selectedContact.id)
            .then(() => {
                this.router.navigate([`${this.formId}/fillable-forms/${applicationId}`]);
            });
        }
    }

    sendVerification() {
        return this.promiseForBtn = this.appsService.sendVerification(
            this.requestForm.controls.email.value,
            this.captchaResponse,
            this.requestForm.controls.schoolUniqId.value
        ).then((res) => {
            if (res && res.status === 'success') {
                this.myStepper.next();
                this.captchaResponse = null;
            }
            this.promiseForBtn = null;
        }).catch((err) => {
            console.log(err);
            this.promiseForBtn = null;
        });
    }

    resendVerification() {
        return this.promiseForBtn = this.appsService.resendVerification(this.requestForm.controls.email.value,
            this.requestForm.controls.schoolUniqId.value).then((res) => {
                if (res && res.status === 'warning') {
                    Utils.showNotification(res.msg, Colors.warning);
                } else if (res && res.status === 'success') {
                    Utils.showNotification(res.msg, Colors.info);
                }
                this.promiseForBtn = null;
            }).catch(err => {
                console.log(err);
                this.promiseForBtn = null;
            });
    }

    checkVerification() {
        const data: AppRequest = {
            email: this.requestForm.controls.email.value,
            code: +this.requestForm.controls.code.value,
            schoolUniqId: this.requestForm.controls.schoolUniqId.value
        };

        return this.promiseForBtn = this.appsService.checkVerification(data).then((res) => {
            if (res) {
                return this.proceedWithContacts();
            } else {
                Utils.showNotification(`Code is not valid`, Colors.danger);
            }
        }).then(() => {
            this.promiseForBtn = null;
        }).catch(err => {
            console.log(err);
            this.promiseForBtn = null;
        });
    }

    private proceedWithContacts() {
        this.contactClaim = Utils.getContactInfoFromToken();
        return this.appsService.getContactsByEmail(this.requestForm.controls.email.value, this.formId)
            .then((filteredContacts: Contact[]) => {
                if (filteredContacts.length === 1) {
                    this.displayedContactColumns.splice(-1, 1);
                }
                this.shouldHideContacts = (filteredContacts.length < 1);

                if (filteredContacts.length < 1) {
                    this.myStepper.selectedIndex = this.TOTAL_PAGES;
                    return filteredContacts;
                }

                this.myStepper.next();
                this.dataSourceContacts = Utils.createSortCaseInsensitiveMatTable<Contact>([]);
                this.dataSourceContacts.data = filteredContacts;
                this.dataSourceContacts.sortingDataAccessor = (item, property) => {
                    switch (property) {
                        default: return _.toLower(_.get(item, property));
                    }
                };

                this.dataSourceStudents = Utils.createSortCaseInsensitiveMatTable<Student>([]);
                this.dataSourceStudents.data = [];
                this.dataSourceStudents.sortingDataAccessor = (item, property) => {
                    switch (property) {
                        default: return _.toLower(_.get(item, property));
                    }
                };

                if (filteredContacts.length === 1) {
                    this.selectContactItem(true, filteredContacts[0].id);
                }
                return filteredContacts;
            });
    }
}
