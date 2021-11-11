import { AbstractCheckInEvent } from './abstract-check-in-event';

export class BookingStudent extends AbstractCheckInEvent {
    studentId: number;
}
