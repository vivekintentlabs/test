import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';
import { PlatformLocation } from '@angular/common';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Event } from 'app/entities/event';
import { Booking } from 'app/entities/booking';
import { Student } from 'app/entities/student';
import { Contact } from 'app/entities/contact';
import { UserInfo } from 'app/entities/userInfo';
import { Campus } from 'app/entities/campus';
import { Translation } from 'app/entities/translation';
import { School } from 'app/entities/school';

import { Constants } from 'app/common/constants';
import { Utils } from 'app/common/utils';
import { ModalAction } from 'app/common/enums';

import { HttpService } from 'app/services/http.service';
import { ListenerService } from 'app/services/listener.service';
import { DataService } from 'app/services/data.service';
import { LocaleService } from 'app/services/locale.service';
import { EditBookingModalService } from './edit-booking-modal.service';

import { SelectContactModalComponent } from 'app/components/select-contact-modal/select-contact-modal.component';
import { AddContactModalComponent } from 'app/components/add-contact-modal/add-contact-modal.component';
import { SelectStudentModalComponent } from 'app/components/select-student-modal/select-student-modal.component';
import { EditStudentModalComponent } from 'app/components/edit-student-modal/edit-student-modal.component';

import * as moment from 'moment';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { environment } from 'environments/environment';

declare var $: any;

@Component({
    selector: 'app-edit-booking-modal',
    templateUrl: 'edit-booking-modal.component.html',
    styleUrls: ['edit-booking-modal.component.scss'],
    providers: [EditBookingModalService]
})
export class EditBookingModalComponent implements OnInit {
    @Input() allEvents?: Event[];
    @Input() futureEvents: Event[] = [];
    @Input() booking: Booking;
    @Input() event: Event;
    @Input() fromUrl: string;
    @Input() fromStudentId: number;
    @Input() getStudentContactBooking: boolean;
    @Input() campuses: Campus[] = [];

    showNew: boolean = Constants.showNew;
    dateDelimiter = Constants.localeFormats.dateDelimiter;
    requiredMinNumber = Constants.requiredMinNumber;
    maxBookingAttendees = Constants.maxBookingAttendees;
    messageMaxLength = Constants.messageMaxLength;
    almostFullMessageField = Constants.almostFullMessageField;
    editBooking: Booking = null;
    events: Event[] = [];
    public eventsForCampus: Event[] = [];
    private userInfo: UserInfo = null;

    public submitted = true;
    hasOneCampus: boolean;
    public isNewBooking: boolean;
    public conducts: Translation[] = null;
    public conductAgreed = null;
    public conductText = '';
    public conductTitle = '';
    public campusId: number | string;
    public eventCampusIds: number[] = [];
    public campusesWithEvents: Campus[] = [];
    public campus: Campus | any = null;
    public counter = 0;
    public messageIsEditable = true;
    public message: string = null;
    school: School;
    public existingStudentIds: number[] = [];
    public existingContactIds: number[] = [];
    bookingTime: string;
    bookingDate: string;

    promiseForBtn: Promise<any>;
    bookingForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private httpService: HttpService,
        private listenerService: ListenerService,
        private dataService: DataService,
        private localeService: LocaleService,
        private editBookingService: EditBookingModalService,
        private modalService: NgbModal,
        private activeModal: NgbActiveModal,
        private platformLocation: PlatformLocation,
    ) { }

    public ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = this.userInfo.campusId || 'all';

        this.findCampusesWithEvents();
        this.conductAgreed = (this.booking && this.booking.conductAgreed)
            ? (this.booking.conductAgreed == null ? 0 : this.booking.conductAgreed)
            : 0;
        this.getConduct();
        this.isNewBooking = this.booking ? (this.booking.id ? false : true) : true;
        this.hasOneCampus = (this.campuses.length === 1) ? true : false;
        this.findEvents();
        this.getExistingContactsStudents();
        if (this.booking) {
            const createdAtInCampusTZ = moment.tz(this.booking.createdAt, this.event.campus.timeZoneId);
            this.bookingTime = createdAtInCampusTZ.format(Constants.dateFormats.timeShort);
            this.bookingDate = this.localeService.transformLocaleDate(createdAtInCampusTZ, Constants.localeFormats.dateDelimiter);
        }
    }

    findEvents() {
        if (this.booking) {
            this.editBooking = _.cloneDeep(this.booking);
            if (this.allEvents != null) {
                this.events = [];
                _.forEach(this.futureEvents, (item) => {
                    item.time = moment(item.time, Constants.dateFormats.time).format(Constants.dateFormats.timeShort);
                    this.events.push(item);
                });

                if (this.booking.eventId && !_.find(this.events, (item: Event) => item.id === this.editBooking.eventId)) {
                    const temp = _.find(this.allEvents, (item: Event) => item.id === this.editBooking.eventId);
                    this.events.push(temp);
                }

                if (this.booking.eventId) {
                    const temp = _.find(this.allEvents, (item: Event) => item.id === this.editBooking.eventId);
                    if (this.counter === 0) {
                        this.campusId = temp.campusId;
                    }
                }
                this.eventsForCampus = [];
                this.findEventsForCampus();
                if (_.isEmpty(this.eventsForCampus)) { // if campus does not have events, then show 'All'
                    this.campusId = 'all';
                    this.findEventsForCampus();
                }

                this.updateBookingEvent();
            }
            this.createBookingForm();
            this.submitted = (this.booking.id) ? true : false;
        }
        this.messageIsEditable = this.editBooking ? (this.editBooking.messageIsEditable !== false ? true : false) : true;
    }

    findEventsForCampus() {
        this.eventsForCampus = (this.campusId != null && this.campusId !== 'all')
            ? _.filter(this.events, (item: Event) => item.campusId === this.campusId) : this.events;
    }

    public findCampusesWithEvents() {
        this.eventCampusIds = [];
        _.forEach(this.futureEvents, (item) => {
            this.eventCampusIds.push(item.campusId);
        });
        this.campusesWithEvents = _.filter(this.campuses, (c: Campus) => _.includes(this.eventCampusIds, c.id));
        this.campusesWithEvents = _.orderBy(this.campusesWithEvents, ['sequence'], 'asc');
    }

    protected createBookingForm() {
        const value = this.event
            ? (this.event.isMultipleSubtours ? this.editBooking.subTours : this.editBooking.subTours[0] || null)
            : null;
        if (this.bookingForm) {
            this.bookingForm.reset();
            this.bookingForm.controls.subTours.setValue(value);
        } else {
            this.bookingForm = this.fb.group({
                subTours: [value],
            });
        }
    }

    public getConduct() {
        this.dataService.getAuth('webform/get-conduct').then((conducts: Translation[]) => {
            this.conducts = conducts;
            this.school = _.first(conducts).school;
            this.conductTitle = Utils.getTranslation(
                conducts, Constants.translationPrefix.fd, Constants.webFormFields.displayConduct,
                Translation.SUBCATEGORY_GENERAL, Translation.CATEGORY_WEBFORM
            );
            this.transformText();
        }).catch(err => console.log(err));
    }

    public transformText() {
        const text = Utils.getTranslation(
            this.conducts, Constants.translationPrefix.fl, Constants.webFormFields.displayConduct,
            Translation.SUBCATEGORY_GENERAL, Translation.CATEGORY_WEBFORM
        );
        const transformedText = Utils.replaceTag(text, '&lt; SCHOOL NAME &gt;', this.school ? this.school.name : '');
        this.conductText = transformedText;
    }

    public campusChanged(value: number | string) {
        this.counter++;
        this.campusId = value;
        this.findEvents();
    }

    public changeConduct() {
        this.conductAgreed = !this.conductAgreed;
        this.markFormAsDirty();
    }

    eventChangedNew() {
        this.markFormAsDirty();
        this.updateBookingEvent();
    }

    private updateBookingEvent() {
        // get the first event if this is a new booking.
        const eventId = this.editBooking.eventId || this.eventsForCampus[0].id;
        const changedEvent: Event = _.find(this.allEvents, (event) => event.id === eventId);
        this.editBooking.event = _.cloneDeep(changedEvent);
        this.editBooking.eventId = this.editBooking.eventId === undefined ? eventId : this.editBooking.eventId;
        this.event = _.cloneDeep(changedEvent);
    }

    onSubmit() {
        this.dataService.resetPageDependentData();
        this.saveBookingData().then(() => {
            this.emitData();
            Utils.showSuccessNotification();
            this.lastaction();
        }).catch(err => {
            console.error(err);
        });
    }

    private emitData(studentsAndContactsOnly = false) {
        if (studentsAndContactsOnly) {
            if (!this.isNewBooking) {
                const tmpBooking = _.cloneDeep(this.booking);

                // get existing student/contact ids
                const studentIds = _.map(tmpBooking.students, s => s.id);
                const contactIds = _.map(tmpBooking.contacts, c => c.id);
                // get existing students/contacts
                const tmpStudents = _.filter(this.editBooking.students, s => _.includes(studentIds, s.id));
                const tmpContacts = _.filter(this.editBooking.contacts, c => _.includes(contactIds, c.id));

                if (!_.isEmpty(tmpStudents)) {
                    tmpBooking.students = _.cloneDeep(tmpStudents);
                }
                if (!_.isEmpty(tmpContacts)) {
                    tmpBooking.contacts = _.cloneDeep(tmpContacts);
                }
                this.activeModal.close({ action: ModalAction.Update, updatedBooking: tmpBooking });
            }
        } else {
            this.activeModal.close({ action: ModalAction.Update, updatedBooking: this.editBooking });
        }
    }

    private saveBookingData(): Promise<any> {
        this.editBooking.conductAgreed = this.conductAgreed;
        this.editBooking.messageIsEditable = this.messageIsEditable;
        this.editBooking.subTours = this.bookingForm.controls.subTours.value
            ? (this.event.isMultipleSubtours ? this.bookingForm.controls.subTours.value : [this.bookingForm.controls.subTours.value])
            : [];
        return this.promiseForBtn = this.httpService.postAuth('bookings/update', this.editBooking).then((updatedBooking: Booking) => {
            this.editBooking.id = updatedBooking.id;
            this.editBooking.createdAt = updatedBooking.createdAt;
            this.listenerService.capacityListChanged();
            return Promise.resolve();
        }).catch((err) => {
            console.log(err);
            return Promise.reject(err);
        });
    }

    onCancel() {
        this.conductAgreed = this.editBooking.conductAgreed;
        this.submitted = true;
        this.editBooking = _.cloneDeep(this.booking);
        this.lastaction();
    }

    lastaction() {
        this.activeModal.close({ action: ModalAction.Cancel });
        this.campusId = this.userInfo.campusId || 'all';
        this.counter = 0;
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
        _.forEach(this.editBooking.students, student => {
            if (student.id === changedStudent.id) {
                student.firstName = changedStudent.firstName;
                student.lastName = changedStudent.lastName;
                student.startingYear = changedStudent.startingYear;
                student.schoolIntakeYearId = changedStudent.schoolIntakeYearId;
                student.submittedApplication = changedStudent.submittedApplication;
                student.schoolIntakeYear = changedStudent.schoolIntakeYear;
                if (this.school.isBoardingEnabled) {
                    student.boardingTypeId = changedStudent.boardingTypeId;
                    student.boardingType = changedStudent.boardingType;
                }
                this.emitData(true);
                // this.markFormAsDirty();
            }
        });
    }

    addNewStudent() {
        this.saveBookingIfPageLeave().then(() => {
            const params: object = {
                eventId: this.booking.eventId, bookingId: this.booking.id, fromUrl: this.fromUrl, fromStudentId: this.fromStudentId
            };
            this.router.navigate([`/${environment.localization.enquiriesUrl}/add-student`, params]);
        });
    }

    editContact(contactId: number) {
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
            _.forEach(this.editBooking.contacts, contact => {
                if (contact.id === changedContact.id) {
                    contact.firstName = changedContact.firstName;
                    contact.lastName = changedContact.lastName;
                    this.emitData(true);
                }
            });
            this.markFormAsDirty();
        }
    }

    addNewContact() {
        this.saveBookingIfPageLeave().then(() => {
            const params: Object = {
                eventId: this.booking.eventId, bookingId: this.booking.id, fromUrl: this.fromUrl, fromStudentId: this.fromStudentId
            };
            this.router.navigate([`/${environment.localization.enquiriesUrl}/edit-contact/`, params]);
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
        this.editBookingService.getRelatedStudents(selectedContact.id, this.editBooking);
        selectedContact.BookingContact = { bookingId: this.editBooking.id, contactId: selectedContact.id, checkedIn: false };
        this.editBooking.contacts = _.unionBy(this.editBooking.contacts, [selectedContact], 'id');
        this.markFormAsDirty();
    }

    getRelatedStudents(contactId: number) {
        let relatedStudents: Student[] = [];
        return this.httpService.getAuth('contact/' + contactId + '/related-students/').then((result) => {
            relatedStudents = result['students'];
            _.forEach(relatedStudents, (student: Student) => {
                student.BookingStudent = { bookingId: this.editBooking.id, studentId: student.id, checkedIn: false };
                this.editBooking.students = _.unionBy(this.editBooking.students, [student], 'id');
            });
        });
    }

    onStudentSelect(student: Student) {
        student.BookingStudent = { bookingId: this.editBooking.id, studentId: student.id, checkedIn: false };
        this.editBooking.students = _.unionBy(this.editBooking.students, [student], 'id');
        return this.httpService.getAuth('student/' + student.id + '/related-contacts/').then((result) => {
            const relatedContacts = result['contacts'];
            _.forEach(relatedContacts, (contact: Contact) => {
                contact.BookingContact = { bookingId: this.editBooking.id, contactId: contact.id, checkedIn: false };
                this.editBooking.contacts = _.unionBy(this.editBooking.contacts, [contact], 'id');
            });
            $('#selectStudentForBooking').modal('hide');
            this.markFormAsDirty();
        });
    }

    deleteContact(id: number) {
        _.remove(this.editBooking.contacts, (contact: any) => contact.id === id);
        this.markFormAsDirty();
    }

    deleteStudent(id) {
        _.remove(this.editBooking.students, (student: any) => student.id === id);
        this.markFormAsDirty();
    }

    checkInStudent(value: boolean, item: Student) {
        const student = _(this.editBooking.students).find((i: any) => i.id === item.id).BookingStudent;
        student.checkedIn = value;
        this.markFormAsDirty();
    }

    checkInContact(value: boolean, item: Contact) {
        const contact = _(this.editBooking.contacts).find((i: any) => i.id === item.id).BookingContact;
        contact.checkedIn = value;
        this.markFormAsDirty();
    }

    checkInOtherAttendants(otherAttendeesCheckedIn: boolean) {
        this.editBooking.otherAttendeesCheckedIn = otherAttendeesCheckedIn;
        this.markFormAsDirty();
    }

    markFormAsDirty() {
        this.submitted = false;
        this.getExistingContactsStudents();
    }

    private getExistingContactsStudents() {
        this.existingStudentIds = [];
        this.existingContactIds = [];
        if (this.editBooking) {
            this.editBooking.students.forEach(student => {
                this.existingStudentIds.push(student.id);
            });
            this.editBooking.contacts.forEach(contact => {
                this.existingContactIds.push(contact.id);
            });
        }
    }

    changeOtherAttendees(val: number) {
        if (val === null || val < 0) {
            this.editBooking.otherAttendeesCheckedIn = false;
            this.submitted = true;
        }
        this.markFormAsDirty();
    }

    changeTotalAttendees(val: number) {
        if (val === null || val < 0 || val === 0) {
            this.submitted = true;
        }
        this.markFormAsDirty();
    }

    changeVisitorType(val: boolean) {
        this.editBooking.isFirstVisit = val;
        this.markFormAsDirty();
    }

}
