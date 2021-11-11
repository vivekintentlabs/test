import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators, NG_VALIDATORS } from '@angular/forms';
import { PlatformLocation } from '@angular/common';
import { AmazingTimePickerService } from 'amazing-time-picker';
import { SubscriptionLike as ISubscription } from 'rxjs';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { PersonalTour } from 'app/entities/personal-tour';
import { PersonalTourBooking } from 'app/entities/personal-tour-booking';
import { Student } from 'app/entities/student';
import { Contact } from 'app/entities/contact';
import { User } from 'app/entities/user';

import { UserInfo } from 'app/entities/userInfo';
import { Campus } from 'app/entities/campus';
import { Translation } from 'app/entities/translation';
import { School } from 'app/entities/school';

import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { ModalAction } from 'app/common/enums';

import { HttpService } from 'app/services/http.service';
import { DataService } from 'app/services/data.service';

import { emailChipsValidator } from 'app/validators/email-chips.validator';

import { SelectContactModalComponent } from 'app/components/select-contact-modal/select-contact-modal.component';
import { AddContactModalComponent } from 'app/components/add-contact-modal/add-contact-modal.component';
import { EditStudentModalComponent } from 'app/components/edit-student-modal/edit-student-modal.component';
import { SelectStudentModalComponent } from 'app/components/select-student-modal/select-student-modal.component';

import * as moment from 'moment';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-edit-personal-tour-booking-modal',
    templateUrl: 'edit-personal-tour-booking-modal.component.html',
    styleUrls: ['edit-personal-tour-booking-modal.component.scss'],
    providers: [
        { provide: NG_VALIDATORS, useExisting: emailChipsValidator, multi: true }
    ]
})
export class EditPersonalTourBookingModalComponent implements OnInit, OnDestroy {
    @Input() allPersonalTours?: PersonalTour[];
    @Input() futurePersonalTours: PersonalTour[] = [];
    @Input() personalTourBooking: PersonalTourBooking;
    @Input() fromUrl: string;
    @Input() fromStudentId: number;
    @Input() getStudentContactTour: boolean;
    @Input() belongsToActivityLog: boolean;
    @Input() campuses: Campus[] = [];
    @Input() users: User[] = [];

    public showNew: boolean = Constants.showNew;
    dateDelimiter = Constants.localeFormats.dateDelimiter;
    editPersonalTourBooking: PersonalTourBooking = null;
    personalTours: PersonalTour[] = [];

    public isDirty = false;
    public loaded = false;
    public conducts: Translation[] = null;
    public conductAgreed = null;
    public conductText = '';
    public conductTitle = '';

    personalTourForm: FormGroup;
    private userInfo: UserInfo = null;
    personalTour: PersonalTour = new PersonalTour();
    radios: any[] = [{ value: true, name: 'Create a new personal tour' }, { value: false, name: 'Join existing personal tour' }];
    hasOneCampus: boolean;
    campusId: number | string = null;
    public counter = 0;
    public personalTourCampusIds: number[] = [];
    public campusesWithPersonalTours: Campus[] = [];
    personalToursForCampus: PersonalTour[] = [];
    timePickerSubscription: ISubscription;
    public validEndTime = true;
    promiseForBtn: Promise<any>;
    school: School;
    public existingStudentIds: number[] = []
    public existingContactIds: number[] = []

    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    requiredStringFieldMaxLength = Constants.requiredStringFieldMaxLength;
    requiredMinNumber = Constants.requiredMinNumber;
    maxBookingAttendees = Constants.maxBookingAttendees;

    private isStudentOrContactChanged = false;

    constructor(
        private router: Router,
        private httpService: HttpService,
        private fb: FormBuilder,
        private atp: AmazingTimePickerService,
        private dataService: DataService,
        private modalService: NgbModal,
        private activeModal: NgbActiveModal,
        private platformLocation: PlatformLocation,
    ) { }

    public ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = this.userInfo.campusId || 'all';

        this.findCampusesWithPersonalTours();
        this.campuses = _.filter(this.campuses, (campus: Campus) => campus.campusType !== Campus.CAMPUS_TYPE_UNDECIDED);
        this.campuses = _.orderBy(this.campuses, ['sequence'], 'asc');
        this.conductAgreed = this.personalTourBooking && this.personalTourBooking.conductAgreed ?
            (this.personalTourBooking.conductAgreed == null ? 0 : this.personalTourBooking.conductAgreed) : 0;
        this.getConduct();
        this.hasOneCampus = (this.campuses.length === 1) ? true : false;
        this.findPersonalTours();
        this.getExistingContactsStudents();
    }

    private findPersonalTours() {
        if (this.personalTourBooking) {
            this.editPersonalTourBooking = Utils.clone(this.personalTourBooking);
            if (this.belongsToActivityLog) {
                if (this.futurePersonalTours.length !== 0 || this.personalTourBooking.id) {
                    this.personalTours = [];
                    _.forEach(this.futurePersonalTours, (item: PersonalTour) => {
                        // new registered personalTour will not have included campus object and here will be set by id from campuses array
                        // if not to do it we will have error when we click edit immediatly after new personalTour added
                        if (item.campusId && !item.campus) {
                            item.campus = _.find(this.campuses, campus => campus.id === this.campusId);
                        }
                        this.personalTours.push(item);
                    });
                    if (
                        this.personalTourBooking.personalTourId != null &&
                        _.find(this.personalTours, (item: PersonalTour) => item.id == this.editPersonalTourBooking.personalTourId) == undefined
                    ) {
                        const temp = _.find(this.allPersonalTours, (item: PersonalTour) => item.id == this.editPersonalTourBooking.personalTourId);
                        if (temp != null) {
                            this.personalTours.push(temp);
                        }
                    }
                    if (this.personalTourBooking.personalTourId != null) {
                        let temp = _.find(this.allPersonalTours, (item: PersonalTour) => item.id == this.editPersonalTourBooking.personalTourId);
                        if (this.counter === 0) {
                            this.campusId = temp.campusId;
                        }
                    }
                    this.personalToursForCampus = [];
                    this.findPersonalToursForCampus();
                    if (_.isEmpty(this.personalToursForCampus)) { // if campus does not have personalTours, then show 'All'
                        this.campusId = 'all';
                        this.findPersonalToursForCampus();
                    }

                    this.updateBookingPersonalTour(this.editPersonalTourBooking.personalTourId);
                }
                if (this.counter === 0) {
                    this.createForm(this.personalTour);
                    this.changeLocation(this.personalTourForm.controls.campusId.value);
                }
            }
            // get campusId of the first student as default campusId for new personalTours
            if (!this.campusId && this.editPersonalTourBooking.students.length !== 0) {
                this.campusId = this.editPersonalTourBooking.students[0].campusId;
            }
            // if the booking is new then we set this.isDirty to false,
            // since we should always be able to save, regardless if we change something in the popup
            this.isDirty = (this.personalTourBooking.id) ? false : true;
        }
    }

    public campusChanged(value: number | string) {
        this.counter++;
        this.campusId = value;
        this.findPersonalTours();
    }

    findPersonalToursForCampus() {
        this.personalToursForCampus = (this.campusId !== null && this.campusId !== 'all')
            ? _.filter(this.personalTours, (item: PersonalTour) => item.campusId === this.campusId) : this.personalTours;
    }

    public findCampusesWithPersonalTours() {
        this.personalTourCampusIds = [];
        _.forEach(this.futurePersonalTours, (item) => {
            this.personalTourCampusIds.push(item.campusId);
        });
        this.campusesWithPersonalTours = _.filter(this.campuses, (c: Campus) => _.includes(this.personalTourCampusIds, c.id));
    }

    public getConduct() {
        this.dataService.getAuth('webform/get-conduct').then((conducts: Translation[]) => {
            this.conducts = conducts;
            this.school = _.first(conducts).school;
            this.conductTitle = Utils.getTranslation(conducts, Constants.translationPrefix.fd, Constants.webFormFields.displayConduct, Translation.SUBCATEGORY_GENERAL, Translation.CATEGORY_WEBFORM);
            this.transformText();
        }).catch(err => console.log(err));
    }

    public transformText() {
        const text = Utils.getTranslation(this.conducts, Constants.translationPrefix.fl, Constants.webFormFields.displayConduct, Translation.SUBCATEGORY_GENERAL, Translation.CATEGORY_WEBFORM);
        const transformedText = Utils.replaceTag(text, '&lt; SCHOOL NAME &gt;', this.school ? this.school.name : '');
        this.conductText = transformedText;
    }

    public changeConduct() {
        this.conductAgreed = !this.conductAgreed;
        this.markFormAsDirty();
    }

    private createForm(personalTour?: PersonalTour) {
        this.personalTourForm = this.fb.group({
            id: [personalTour.id],
            date: [
                {
                    value: (personalTour.date) ? moment(personalTour.date).toDate() : null,
                    disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true
                },
                Validators.compose([Validators.required])
            ],
            time: [
                { value: personalTour.time, disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true },
                Validators.compose([Validators.required, Validators.pattern(Constants.timePattern)])
            ],
            endTime: [
                { value: personalTour.endTime, disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true },
                Validators.compose([Validators.required, Validators.pattern(Constants.timePattern)])
            ],
            assigneeId: [(this.personalTourBooking.id == null && !this.userInfo.isSysAdmin()) ? this.userInfo.id
                : personalTour.assigneeId, Validators.required],
            cc: [
                { value: personalTour.cc, disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true },
                Validators.compose([emailChipsValidator])
            ],
            isNew: [(this.personalTourBooking.personalTourId != null) ? false : this.belongsToActivityLog],
            campusId: [
                (personalTour.campusId) ? personalTour.campusId : this.userInfo.mainCampusId,
                Validators.compose([Validators.required])],
            campusWithPersonalToursId: (personalTour.campusId) ? personalTour.campusId : this.campusId,
            validator: [this.validEndTime, Validators.compose([Validators.requiredTrue])
            ],
            location: [
                { value: personalTour.location, disabled: !this.userInfo.isSchoolEditorOrHigher() },
                Validators.compose([
                    Validators.minLength(this.requiredTextFieldMinLength),
                    Validators.maxLength(this.requiredStringFieldMaxLength),
                    Validators.required
                ])
            ],
        });
        this.loaded = true;
    }

    timeChanged(timeControl, defaultTime, name) {
        const amazingTimePicker = this.atp.open({
            time: (timeControl.value !== undefined ? timeControl.value : defaultTime),
            theme: 'material-purple'
        });
        this.timePickerSubscription = amazingTimePicker.afterClose().subscribe(time => {
            if (name === 'startTime' && this.personalTourForm.controls.endTime.value === undefined) {
                defaultTime = Utils.getEndTime(time, Constants.defaultTimeDifferenceInS)
                this.personalTourForm.controls.endTime.setValue(defaultTime)
            } else if (name === 'startTime' && this.personalTourForm.controls.endTime.value !== undefined) {
                const timeDifference = Utils.getTimeDifferenceInS(this.personalTourForm.controls.time.value, this.personalTourForm.controls.endTime.value)
                defaultTime = Utils.getEndTime(time, timeDifference)
                this.personalTourForm.controls.endTime.setValue(defaultTime)
            }
            timeControl.setValue(time);
            this.personalTourForm.markAsDirty();
            this.validEndTime = Utils.startTimeIsBeforeEndTime(
                (this.personalTourForm && this.personalTourForm.controls.time.value ? this.personalTourForm.controls.time.value
                    : defaultTime),
                (this.personalTourForm && this.personalTourForm.controls.endTime.value ? this.personalTourForm.controls.endTime.value
                    : defaultTime))
            this.personalTourForm.controls['validator'].setValue(this.validEndTime);
        });
    }

    isNew(value: boolean) {
        this.belongsToActivityLog = value;
        this.markFormAsDirty();
    }

    personalTourChangedNew(value: number) {
        this.markFormAsDirty();
        this.updateBookingPersonalTour(value);
    }

    private updateBookingPersonalTour(personalTourId) {
        // get the first tour if this is a new booking.
        this.editPersonalTourBooking.personalTourId = (!this.editPersonalTourBooking || !this.editPersonalTourBooking.personalTourId)
            ? this.personalToursForCampus[0].id
            : this.editPersonalTourBooking.personalTourId;
        const changedPersonalTour = _.find(this.allPersonalTours, pt => pt.id === this.editPersonalTourBooking.personalTourId);
        this.editPersonalTourBooking.personalTour = Utils.clone(changedPersonalTour);
    }

    onSubmit() {
        this.dataService.resetPageDependentData();
        this.saveBookingData().then(() => {
            Utils.showSuccessNotification();
            this.activeModal.close({ action: ModalAction.Update, updatedBooking: this.editPersonalTourBooking });
        }).catch((err) => console.log(err));
    }

    private saveBookingData(): Promise<any> {
        return this.promiseForBtn = new Promise<void>((resolve, reject) => {
            this.editPersonalTourBooking.conductAgreed = this.conductAgreed;
            if (this.belongsToActivityLog && this.personalTourForm.controls.isNew.value) {
                this.personalTourForm.controls.date.setValue(
                    moment(this.personalTourForm.controls.date.value).format(Constants.dateFormats.date)
                );
                this.editPersonalTourBooking.id = null;
                this.httpService.postAuth('personal-tour/add-with-booking',
                    { personalTour: this.personalTourForm.value, personalTourBooking: this.editPersonalTourBooking }
                ).then((updatedPersonalTourBooking: PersonalTourBooking) => {
                    this.editPersonalTourBooking.id = updatedPersonalTourBooking.id;
                    this.editPersonalTourBooking.createdAt = updatedPersonalTourBooking.createdAt;
                    this.editPersonalTourBooking.personalTour = this.personalTourForm.value;
                    this.editPersonalTourBooking.personalTourId = updatedPersonalTourBooking.personalTourId;
                    this.editPersonalTourBooking.personalTour.id = updatedPersonalTourBooking.personalTourId;
                    resolve();
                }).catch((err) => {
                    console.log(err);
                    reject(err);
                });
            } else {
                this.httpService.postAuth(
                    'personal-tour-booking/update', this.editPersonalTourBooking
                ).then((updatedPersonalTourBooking: PersonalTourBooking) => {
                    this.editPersonalTourBooking.id = updatedPersonalTourBooking.id;
                    this.editPersonalTourBooking.createdAt = updatedPersonalTourBooking.createdAt;
                    resolve();
                }).catch((err) => {
                    console.log(err);
                    reject(err);
                });
            }
        })
    }

    onCancel() {
        this.conductAgreed = this.editPersonalTourBooking.conductAgreed;
        this.markFormAsPristine();

        if (this.isStudentOrContactChanged) {
            this.personalTourBooking.contacts = _.clone(this.editPersonalTourBooking.contacts);
            this.personalTourBooking.students = _.clone(this.editPersonalTourBooking.students);
            this.activeModal.close({ action: ModalAction.Update, updatedBooking: this.personalTourBooking });
        } else {
            this.activeModal.close({ action: ModalAction.Cancel });
        }

    }

    editStudent(studentId) {
        if (studentId) {
            const editStudentModaltRef = this.modalService.open(EditStudentModalComponent, Constants.ngbModalLg);
            editStudentModaltRef.componentInstance.studentId = studentId;
            editStudentModaltRef.result.then((res: { action: ModalAction, changedStudent?: Student }) => {
                switch (res.action) {
                    case ModalAction.Update: this.studentIsChanged(res.changedStudent); break;
                    default: break;
                }
            });
            this.platformLocation.onPopState(() => {
                editStudentModaltRef.close({ action: ModalAction.LeavePage });
            });
        }
    }

    private studentIsChanged(changedStudent: Student) {
        _.forEach(this.editPersonalTourBooking.students, student => {
            if (student.id === changedStudent.id) {
                student.firstName = changedStudent.firstName;
                student.lastName = changedStudent.lastName;
                this.isStudentOrContactChanged = true;
                // this.markFormAsDirty();
            }
        });
    }

    addNewStudent() {
        this.saveBookingIfPageLeave().then(() => {
            this.router.navigate([`/${environment.localization.enquiriesUrl}/add-student`, this.getParams()]);
        });
    }

    private getParams() {
        return {
            personalTourId: this.personalTourBooking.personalTourId,
            personalTourBookingId: this.personalTourBooking.id,
            fromUrl: this.fromUrl,
            fromStudentId: this.fromStudentId
        };
    }

    editContact(contactId) {
        if (contactId) {
            const addContactModalRef = this.modalService.open(AddContactModalComponent, Constants.ngbModalLg);
            addContactModalRef.componentInstance.contactId = contactId;
            addContactModalRef.componentInstance.hideRelationship = true;
            addContactModalRef.result.then((res: { action: ModalAction, changedContact?: Contact }) => {
                switch (res.action) {
                    case ModalAction.Update: this.contactIsChanged(res.changedContact); break;
                    default: break;
                }
            });
            this.platformLocation.onPopState(() => {
                addContactModalRef.close({ action: ModalAction.LeavePage });
            });
        }
    }

    private contactIsChanged(changedContact: Contact) {
        if (changedContact) {
            _.forEach(this.editPersonalTourBooking.contacts, contact => {
                if (contact.id === changedContact.id) {
                    contact.firstName = changedContact.firstName;
                    contact.lastName = changedContact.lastName;
                    this.isStudentOrContactChanged = true;
                }
            });
            this.markFormAsDirty();
        }
    }

    addNewContact() {
        this.saveBookingIfPageLeave().then(() => {
            this.router.navigate([`/${environment.localization.enquiriesUrl}/edit-contact/`, this.getParams()]);
        });
    }

    selectContact() {
        const selectContactModalRef = this.modalService.open(SelectContactModalComponent, Constants.ngbModalLg);
        selectContactModalRef.componentInstance.contact = 'contact';
        selectContactModalRef.componentInstance.existingContactIds = this.existingContactIds;
        selectContactModalRef.result.then((res: { action: ModalAction, selectedContact?: Contact }) => {
            switch (res.action) {
                case ModalAction.Select: this.onSelectContactForBooking(res.selectedContact); break;
                default: break;
            }
        });
        this.platformLocation.onPopState(() => {
            selectContactModalRef.close({ action: ModalAction.LeavePage });
        });
    }

    selectStudent() {
        const selectStudentModaltRef = this.modalService.open(SelectStudentModalComponent, Constants.ngbModalLg);
        selectStudentModaltRef.componentInstance.addNewStudent = false;
        selectStudentModaltRef.componentInstance.existingStudentIds = this.existingStudentIds;
        selectStudentModaltRef.result.then((res: { action: ModalAction, selectedStudent?: Student }) => {
            switch (res.action) {
                case ModalAction.Select: this.onStudentSelect(res.selectedStudent); break;
                default: break;
            }
        });
        this.platformLocation.onPopState(() => {
            selectStudentModaltRef.close({ action: ModalAction.LeavePage });
        });
    }

    private saveBookingIfPageLeave(): Promise<void> {
        return new Promise((resolve, reject) => {
            Swal.fire({
                title: 'Are you sure?',
                text: 'Before leaving this page current data for this booking will be saved!',
                type: 'warning',
                showCancelButton: true,
                confirmButtonClass: 'btn btn-success',
                cancelButtonClass: 'btn btn-cancel',
                confirmButtonText: 'Yes, save it!',
                buttonsStyling: false
            }).then((result) => {
                if (result && result.value) {
                    this.saveBookingData().then(() => {
                        this.activeModal.close({ action: ModalAction.Cancel });
                        resolve();
                    }).catch(err => {
                        console.log(err);
                        reject();
                    });
                }
            });
        });
    }

    private onSelectContactForBooking(selectedContact: Contact) {
        this.getRelatedStudents(selectedContact.id)
        selectedContact.PersonalTourContact = {
            personalTourBookingId: this.editPersonalTourBooking.id, contactId: selectedContact.id, checkedIn: false
        };
        this.editPersonalTourBooking.contacts = _.unionBy(this.editPersonalTourBooking.contacts, [selectedContact], 'id');
        this.markFormAsDirty();
    }

    getRelatedStudents(contactId: number) {
        let relatedStudents: Student[] = [];
        return this.httpService.getAuth('contact/' + contactId + '/related-students/').then((result) => {
            relatedStudents = result['students'];
            _.forEach(relatedStudents, (student: Student) => {
                student.PersonalTourStudent = {
                    personalTourBookingId: this.editPersonalTourBooking.id, studentId: student.id, checkedIn: false
                };
                this.editPersonalTourBooking.students = _.unionBy(this.editPersonalTourBooking.students, [student], 'id');
            });
        });
    }

    onStudentSelect(student: any) {
        student.PersonalTourStudent = { personalTourBookingId: this.editPersonalTourBooking.id, studentId: student.id, checkedIn: false };
        this.editPersonalTourBooking.students = _.unionBy(this.editPersonalTourBooking.students, [student], 'id');
        return this.httpService.getAuth('student/' + student.id + '/related-contacts/').then((result) => {
            const relatedContacts = result['contacts'];
            _.forEach(relatedContacts, (contact: Contact) => {
                contact.PersonalTourContact = {
                    personalTourBookingId: this.editPersonalTourBooking.id, contactId: contact.id, checkedIn: false
                };
                this.editPersonalTourBooking.contacts = _.unionBy(this.editPersonalTourBooking.contacts, [contact], 'id');
            });
            this.markFormAsDirty();
        });
    }

    markFormAsDirty() {
        this.isDirty = true;
        this.getExistingContactsStudents()
    }

    markFormAsPristine() {
        this.isDirty = false;
    }

    private getExistingContactsStudents() {
        this.existingStudentIds = [];
        this.existingContactIds = [];
        if (this.editPersonalTourBooking) {
            this.editPersonalTourBooking.students.forEach(student => {
                this.existingStudentIds.push(student.id)
            });
            this.editPersonalTourBooking.contacts.forEach(contact => {
                this.existingContactIds.push(contact.id)
            });
        }
    }

    deleteContact(id: number) {
        _.remove(this.editPersonalTourBooking.contacts, (contact: any) => contact.id === id);
        this.markFormAsDirty();
    }

    deleteStudent(id) {
        _.remove(this.editPersonalTourBooking.students, (student: any) => student.id === id);
        this.markFormAsDirty();
    }

    checkInStudent(value: boolean, item: Student) {
        const student = _(this.editPersonalTourBooking.students).find((i: any) => i.id === item.id).PersonalTourStudent;
        student.checkedIn = value;
        this.markFormAsDirty();
    }

    checkInContact(value: boolean, item: Contact) {
        const contact = _(this.editPersonalTourBooking.contacts).find((i: any) => i.id === item.id).PersonalTourContact;
        contact.checkedIn = value;
        this.markFormAsDirty();
    }

    checkInOtherAttendants(otherAttendeesCheckedIn: boolean) {
        this.editPersonalTourBooking.otherAttendeesCheckedIn = otherAttendeesCheckedIn;
        this.markFormAsDirty();
    }

    changeOtherAttendees(val: number) {
        if (val === null || val < 0) {
            this.editPersonalTourBooking.otherAttendeesCheckedIn = false;
            this.markFormAsPristine();
        } else {
            this.markFormAsDirty();
        }
    }

    changeTotalAttendees(val: number) {
        if (val === null || val < 0 || val === 0) {
            this.markFormAsPristine();
        } else {
            this.markFormAsDirty();
        }
    }

    changeVisitorType(val: boolean) {
        this.markFormAsDirty();
        this.editPersonalTourBooking.isFirstVisit = val;
    }

    changeLocation(campusId: number) {
        const campus = _.find(this.campuses, c => c.id === campusId);
        const location = Utils.getLocationByCampus(campus);
        this.personalTourForm.controls.location.setValue(location);
    }

    ngOnDestroy() {
        if (this.timePickerSubscription) {
            this.timePickerSubscription.unsubscribe();
        }
    }
}
