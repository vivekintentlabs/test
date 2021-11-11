import { Component, Input, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { PlatformLocation } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { BaseTable } from 'app/base-table';

import { StorageService } from 'app/services/storage.service';
import { HttpService } from 'app/services/http.service';

import { Constants } from 'app/common/constants';
import { Utils, Colors } from 'app/common/utils';
import { PersonalTourAttendanceUtils } from 'app/common/attendance-utils';
import { ModalAction } from 'app/common/enums';

import { UserInfo } from 'app/entities/userInfo';
import { PersonalTour } from 'app/entities/personal-tour';
import { PersonalTourBooking } from 'app/entities/personal-tour-booking';

import { EditPersonalTourBookingModalComponent } from '../edit-personal-tour-booking-modal/edit-personal-tour-booking-modal.component';

import * as _ from 'lodash';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-personal-tour-bookings',
    styleUrls: ['personal-tour-bookings.component.scss'],
    templateUrl: './personal-tour-bookings.component.html',
})
export class PersonalTourBokingsComponent extends BaseTable<PersonalTourBooking> implements OnInit, AfterViewInit {
    @Input() personalTour: PersonalTour;

    tableId = 'PersonalTourBokingsComponent';

    userInfo: UserInfo = null;

    public currentUrl: string = null;

    public noDataInTable = Constants.noDataInTable;

    private personalTourAttendanceUtils;

    title = 'RSVP List';

    constructor(
        storageService: StorageService,
        private router: Router,
        private httpService: HttpService,
        private modalService: NgbModal,
        private ref: ChangeDetectorRef,
        private platformLocation: PlatformLocation,
    ) {
        super(storageService);

        this.displayedColumns = ['contacts', 'students', 'totalRSVP', 'checkedIn', 'totalcheckedIn', 'conduct', 'actions'];
    }

    public ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.currentUrl = this.router.url.split(';')[0];
        this.personalTourAttendanceUtils = new PersonalTourAttendanceUtils();
    }

    ngAfterViewInit() {
        if (this.personalTour.personalTourBookings) {
            this.buildTable();
            Utils.DetectChanges(this.ref);
        }
    }

    protected buildTable() {
        const ptBookings = this.personalTour.personalTourBookings;
        if (!_.isEmpty(ptBookings)) {
            this.prepareViewData(ptBookings);

            super.buildTable(ptBookings);

            this.dataSource.sortingDataAccessor = (item, property) => {
                switch (property) {
                    case 'contacts': return _.head(item.contacts) ?
                        _.toLower(`${_.head(item.contacts).lastName}, ${_.head(item.contacts).firstName}`) : ''
                    case 'students': return _.head(item.contacts) ?
                        _.toLower(`${_.head(item.students).lastName}, ${_.head(item.students).firstName}`) : ''
                    case 'totalRSVP':
                    case 'totalcheckedIn': return _.toNumber(_.get(item, property)) || 0;
                    default: return _.toLower(_.get(item, property));
                }
            };
        } else {
            this.dataSource = new MatTableDataSource<PersonalTourBooking>(ptBookings);
        }
        this.updateTable(ptBookings);
    }

    private prepareViewData(ptBookings: PersonalTourBooking[]) {
        _.forEach(ptBookings, ptBooking => {
            _.assign(ptBooking, {
                'checkedInCount': this.personalTourAttendanceUtils.getCheckedInAttendance(ptBooking),
                'attendingsCount': this.personalTourAttendanceUtils.getAttendantByBooking(ptBooking)
            });
            ptBooking['multipleContactField'] = '' // special fileds for filtering
            ptBooking['multipleStudentField'] = '' // special fileds for filtering
            ptBooking.contacts.forEach(contact => {
                contact['name'] = `${contact.lastName}, ${contact.firstName}`
                ptBooking['multipleContactField'] += `${contact.lastName}, ${contact.firstName} `
            });
            ptBooking.students.forEach(student => {
                student['name'] = `${student.lastName}, ${student.firstName}`
                ptBooking['multipleStudentField'] += `${student.lastName}, ${student.firstName} `
            });
            ptBooking['totalRSVP'] = (ptBooking.totalAttendees > 0) ? ptBooking.totalAttendees : '-'
            ptBooking['checkedIn'] = (ptBooking.totalAttendees > ptBooking.checkedInCount && ptBooking.checkedInCount > 0) ? 'Partial'
                : (ptBooking.totalAttendees < ptBooking.checkedInCount) && ptBooking.checkedInCount > 0 ? 'Overbooked'
                    : (ptBooking.checkedInCount === ptBooking.totalAttendees && ptBooking.checkedInCount !== 0) ? 'Yes' : 'No'
            ptBooking['totalcheckedIn'] = (ptBooking.checkedInCount > 0) ? ptBooking.checkedInCount : '-'
            ptBooking['conduct'] = ptBooking.conductAgreed ? 'Yes' : 'No'
        });
    }

    private updateData() {
        this.buildTable();
    }

    updateDataCallback(personalTourBooking: PersonalTourBooking) {
        const bookingId = _.findIndex(this.personalTour.personalTourBookings, { id: personalTourBooking.id });
        if (bookingId === -1) {
            this.personalTour.personalTourBookings.push(personalTourBooking);
        } else {
            this.personalTour.personalTourBookings[bookingId] = personalTourBooking;
        }
        this.updateData();
        Utils.DetectChanges(this.ref);
    }


    editBookingModal(booking: PersonalTourBooking) {
        const editPersonalTourBookingModalRef = this.modalService.open(EditPersonalTourBookingModalComponent, Constants.ngbModalLg);
        editPersonalTourBookingModalRef.componentInstance.personalTourBooking = booking;
        editPersonalTourBookingModalRef.componentInstance.fromUrl = this.currentUrl;
        editPersonalTourBookingModalRef.componentInstance.belongsToActivityLog = false;
        editPersonalTourBookingModalRef.result.then((res: { action: ModalAction, updatedBooking?: PersonalTourBooking }) => {
            switch (res.action) {
                case ModalAction.Update: this.updateDataCallback(res.updatedBooking); break;
                default: break;
            }
        });
        this.platformLocation.onPopState(() => {
            editPersonalTourBookingModalRef.close({ action: ModalAction.LeavePage });
        });
    }

    // bookingCheckedIn is defined as true ONLY when ALL items (other attendees, students and contacts) are checked in
    private isBookingCheckedin(personalTourBooking: PersonalTourBooking) {
        let bookingCheckedIn = personalTourBooking.otherAttendeesCheckedIn;
        if (bookingCheckedIn && personalTourBooking.contacts) {
            _.forEach(personalTourBooking.contacts, contact => {
                if (!contact.PersonalTourContact.checkedIn) {
                    bookingCheckedIn = false;
                }
            });
        }
        if (bookingCheckedIn && personalTourBooking.students) {
            _.forEach(personalTourBooking.students, student => {
                if (!student.PersonalTourStudent.checkedIn) {
                    bookingCheckedIn = false;
                }
            });
        }
        return bookingCheckedIn;
    }

    checkInBooking(personalTourBooking: PersonalTourBooking) {
        if (personalTourBooking.attendingsCount === 0) {
            Utils.showNotification('Cannot check in empty booking', Colors.danger);
            return;
        }

        const checkedIn = !this.isBookingCheckedin(personalTourBooking);
        this.httpService.postAuth('personal-tour-booking/check-in/', {
            checkedIn,
            id: personalTourBooking.id
        }).then(() => {
            personalTourBooking.otherAttendeesCheckedIn = checkedIn;
            if (personalTourBooking.contacts) {
                _.forEach(personalTourBooking.contacts, contact => {
                    contact.PersonalTourContact.checkedIn = checkedIn;
                });
            }
            if (personalTourBooking.students) {
                _.forEach(personalTourBooking.students, student => {
                    student.PersonalTourStudent.checkedIn = checkedIn;
                });
            }
            if (checkedIn && personalTourBooking.otherAttendees === 0) {
                if (personalTourBooking.totalAttendees - personalTourBooking.students.length - personalTourBooking.contacts.length > -1) {
                    personalTourBooking.otherAttendees =
                        personalTourBooking.totalAttendees - personalTourBooking.students.length - personalTourBooking.contacts.length;
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
                this.httpService.getAuth('personal-tour-booking/delete/' + item.id).then(() => {
                    _.remove(this.personalTour.personalTourBookings, b => b.id === item.id);
                    this.updateData();
                    Utils.deletedSuccessfully().then(() => {
                        if (this.personalTour.personalTourBookings.length === 0) {
                            Swal.fire({
                                title: 'There are no people scheduled for this tour !!!',
                                text: 'Would you like to keep or remove it all together?',
                                type: 'warning',
                                showCancelButton: true,
                                confirmButtonClass: 'btn btn-delete',
                                cancelButtonClass: 'btn btn-success',
                                confirmButtonText: 'Delete',
                                cancelButtonText: 'Keep',
                                buttonsStyling: false
                            }).then((userRes) => {
                                if (userRes && userRes.value) {
                                    this.httpService.getAuth('personal-tour/delete/' + this.personalTour.id).then((res) => {
                                        this.router.navigate(['/events/personal-tour']);
                                        Swal.fire({
                                            title: 'Deleted!',
                                            text: 'Personal Tour has been deleted.',
                                            type: 'success',
                                            confirmButtonClass: 'btn btn-success',
                                            buttonsStyling: false
                                        });
                                    });
                                }
                            });
                        }
                    });
                });
            }
        });
    }

    addAnAttendee() {
        const newPersonalTourBooking = new PersonalTourBooking();
        newPersonalTourBooking.personalTourId = this.personalTour.id;
        newPersonalTourBooking.otherAttendees = 0;
        newPersonalTourBooking.totalAttendees = 0;
        newPersonalTourBooking.otherAttendeesCheckedIn = false;
        this.editBookingModal(newPersonalTourBooking);
    }

}
