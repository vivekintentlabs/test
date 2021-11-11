import { School } from './school';
import { PersonalTourBooking } from './personal-tour-booking';
import { Campus } from './campus';
import { ISelectedItem } from './slected-items';
import { User } from './user';
export class PersonalTour implements ISelectedItem {
    id: number;
    date: string;
    time: string;
    endTime: string;
    assigneeId: number;
    assignee: User;
    cc: string;
    location: string;
    schoolId?: number;
    school?: School;
    campusId: number;
    campus: Campus;
    createdAt: Date;
    personalTourBookings: Array<PersonalTourBooking>;

    // only for angular
    assigneeName?: string;
    students?: number;
    studentsInterest?: number;
    studentsApplicant?: number;
    studentsEnroled?: number;
    families?: number;
    attending?: number;
    checkins?: number;
    checkinsPercentage?: number;
    selected?: boolean; // for checkboxes
    isFuture?: boolean;
}
