import { Event } from './event';
import { PersonalTour } from './personal-tour';

export class EventEmail {
    public static TYPE_EMAIL_EVENT = 'event';
    public static TYPE_EMAIL_PERSONAL_TOUR = 'personal_tour';
    public static SCHEDULE_MOMENT_AFTER = 'after';
    public static SCHEDULE_MOMENT_PRIOR = 'prior';
    id: number;
    type: string;
    subject: string;
    message: string;
    activated: boolean;
    processed: boolean;
    isImmediate: boolean;
    scheduleDays: number;
    scheduleMoment: string;
    scheduledLocalTime: string;
    sendAt: string;
    eventId: number;
    event: Event;
    personalTourId: number;
    personalTour: PersonalTour
    isCheckedIn: boolean;
    sentString?: string;
    to?: string;
    check: boolean;
    schoolId: number;
}
