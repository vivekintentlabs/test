import { Component, OnInit, OnDestroy, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { PlatformLocation } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { BaseTable } from 'app/base-table';

import { Constants } from 'app/common/constants';
import { Utils, Colors } from 'app/common/utils';
import { EventAttendanceUtils } from 'app/common/attendance-utils';
import { T } from 'app/common/t';
import { ModalAction } from 'app/common/enums';

import { HttpService } from 'app/services/http.service';
import { StorageService } from 'app/services/storage.service';
import { EditBookingModalService } from '../edit-booking-modal/edit-booking-modal.service';
import { SchoolQuery } from 'app/state/school';

import { Event } from 'app/entities/event';
import { Booking } from 'app/entities/booking';
import { UserInfo } from 'app/entities/userInfo';
import { PieSeries } from 'app/entities/local/pie-series';
import { Contact } from 'app/entities/contact';
import { SubTour } from 'app/entities/sub-tour';

import { EditBookingModalComponent } from '../edit-booking-modal/edit-booking-modal.component';
import { SelectContactModalComponent } from 'app/components/select-contact-modal/select-contact-modal.component';

import * as _ from 'lodash';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-rsvp-list',
    styleUrls: ['rsvp-list.component.scss'],
    templateUrl: './rsvp-list.component.html',
    providers: [EditBookingModalService]
})
export class RsvpListComponent extends BaseTable<Booking> implements OnInit, OnDestroy {
    @Input() event: Event;
    @Output() bookingsUpdated = new EventEmitter();

    tableId = 'RsvpListComponent';
    title = 'RSVP List';

    userInfo: UserInfo = null;

    studentsCount = 0;
    familiesCount = 0;
    attendingsCount = 0;
    checkedInCount = 0;
    isYellow = false;
    isRed = false;

    currentBooking = null;

    public currentUrl: string = null;
    public contactUrl = `/${environment.localization.enquiriesUrl}/edit-contact`;
    public studentUrl = `/${environment.localization.enquiriesUrl}/edit-student`;

    public campusId: number = null;
    public fromUrl: string = null;

    public isCheckinMode: boolean;

    public noItemSelected = Constants.noItemSelected; // show constant string in html
    public noDataInTable = Constants.noDataInTable;
    private eventAttendanceUtils: EventAttendanceUtils;
    public triggershowMessage = false;
    public showCurrentMessage = false;
    public message: string;
    public filterBookings = 'all';
    public firstVisitData = [];
    public firstVisitFilter = [];
    public pieChartData: PieSeries;
    public classNames = [];
    public promiseForBtn: Promise<any>;
    public subTourFilterControl = null;
    startingMonth$ = this.schoolQuery.startingMonth$;

    constructor(
        public router: Router,
        private httpService: HttpService,
        private ref: ChangeDetectorRef,
        private modalService: NgbModal,
        private editBookingService: EditBookingModalService,
        storageService: StorageService,
        private platformLocation: PlatformLocation,
        private schoolQuery: SchoolQuery,
    ) {
        super(storageService);
        this.displayedColumns = [
            'status', 'contacts', 'students', 'totalRSVP', 'checkedIn', 'totalcheckedIn', 'conduct', 'actions'
        ];
    }

    public ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.currentUrl = this.router.url.split(';')[0];
        this.subTourFilterControl = new FormControl(null);

        this.eventAttendanceUtils = new EventAttendanceUtils();
        this.isCheckinMode = this.userInfo.isSchoolRepresentative();

        if (!this.isCheckinMode) {
            this.displayedColumns.splice(6, 0, 'message');
        }
        if (this.event.isSubToursEnabled) {
            this.displayedColumns.splice(7, 0, 'tour');
        }
        this.updatePoints();

        if (this.event.bookings) {
            this.buildTable();
        }
    }

    protected buildTable() {
        const tempBookings = this.filterBooking();
        if (!_.isEmpty(tempBookings)) {
            if (this.isCheckinMode) {
                _.pull(this.displayedColumns, 'message');
            }
            tempBookings.forEach(booking => {
                booking['multipleContactField'] = ''; // special fileds for filtering
                booking['multipleStudentField'] = ''; // special fileds for filtering
                booking.contacts.forEach(contact => {
                    contact['name'] = `${contact.lastName}, ${contact.firstName}`;
                    booking['multipleContactField'] += `${contact.lastName}, ${contact.firstName} `;
                });
                booking.students.forEach(student => {
                    student['name'] = `${student.lastName}, ${student.firstName}`;
                    booking['multipleStudentField'] +=
                        student.lastName + ', ' + student.firstName +
                        (student.schoolIntakeYearId || student.startingYear ? ' (' +
                            (student.schoolIntakeYearId ? student.schoolIntakeYear.name : '') +
                            (student.schoolIntakeYearId && student.startingYear ? ', ' : '') +
                            (student.startingYear ? student.startingYear : '') +
                            ') ' : '');
                });
                booking['totalRSVP'] = (booking.totalAttendees > 0) ? booking.totalAttendees : '-';
                booking['checkedIn'] = (booking.totalAttendees > booking.checkedInCount && booking.checkedInCount > 0) ? 'Partial'
                    : (booking.totalAttendees < booking.checkedInCount) && booking.checkedInCount > 0 ? 'Overbooked'
                        : (booking.checkedInCount === booking.totalAttendees && booking.checkedInCount !== 0) ? 'Yes' : 'No';
                booking['totalcheckedIn'] = (booking.checkedInCount > 0) ? booking.checkedInCount : '-';
                booking['message'] = booking.message;
                booking['conduct'] = booking.conductAgreed ? 'Yes' : 'No';
            });

            super.buildTable(tempBookings);
            this.dataSource.sortingDataAccessor = (item, property) => {
                switch (property) {
                    case 'contacts': return _.head(item.contacts) ?
                        _.toLower(`${_.head(item.contacts).lastName}, ${_.head(item.contacts).firstName}`) : '';
                    case 'students': return _.head(item.contacts) ?
                        _.toLower(`${_.head(item.students).lastName}, ${_.head(item.students).firstName}`) : '';
                    case 'tour': return _.head(item.subTours) ? _.toLower(`${_.head(item.subTours).name}`) : '';
                    case 'totalRSVP':
                    case 'totalcheckedIn': return _.toNumber(_.get(item, property)) || 0;
                    default: return _.toLower(_.get(item, property));
                }
            };

            this.dataSource.filterPredicate = (booking, filter: string) => {
                const values = [];
                this.displayedColumns.forEach(fieldName => {
                    const value = (fieldName === 'contacts')
                        ? _.join(_.map(booking.contacts, c => c.name))
                        : (fieldName === 'students')
                            ? _.join(_.map(booking.students, s => s.name))
                            : (fieldName === 'tour')
                                ? _.join(_.map(booking.subTours, s => s.name))
                                : _.get(booking, fieldName);
                    if (value) {
                        values.push(_.toLower(value));
                    }
                });
                const transformedFilter = filter.trim().toLowerCase();
                return values.find(i => _.includes(i, transformedFilter));
            };
        } else {
            this.dataSource = new MatTableDataSource<Booking>(tempBookings);
        }
        this.updateTable(tempBookings);
    }

    private updatePoints(bookings?: Booking[]) {
        if (bookings || this.event.bookings) {
            const counters = this.eventAttendanceUtils.getEventAttendance(bookings ? bookings : this.event.bookings);
            this.studentsCount = counters.studentsCount;
            this.familiesCount = counters.familiesCount;
            this.attendingsCount = counters.totalAttendees;
            this.checkedInCount = counters.checkedInCount;
            _(bookings ? bookings : this.event.bookings).forEach(item => {
                _.assign(item, {
                    'checkedInCount': this.eventAttendanceUtils.getCheckedInAttendance(item),
                    'attendingsCount': this.eventAttendanceUtils.getAttendantByBooking(item)
                });
            });
            this.maxNumberChange(this.event.maxNumber);
        }
    }

    maxNumberChange(maxNumber: number | string) {
        if (maxNumber !== '') {
            if (typeof maxNumber === 'string') {
                maxNumber = _.parseInt(maxNumber);
            }
            this.isRed = (this.attendingsCount >= maxNumber) ? true : false;
            if (!this.isRed) {
                this.isYellow = (this.attendingsCount >= (maxNumber * 0.9)) ? true : false;
            }
        }
    }

    private updateData() {
        this.updatePoints();
        this.buildTable();
    }

    updateDataCallback(booking: Booking) {
        const bookingId = _.findIndex(this.event.bookings, { id: booking.id });
        if (bookingId === -1) {
            this.event.bookings.push(booking);
        } else {
            this.event.bookings[bookingId] = booking;
        }
        this.updateData();
        this.buildTable();
        this.bookingsUpdated.emit();
    }

    editBookingModalRepresentative(booking) {
        if (this.isCheckinMode) {
            this.editBookingModal(booking);
        }
    }

    editBookingModal(booking: Booking) {
        const editBookingModalRef = this.modalService.open(EditBookingModalComponent, Constants.ngbModalLg);
        editBookingModalRef.componentInstance.booking = booking;
        editBookingModalRef.componentInstance.event = this.event;
        editBookingModalRef.componentInstance.fromUrl = this.currentUrl;
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

    // bookingCheckedIn is defined as true ONLY when ALL items (other attendees, students and contacts) are checked in
    private isBookingCheckedin(booking: Booking) {
        let bookingCheckedIn = booking.otherAttendeesCheckedIn;
        if (bookingCheckedIn && booking.contacts) {
            _.forEach(booking.contacts, contact => {
                if (!contact.BookingContact.checkedIn) {
                    bookingCheckedIn = false;
                }
            });
        }
        if (bookingCheckedIn && booking.students) {
            _.forEach(booking.students, student => {
                if (!student.BookingStudent.checkedIn) {
                    bookingCheckedIn = false;
                }
            });
        }
        return bookingCheckedIn;
    }

    checkInBooking(booking: Booking) {
        if (booking.attendingsCount === 0) {
            Utils.showNotification('Cannot check in empty booking', Colors.danger);
            return;
        }
        const checkedIn = !this.isBookingCheckedin(booking);
        this.httpService.postAuth('bookings/check-in/', {
            checkedIn: checkedIn,
            id: booking.id
        }).then(() => {
            booking.otherAttendeesCheckedIn = checkedIn;
            if (booking.contacts) {
                _.forEach(booking.contacts, contact => {
                    contact.BookingContact.checkedIn = checkedIn;
                });
            }
            if (booking.students) {
                _.forEach(booking.students, student => {
                    student.BookingStudent.checkedIn = checkedIn;
                });
            }
            if (checkedIn && booking.otherAttendees === 0) {
                if (booking.totalAttendees - booking.students.length - booking.contacts.length > -1) {
                    booking.otherAttendees = booking.totalAttendees - booking.students.length - booking.contacts.length;
                }
            }

            this.updateData();
            Utils.DetectChanges(this.ref);
            Utils.showSuccessNotification();
        }).catch(err => console.log(err));
    }

    deleteBooking(item) {
        Utils.deletedQuestion().then((result) => {
            if (result && result.value) {
                this.httpService.getAuth('bookings/delete/' + item.id).then(() => {
                    _.remove(this.event.bookings, booking => booking.id === item.id);
                    this.updateData();
                    this.buildTable();
                    Utils.deletedSuccessfully();
                }).catch(err => console.log(err));
            }
        });
    }

    selectContact() {
        const selectContactModalRef = this.modalService.open(SelectContactModalComponent, Constants.ngbModalLg);
        selectContactModalRef.componentInstance.contact = 'contact';
        selectContactModalRef.componentInstance.eventData = {
            eventId: this.event.id, router: this.router, currentUrl: this.currentUrl, campusId: this.event.campusId
        };
        selectContactModalRef.result.then((res: { action: ModalAction, selectedContact?: Contact }) => {
            switch (res.action) {
                case ModalAction.Select: this.attendAnEvent(res.selectedContact); break;
                default: break;
            }
        });
        this.platformLocation.onPopState(() => {
            selectContactModalRef.close({ action: ModalAction.LeavePage });
        });
    }

    private attendAnEvent(selectedContact: Contact) {
        const newBooking = new Booking();
        newBooking.eventId = this.event.id;
        newBooking.otherAttendees = 0;
        newBooking.totalAttendees = 0;
        newBooking.externalBookingId = null;
        newBooking.otherAttendeesCheckedIn = false;
        newBooking.isFirstVisit = null;

        selectedContact.BookingContact = { bookingId: newBooking.id, contactId: selectedContact.id, checkedIn: false };
        newBooking.contacts = _.unionBy(newBooking.contacts, [selectedContact], 'id');
        return this.editBookingService.getRelatedStudents(selectedContact.id, newBooking).then(() => {
            this.editBookingModal(newBooking);
        });
    }

    downloadAttendees() {
        this.httpService.postAuth('events/download-attendees/', { eventId: this.event.id }).then((data: Object) => {
            Utils.export2Csv(data['csvData'], data['fileName']);
        }).catch((e) => {
            console.log('error when exporting students file, but already handled');
        });
    }

    showMessage(booking: Booking) {
        this.showCurrentMessage = true;
        this.message = booking.message;
        this.triggershowMessage = !this.triggershowMessage;
    }

    filterBooking(): Booking[] {
        let filteredBookings: Booking[] = [];
        filteredBookings = (this.filterBookings === 'all') ?
            this.event.bookings : _.filter(this.event.bookings, (booking: Booking) => booking.checkedInCount > 0);
        if (this.subTourFilterControl && this.subTourFilterControl.value) {
            filteredBookings = _.filter(filteredBookings, booking => (
                _.find(booking.subTours, (st: SubTour) => st.id === this.subTourFilterControl.value)
            )) as Booking[];
        }
        this.firstVisitData = [
            {
                name: 'Returning',
                count: _.filter(filteredBookings, (booking: Booking) => booking.isFirstVisit === false).length,
                color: 'table-gold',
                pieColor: 'text-gold',
            },
            {
                name: 'First time',
                count: _.filter(filteredBookings, (booking: Booking) => booking.isFirstVisit === true).length,
                color: 'table-silver',
                pieColor: 'text-silver',
            },
            {
                name: T.unknown,
                count: _.filter(filteredBookings, (booking: Booking) => booking.isFirstVisit === null).length,
                color: 'table-bronze',
                pieColor: 'text-bronze',
            },
        ];

        if (!_.isEmpty(this.firstVisitFilter)) {
            const filteredBookingsTemp = [];
            _.forEach(filteredBookings, (booking: Booking) => {
                if (this.firstVisitFilter['Returning'] && booking.isFirstVisit === false) {
                    filteredBookingsTemp.push(booking);
                }
                if (this.firstVisitFilter['First time'] && booking.isFirstVisit === true) {
                    filteredBookingsTemp.push(booking);
                }
                if (this.firstVisitFilter[T.unknown] && booking.isFirstVisit === null) {
                    filteredBookingsTemp.push(booking);
                }
            });
            filteredBookings = filteredBookingsTemp ? filteredBookingsTemp : filteredBookings;

            this.pieChartData = new PieSeries;
            this.classNames = [];
            _.forEach(this.firstVisitData, item => {
                if (this.firstVisitFilter[item.name] === true && item.count !== 0) {
                    this.pieChartData.data.push(item.count)
                    this.classNames.push(item.pieColor);
                }
            });
            this.pieChartData.total = _.sum(this.pieChartData.data);
            this.ref.detectChanges();
        }
        return filteredBookings;
    }

    filteringDataChanged(data) {
        this.firstVisitFilter = data;
        this.changeFilter(this.filterBookings);
    }

    changeFilter(val: string) {
        this.filterBookings = val;
        this.updatePoints(this.filterBooking());
        this.buildTable();
    }

    subTourFilterChanged() {
        this.updatePoints(this.filterBooking());
        this.buildTable();
    }

}
