import { Component, AfterViewInit, ChangeDetectorRef, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { BaseTable } from 'app/base-table';

import { Constants } from 'app/common/constants';
import { Utils, Colors } from 'app/common/utils';
import { LICode, ModalAction } from 'app/common/enums';

import { UserInfo } from 'app/entities/userInfo';
import { Event } from 'app/entities/event';
import { Booking } from 'app/entities/booking';
import { Student } from 'app/entities/student';
import { ActivityLog } from 'app/entities/activityLog';
import { PersonalTour } from 'app/entities/personal-tour';
import { EmailTemplate } from 'app/entities/email-template';
import { PersonalTourBooking } from 'app/entities/personal-tour-booking';
import { Campus } from 'app/entities/campus';
import { User } from 'app/entities/user';
import { Contact } from 'app/entities/contact';
import { ListItem } from 'app/entities/list-item';

import { HttpService } from 'app/services/http.service';
import { LocaleService } from 'app/services/locale.service';
import { DataService } from 'app/services/data.service';
import { StorageService } from 'app/services/storage.service';

import { EditPersonalTourBookingModalComponent } from 'app/events/edit-personal-tour-booking-modal/edit-personal-tour-booking-modal.component';
import { EditBookingModalComponent } from 'app/events/edit-booking-modal/edit-booking-modal.component';

import * as _ from 'lodash';
import * as momenttz from 'moment-timezone';

declare var $: any;

interface CombinedActivityLog {
    id: number;
    date: moment.Moment;
    name: string;
    notes: string;
    message: string;
    user: string;
    attended: string;
    agreed: boolean | number;
    booking: boolean;
    studentId?: number;
    personalTourId?: number;
}

@Component({
    selector: 'app-activity-logs',
    templateUrl: 'activity-logs.component.html'
})
export class ActivityLogsComponent extends BaseTable<ActivityLog> implements AfterViewInit, OnChanges {
    @Input() student?: Student; // only from student page
    @Input() contact?: Contact; // only from contact page
    @Input() triggerStudentChanged: boolean; // only from contact page
    @Output() alChanges: EventEmitter<ActivityLog[]>;
    @Output() loaded: EventEmitter<any>;
    @Input() shouldShowActionButtons: boolean;
    
    public activities: ListItem[];
    public leadSources: ListItem[];
    public activityLogs: ActivityLog[] = [];
    public tableRows: any[] = [];
    public userInfo: UserInfo = null;

    public events: Event[] = [];
    public futureEvents: Event[] = [];
    public bookings: Booking[] = null;
    public currentBooking: Booking = null;
    public personalTours: PersonalTour[] = null;
    public futurePersonalTours: PersonalTour[] = null;
    public personalTourBookings: PersonalTourBooking[] = null;
    public currentPersonalTourBooking: PersonalTourBooking = null;
    public currentUrl = null;
    public currentId = null;

    public activityLogId: number;
    public triggerAL = false;

    public activityIdSendProspectus: number;
    public activityIdRecordOfConversation: number;
    public schoolProspectus: EmailTemplate;
    trigger = false;
    getStudentContactTour = false;
    getStudentContactBooking = false;
    campuses: Campus[] = [];
    public triggershowMessage = false;
    public showCurrentMessage = false;
    public message: string;
    public students: Student[];
    public contacts: Contact[];
    public studentIds: number[];
    public actionEdit = false;
    public editableStudentId: number;
    public users: User[] = [];
    dateTime = Constants.localeFormats.dateTime;

    public combinedActivityLogs: CombinedActivityLog[] = [];
    public tableId = 'activityLogTable';

    timeZoneId = '';

    constructor(
        private router: Router,
        private httpService: HttpService,
        private ref: ChangeDetectorRef,
        private localeService: LocaleService,
        private dataService: DataService,
        private modalService: NgbModal,
        storageService: StorageService,
        private platformLocation: PlatformLocation,
    ) {
        super(storageService);
        this.displayedColumns = ['date', 'name', 'notes', 'message', 'user', 'attended', 'agreed', 'actions'];
        this.alChanges = new EventEmitter();
        this.loaded = new EventEmitter();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (_.has(changes, 'triggerStudentChanged')) {
            this.loadThisComponent();
        }
    }

    ngAfterViewInit() {
        this.tableIsLoading = this.loadThisComponent();
        Utils.DetectChanges(this.ref);
    }

    public loadThisComponent() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.currentUrl = this.router.url.split(';')[0];
        this.currentId = this.student ? this.student.id : null;
        if (this.student) {
            return this.dataService.getAuth('student/' + this.student.id + '/related-contacts/').then((result) => {
                this.contacts = [];
                this.students = [];
                this.studentIds = [];
                this.contacts = result['contacts'];
                this.studentIds.push(this.student.id);
                this.students.push(this.student);
                this.getActivityLogs(this.studentIds);
            });
        } else if (this.contact) {
            return this.dataService.getAuth('contact/' + this.contact.id + '/related-students/').then((result) => {
                this.contacts = [];
                this.students = [];
                this.studentIds = [];
                this.contacts.push(this.contact);
                this.students = result['students'];
                this.students.forEach((student: Student) => {
                    this.studentIds.push(student.id);
                });
                this.getActivityLogs(this.studentIds);
            });
        }
    }

    private setTimeZoneId(students: Student[], campuses: Campus[]): string {
        const campusIds = _.map(students, s => s.campusId);
        const usedCampuses = _.filter(campuses, c => _.includes(campusIds, c.id));

        return (usedCampuses.length === 1 && usedCampuses[0].campusType !== Campus.CAMPUS_TYPE_UNDECIDED)
            ? usedCampuses[0].timeZoneId
            : _.find(campuses, c => c.campusType === Campus.CAMPUS_TYPE_MAIN).timeZoneId;
    }

    public getActivityLogs(studentIds: number[]) {
        this.dataService.postAuth('activity-log/get-activities-info', studentIds).then((data: any) => {
            this.events = data.events;
            this.campuses = data.campuses;
            this.users = data.users;

            this.timeZoneId = this.setTimeZoneId(this.students, this.campuses);

            // events are considered in the future if current local australian time is
            // later then the beginning of the next day after the event (00:00 local australian time)
            this.futureEvents = Utils.filterFutureEventPersonalTours(this.events, this.campuses) as Event[];
            this.personalTours = data.personalTours;
            this.futurePersonalTours = Utils.filterFutureEventPersonalTours(this.personalTours, this.campuses) as PersonalTour[];
            this.bookings = data.bookings;
            this.personalTourBookings = data.personalTourBookings;
            this.activities = data.logs.activities;
            this.schoolProspectus = data.logs.schoolProspectus;
            this.activityIdSendProspectus = _.find(this.activities, item => item.code === LICode.activity_sendAProspectus).id;
            const activityRecordOfConversation = _.find(this.activities, item => item.code === LICode.activity_recordOfConversation);
            this.activityIdRecordOfConversation = activityRecordOfConversation ? activityRecordOfConversation.id : null;
            this.activityLogs = data.logs.activityLogs;
            this.calculateAppDate();
            this.prepareTableData();
            this.buildTable(this.combinedActivityLogs);
            this.loaded.emit(true);
        });
    }

    private prepareTableData() {
        this.combinedActivityLogs = [];
        this.tableRows.splice(0, this.tableRows.length); // = [];
        _.forEach(this.activityLogs, (activityLog) => {
            this.pushActivityLog(activityLog);
        });
        _.forEach(this.bookings, (booking) => {
            const isFuture = _.find(this.futureEvents, (futureEvent: Event) => futureEvent.id === booking.eventId) ? true : false;
            let attended;
            if (!isFuture) {
                const checkInContacts = _.map((_.map(booking.contacts, 'BookingContact')), 'checkedIn');
                const checkInStudents = _.map((_.map(booking.students, 'BookingStudent')), 'checkedIn');
                const attendedContacts = _.includes(checkInContacts, true);
                const attendedStudents = _.includes(checkInStudents, true);
                // if any student, contact, or other is chekedIn then set 'Yes'
                attended = (attendedContacts || attendedStudents || booking.otherAttendeesCheckedIn) ? 'Yes' : 'No';
                this.pushBooking(booking, attended);
            } else {
                attended = '-';
                this.pushBooking(booking, attended);
            }
        });
        _.forEach(this.personalTourBookings, (personalTourBooking: PersonalTourBooking) => {
            const isFuture = _.find(this.futurePersonalTours, (futurePersonalTour: PersonalTour) =>
                futurePersonalTour.id === personalTourBooking.personalTourId) ? true : false;
            let attended;
            if (!isFuture) {
                const checkInContacts = _.map((_.map(personalTourBooking.contacts, 'PersonalTourContact')), 'checkedIn');
                const checkInStudents = _.map((_.map(personalTourBooking.students, 'PersonalTourStudent')), 'checkedIn');
                const attendedContacts = _.includes(checkInContacts, true);
                const attendedStudents = _.includes(checkInStudents, true);
                // if any student, contact, or other is chekedIn then set 'Yes'
                attended = (attendedContacts || attendedStudents || personalTourBooking.otherAttendeesCheckedIn) ? 'Yes' : 'No';
                this.pushPersonalTourBookings(personalTourBooking, attended);
            } else {
                attended = '-';
                this.pushPersonalTourBookings(personalTourBooking, attended);
            }
        });
    }

    private pushActivityLog(activityLog: ActivityLog) {
        this.combinedActivityLogs.push({
            id: activityLog.id,
            date: momenttz.tz(activityLog.date, this.timeZoneId),
            name: (activityLog.activity) ? activityLog.activity.name : '',
            notes: activityLog.notes,
            message: (activityLog.activity.code === LICode.email_communications && !activityLog.messageIsEditable) ? '' : activityLog.message,
            user: activityLog.userName || '-',
            attended: '-',
            agreed: -1,
            booking: null,
            studentId: activityLog.studentId
        });
    }

    private pushPersonalTourBookings(personalTourBooking: PersonalTourBooking, attended: string) {
        const personalTour = (personalTourBooking.personalTour.id) ? _.find(this.personalTours, item =>
            item.id === personalTourBooking.personalTour.id) : null;
        this.combinedActivityLogs.push({
            id: personalTourBooking.id,
            date: momenttz(personalTourBooking.createdAt),
            name: 'Booked a Tour',
            notes: 'Personal Tour - ' + this.localeService.transformLocaleDate(personalTour.date, Constants.localeFormats.dateDelimiter),
            message: '-',
            user: personalTourBooking.userName || '-',
            attended,
            agreed: personalTourBooking.conductAgreed,
            booking: false,
            personalTourId: personalTour.id
        });
    }

    private pushBooking(booking: Booking, attended: string) {
        const event = (booking.event.id) ? _.find(this.events, item => item.id === booking.event.id) : null;
        const date = this.localeService.transformLocaleDate(event.date, Constants.localeFormats.dateDelimiter);
        const note = (event) ? (event.schoolTour) ? event.schoolTour.name + ' - ' + date : date : '';
        this.combinedActivityLogs.push({
            id: booking.id,
            date: momenttz(booking.createdAt),
            name: 'Registered for an Event',
            notes: note,
            message: booking.message,
            user: booking.userName || '-',
            attended,
            agreed: booking.conductAgreed,
            booking: true
        });
    }
    protected buildTable(combinedActivityLogs) {
        super.buildTable(combinedActivityLogs);
        this.dataSource.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'date': return Utils.getUnixTimestamp(item.date, this.localeService.getFormat(this.dateTime));
                default: return _.toLower(_.get(item, property));
            }
        };
        this.updateTable(combinedActivityLogs);
    }

    addActivityLog() {
        this.triggerAL = !this.triggerAL;
        this.activityLogId = 0;
        this.actionEdit = false;
        $('#editActivityLogModal').modal('show');
    }

    attendAnEvent() {
        this.currentBooking = new Booking();
        this.currentBooking.externalBookingId = null;
        this.currentBooking.otherAttendees = 0;
        this.currentBooking.totalAttendees = 0;
        _.forEach(this.students, (student: Student) => {
            student.BookingStudent = { bookingId: null, studentId: student.id, checkedIn: false };
            this.currentBooking.students.push(student);
        });
        _.forEach(this.contacts, (contact: Contact) => {
            contact.BookingContact = { bookingId: null, contactId: contact.id, checkedIn: false };
            this.currentBooking.contacts.push(contact);
        });
        this.getStudentContactBooking = true;
        this.editBookingModal(this.currentBooking);
    }

    private editBookingModal(booking: Booking) {
        if (this.student || this.students) {
            const editBookingModalRef = this.modalService.open(EditBookingModalComponent, Constants.ngbModalLg);
            editBookingModalRef.componentInstance.booking = booking;
            editBookingModalRef.componentInstance.event = booking ? booking.event : null;
            editBookingModalRef.componentInstance.futureEvents = this.futureEvents;
            editBookingModalRef.componentInstance.allEvents = this.events;
            editBookingModalRef.componentInstance.campuses = this.campuses;
            editBookingModalRef.componentInstance.getStudentContactBooking = this.getStudentContactBooking;
            editBookingModalRef.componentInstance.fromUrl = this.currentUrl;
            editBookingModalRef.componentInstance.fromStudentId = this.currentId;
            editBookingModalRef.result.then((res: { action: ModalAction, updatedBooking?: Booking }) => {
                switch (res.action) {
                    case ModalAction.Update: this.updateDataCallback(res.updatedBooking); break;
                    default: break;
                }
            });
            this.platformLocation.onPopState(() => {
                editBookingModalRef.close({ action: ModalAction.LeavePage });
            });
        }
    }

    attendAnPersonalTour() {
        this.currentPersonalTourBooking = new PersonalTourBooking();
        this.currentPersonalTourBooking.otherAttendees = 0;
        this.currentPersonalTourBooking.totalAttendees = 0;
        _.forEach(this.students, (student: Student) => {
            student.PersonalTourStudent = { personalTourBookingId: null, studentId: student.id, checkedIn: false };
            this.currentPersonalTourBooking.students.push(student);
        });
        _.forEach(this.contacts, (contact: Contact) => {
            contact.PersonalTourContact = { personalTourBookingId: null, contactId: contact.id, checkedIn: false };
            this.currentPersonalTourBooking.contacts.push(contact);
        });
        this.trigger = !this.trigger;
        this.getStudentContactTour = true;
        this.editPersonalTourBookingModal(this.currentPersonalTourBooking);
    }

    private editPersonalTourBookingModal(booking: PersonalTourBooking) {
        if (this.students || this.student) {
            const editPersonalTourBookingModalRef = this.modalService.open(EditPersonalTourBookingModalComponent, Constants.ngbModalLg);
            editPersonalTourBookingModalRef.componentInstance.personalTourBooking = booking;
            editPersonalTourBookingModalRef.componentInstance.fromUrl = this.currentUrl;
            editPersonalTourBookingModalRef.componentInstance.belongsToActivityLog = true;
            editPersonalTourBookingModalRef.componentInstance.futurePersonalTours = this.futurePersonalTours;
            editPersonalTourBookingModalRef.componentInstance.allPersonalTours = this.personalTours;
            editPersonalTourBookingModalRef.componentInstance.campuses = this.campuses;
            editPersonalTourBookingModalRef.componentInstance.getStudentContactTour = this.getStudentContactTour;
            editPersonalTourBookingModalRef.componentInstance.users = this.users;
            editPersonalTourBookingModalRef.result.then((res: { action: ModalAction, updatedBooking?: PersonalTourBooking }) => {
                switch (res.action) {
                    case ModalAction.Update: this.updateDataCallbackPT(res.updatedBooking); break;
                    default: break;
                }
            });
            this.platformLocation.onPopState(() => {
                editPersonalTourBookingModalRef.close({ action: ModalAction.LeavePage });
            });
        }
    }

    showMessage(item: CombinedActivityLog) {
        if (!item?.message.length) return;

        this.showCurrentMessage = true;
        const currentBooking = _.find(this.bookings, (booking: Booking) => booking.id === item.id);
        const currentActivityLog = _.find(this.activityLogs, (activityLog: ActivityLog) => activityLog.id === item.id);
        this.message = currentBooking ? currentBooking.message : (currentActivityLog ? currentActivityLog.message : null);
        this.triggershowMessage = !this.triggershowMessage;
    }

    editActivityLog(item: CombinedActivityLog) {
        this.trigger = !this.trigger;
        this.getStudentContactBooking = false;
        this.getStudentContactTour = false;
        if (item.booking) {
            this.activityLogId = null;
            this.currentBooking = _.find(this.bookings, (booking) => booking.id === item.id);
            this.editBookingModal(this.currentBooking);
        } else if (item.name === 'Booked a Tour') {
            this.activityLogId = null;
            this.currentPersonalTourBooking = _.find(this.personalTourBookings, (personalTour) => personalTour.id === item.id);
            this.editPersonalTourBookingModal(this.currentPersonalTourBooking);
        } else {
            this.triggerAL = !this.triggerAL;
            this.activityLogId = item.id;
            this.actionEdit = true;
            this.editableStudentId = item.studentId;
            $('#editActivityLogModal').modal('show');
        }
    }

    updateDataCallback(booking: Booking) {
        const bookingId = _.findIndex(this.bookings, { id: booking.id });
        if (bookingId === -1) {
            this.bookings.push(booking);
        } else {
            this.bookings[bookingId] = booking;
        }
        this.currentBooking = booking;
        this.loadThisComponent();
    }

    updateDataCallbackPT(personalTourBooking: PersonalTourBooking) {
        this.loadThisComponent();
    }

    activityLogUpdateDataCallback(activityLog: ActivityLog) {
        if (this.activityIdSendProspectus === activityLog.activityId && !_.endsWith(_.toLower(activityLog.notes), 'not sent')) {
            Utils.showNotification('The Prospectus has been sent', Colors.success);
        }
        if (!_.find(this.activityLogs, { id: activityLog.id })) {
            activityLog.activity = _.find(this.activities, (activity) => activity.id === activityLog.activityId);
            this.activityLogs.push(activityLog);
        } else {
            _.forEach(this.activityLogs, (item) => {
                if (item.id === activityLog.id) {
                    item.activityId = activityLog.activityId;
                    item.date = activityLog.date;
                    item.notes = activityLog.notes;
                    item.message = activityLog.message;
                    item.activity = _.find(this.activities, (activity) => activity.id === activityLog.activityId);
                }
            });
        }
        this.loadThisComponent();
    }

    deleteActivityLog(item: any) {
        if (item.booking) {
            this.deleteByGetUrlId('bookings/delete/', item.id);
        } else if (item.name === 'Booked a Tour') {
            this.deleteBooking(item);
        } else {
            this.deleteByGetUrlId('activity-log/delete-activity-log/', item.id).then(() => {
                this.calculateAppDate();
            });
        }
    }

    private deleteByGetUrlId(url, id): Promise<any> {
        return Utils.deletedQuestion().then((result) => {
            if (result && result.value) {
                return this.httpService.getAuth(url + id).then(() => {
                    if (url === 'bookings/delete/') {
                        _.remove(this.bookings, (booking) => booking.id === id);
                    } else {
                        _.remove(this.activityLogs, (activityLog) => activityLog.id === id);
                    }
                    this.prepareTableData();
                    this.buildTable(this.combinedActivityLogs);
                    return Utils.deletedSuccessfully();
                });
            }
        });
    }

    private deleteBooking(personalTourBooking: PersonalTourBooking): Promise<any> {
        return Utils.deletedQuestion().then((result) => {
            if (result && result.value) {
                return this.httpService.postAuth('personal-tour/delete-booking', personalTourBooking).then(() => {
                    this.currentPersonalTourBooking = null;
                    _.remove(this.personalTourBookings, (pTB) => pTB.id === personalTourBooking.id);
                    const temp = _.find(this.personalTourBookings, (pt) => pt.personalTourId === personalTourBooking.personalTourId);
                    if (temp === undefined) {
                        _.remove(this.personalTours, (pt) => pt.id === personalTourBooking.personalTourId);
                        this.futurePersonalTours = _.filter(this.personalTours, (pt: PersonalTour) => momenttz().isBefore(pt.date));
                    }
                    this.prepareTableData();
                    this.buildTable(this.combinedActivityLogs);
                    return Utils.deletedSuccessfully();
                });
            }
        });
    }

    private calculateAppDate() {
        this.alChanges.emit(this.activityLogs);
    }

}
