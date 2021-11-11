import { Contact } from './contact';
import { Student } from './student';
import { SubTour } from './sub-tour';

export class AbstractBooking {

    id: number;
    otherAttendees: number;
    otherAttendeesCheckedIn: boolean;
    totalAttendees: number;
    contacts: Array<Contact> = [];
    students: Array<Student> = [];
    subTours: Array<SubTour> = [];
    createdAt: Date;
    // only for angular not node
    attendingsCount: number;
    checkedInCount: number;
}
