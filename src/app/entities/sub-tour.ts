import { Event } from './event';
import { School } from './school';

export class SubTour {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    maxNumber: number;
    isRegistrationDisabled: boolean;
    isRegistrationDisabledAutoManaged: boolean;
    hasBeenFull?: boolean;
    eventId: number;
    event: Event;
    schoolId: number;
    school: School;

    // angular side only
    isFull?: boolean;
    alert?: string;
    rsvp?: string;

    constructor() {
        this.isRegistrationDisabled = false;
        this.isRegistrationDisabledAutoManaged = false;
    }
}
