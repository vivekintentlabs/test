import { BookingContact } from './booking-contact';
import { PersonalTourContact } from './personal-tour-contact';
import { ListItem } from './list-item';
import { ISelectedItem } from './slected-items';
import { ContactRelationship } from './contact-relationship';
import { AdministrativeArea } from './administrative-area';
import { Country } from './country';
import { Booking } from './booking';
import { PersonalTourBooking } from './personal-tour-booking';
import { Marriage } from './marriage';
import { AppContactMapping } from './app-contact-mapping';

export class Contact implements ISelectedItem {
    id: number;
    lastName: string;
    firstName: string;
    genderId: number;
    gender: ListItem;
    address: string;
    lat: number;
    lng: number;
    sublocality?: string;
    city: string;
    administrativeAreaId: string;
    administrativeArea: AdministrativeArea;
    postCode: string;
    countryId: string;
    country: Country;
    email: string;
    homePhone: string;
    workPhone: string;
    mobile: string;
    alumniId: number;
    alumni: ListItem;
    graduationYear: number;
    nameAtSchool: string;
    receiveUpdateEmail: boolean;
    receiveUpdatePhone: boolean;
    receiveMailUpdates: boolean;
    schoolId: number;
    marriage: Marriage;
    bookings: Booking[];
    personalTourBookings: PersonalTourBooking[];
    BookingContact: BookingContact;
    PersonalTourContact: PersonalTourContact;
    bookingContacts: BookingContact[];
    personalTourContacts: PersonalTourContact[];
    uniqId: string;
    salutationId: number;
    salutation: ListItem;
    contactRelationships: ContactRelationship[];
    createdAt: string;
    updatedAt: string;

    appContactMapping?: [AppContactMapping];

    // only for angular
    selected?: boolean;
    color?: string;
    duplicate?: number;
    checked?: boolean;
    name?: string;

    constructor() {
        this.receiveMailUpdates = false;
        this.receiveUpdateEmail = true;
        this.receiveUpdatePhone = true;
    }
}
