import { ListItem } from './list-item';
import { School } from './school';
import { Booking } from './booking';
import { Campus } from './campus';
import { Student } from './student';
import { ISelectedItem } from './slected-items';
import { SubTour } from './sub-tour';

export class Event implements ISelectedItem {
    id: number;
    schoolTourId?: number;
    externalEventId?: number;
    schoolTour: ListItem;
    bookings: Array<Booking>;
    subTours: Array<SubTour>;
    date: string;
    time: string;
    endTime: string;
    maxNumber: number;
    location: string;
    isRegistrationDisabled: boolean;
    isRegistrationDisabledAutoManaged: boolean;
    hasBeenAlmostFull?: boolean;
    hasBeenFull?: boolean;
    description: string;
    isSubToursEnabled: boolean;
    isMultipleSubtours: boolean;
    schoolId?: number;
    school?: School;
    campusId?: number;
    campus: Campus;

    // only for angular
    students?: Array<Student>;
    studentsCount?: number;
    checkedInStudents?: number;
    contacts?: number;
    studentsInterest?: number;
    studentsApplicant?: number;
    studentsEnroled?: number;
    families?: number;
    attending?: number;
    checkins?: number;
    checkinsPercentage?: number;
    otherAttendees?: number;
    eventStudents?: Array<Student>;
    selected?: boolean; // for checkboxes
    totalAttendedStudents?: number;
    attendedStudents?: Array<Student>;
    alert?: string;
    isFull?: boolean;
    isAlmostFull?: boolean;
    isFuture?: boolean;

    constructor() {
        this.isRegistrationDisabled = false;
        this.isSubToursEnabled = false;
        this.isMultipleSubtours = false;
    }
}
