import { Event } from './event';
import { AbstractBooking } from './abstract-booking';

export class Booking extends AbstractBooking {
    eventId: number;
    conductAgreed: boolean;
    event: Event;
    externalBookingId: number;
    message: string;
    messageIsEditable: boolean;
    isFirstVisit: boolean;
    userName?: string;
}
