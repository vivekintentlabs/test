import { Injectable } from '@angular/core';

import { HttpService } from 'app/services/http.service';

import { Booking } from 'app/entities/booking';
import { Student } from 'app/entities/student';

import * as _ from 'lodash';


@Injectable()
export class EditBookingModalService {

    constructor(private httpService: HttpService) { }

    getRelatedStudents(contactId: number, booking: Booking): Promise<void> {
        return this.httpService.getAuth('contact/' + contactId + '/related-students/').then((result) => {
            const relatedStudents: Student[] = result['students'];
            _.forEach(relatedStudents, student => {
                student.BookingStudent = { bookingId: booking.id, studentId: student.id, checkedIn: false };
                booking.students = _.unionBy(booking.students, [student], 'id');
            });
        });
    }

}
