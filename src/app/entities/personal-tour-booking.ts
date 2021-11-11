import { PersonalTour } from './personal-tour';
import { AbstractBooking } from './abstract-booking';

export class PersonalTourBooking extends AbstractBooking {
    personalTourId: number;
    personalTour: PersonalTour;
    conductAgreed: boolean;
    isFirstVisit: boolean;
    userName?: string;
}
