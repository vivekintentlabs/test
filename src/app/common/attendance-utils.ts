import { AbstractBooking } from 'app/entities/abstract-booking';
import { Contact } from 'app/entities/contact';
import { Student } from 'app/entities/student';

import { LICode } from './enums';

import { T } from './t';

import * as _ from 'lodash';


export abstract class BaseAttendanceUtils {

    public getAttendantByBooking(booking: any) {
        return booking.otherAttendees + booking.students.length + booking.contacts.length;
    }

    public getEventAttendance(bookings: AbstractBooking[]) {
        let studentsCount = 0;
        let contactsCount = 0;
        let attendingsCount = 0;
        let checkedInCount = 0;
        let checkedInStudentsCount = 0;
        let studentsInterest = 0;
        let studentsApplicant = 0;
        let studentsEnroled = 0;
        let otherAttendees = 0;
        let totalAttendees = 0;
        let attendedEventCount = 0;
        let attendedStudentsCount = 0;
        let attendedFamiliesCount = 0;
        let attendedRSVPCount = 0;
        const eventStudents = [];
        const eventAttendedStudents = [];
        _.forEach(bookings, (bookingJSON: AbstractBooking) => {
            studentsCount += bookingJSON.students.length;

            // getting attended counter
            const attended = this.getAllAttended(bookingJSON);
            attendedEventCount = attendedEventCount || attended.eventCount;
            attendedStudentsCount += attended.studentsCount;
            attendedFamiliesCount += attended.familiesCount;
            attendedRSVPCount += attended.rsvpCount;

            Array.prototype.push.apply(eventStudents, bookingJSON.students);
            if (attended.studentsCount) {
                Array.prototype.push.apply(eventAttendedStudents, bookingJSON.students);
            }
            contactsCount += bookingJSON.contacts.length;
            const allAttendants = this.getAttendantByBooking(bookingJSON);
            attendingsCount += allAttendants;
            otherAttendees += bookingJSON.otherAttendees;
            totalAttendees += bookingJSON.totalAttendees;
            checkedInCount += this.getCheckedInAttendance(bookingJSON);
            checkedInStudentsCount += this.getCheckedInStudentsAttendance(bookingJSON);

            studentsInterest += _.filter(bookingJSON.students, student => (
                student.studentStatus?.stage?.code === LICode.stage_interest
            )).length;
            studentsApplicant += _.filter(bookingJSON.students, student => (
                student.studentStatus?.stage?.code === LICode.stage_applicant
            )).length;
            studentsEnroled += _.filter(bookingJSON.students, student => (
                student.studentStatus?.stage?.code === LICode.stage_enroled
            )).length;
        });
        const checkinsPercentage = (checkedInCount / totalAttendees) * 100 || 0;
        const familiesCount = bookings.length;
        _.forEach(eventStudents, (item: Student) => {
            item.sIY = item.schoolIntakeYear ? item.schoolIntakeYear.name : T.unknown;
            item.sy = item.startingYear === null ? T.unknown : item.startingYear;
        })
        return {
            studentsCount, contactsCount,
            familiesCount, attendingsCount,
            checkedInCount, studentsInterest,
            studentsApplicant, studentsEnroled: studentsEnroled,
            checkinsPercentage: Math.round(checkinsPercentage), otherAttendees,
            eventStudents, totalAttendees, checkedInStudentsCount,
            eventAttendedStudents, attendedStudentsCount, attendedFamiliesCount,
            attendedRSVPCount, attendedEventCount
        };
    }

    public getCheckedInAttendance(booking: AbstractBooking) {
        let checkedInCount = (booking.otherAttendeesCheckedIn) ? booking.otherAttendees : 0;
        checkedInCount += this.getCheckedInStudentsAttendance(booking);
        _.forEach(booking.contacts, (item: Contact) => {
            checkedInCount = (this.isContactCheckedIn(item)) ? checkedInCount + 1 : checkedInCount;
        });
        return checkedInCount;
    }

    public getCheckedInStudentsAttendance(booking: AbstractBooking) {
        let checkedInStudentsCount = 0;
        _.forEach(booking.students, (item: Student) => {
            checkedInStudentsCount = (this.isStudentCheckedIn(item)) ? checkedInStudentsCount + 1 : checkedInStudentsCount;
        });
        return checkedInStudentsCount;
    }

    private getAllAttended(booking: AbstractBooking) {
        let eventCount = 0;
        let studentsCount = 0;
        let familiesCount = 0;
        let rsvpCount = 0;
        if (booking.otherAttendeesCheckedIn || _.find(booking.contacts, (contact: Contact) => this.isContactCheckedIn(contact))
            || _.find(booking.students, (student: Student) => this.isStudentCheckedIn(student))) {
            studentsCount = booking.students.length;
            familiesCount = 1;
            rsvpCount = booking.totalAttendees;
            eventCount = 1;
        }
        return { eventCount, studentsCount, familiesCount, rsvpCount };
    }

    protected abstract isContactCheckedIn(contact: Contact): boolean;
    protected abstract isStudentCheckedIn(student: Student): boolean;
}

export class EventAttendanceUtils extends BaseAttendanceUtils {
    protected isContactCheckedIn(contact: Contact): boolean {
        return contact.BookingContact.checkedIn;
    }
    protected isStudentCheckedIn(student: Student): boolean {
        return student.BookingStudent.checkedIn;
    }
}

export class PersonalTourAttendanceUtils extends BaseAttendanceUtils {
    protected isContactCheckedIn(contact: Contact): boolean {
        return contact.PersonalTourContact.checkedIn;
    }
    protected isStudentCheckedIn(student: Student): boolean {
        return student.PersonalTourStudent.checkedIn;
    }
}
