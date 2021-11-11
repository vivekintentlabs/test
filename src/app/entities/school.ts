import { ManyToMany } from './manytoMany';
import { User } from './user';
import { EmailSignature } from './email-signature';
import { ManagementSystem } from './management-system';
import { AdministrativeArea } from './administrative-area';
import { Country } from './country';
import { TimeZone } from './time-zone';
import { ISchoolModule } from 'app/common/interfaces';

export class School {

    id: number;
    name: string;
    address: string;
    genders: ManyToMany[] = [];
    sublocality?: string;
    city: string;
    administrativeAreaId: string;
    administrativeArea: AdministrativeArea;
    countryId: string;
    country: Country;
    postCode: string;
    phone: string;
    email: string;
    status: number;
    edxPassword: string;
    managementSystemId: number;
    managementSystem: ManagementSystem;
    expirationDate: string;
    timeZoneId: string;
    timeZone: TimeZone;
    startingMonth: number;
    adminName: string;
    uniqId: string;
    users: User[];
    googleTrackingId: string;
    googleTrackingIsEnabled: boolean;
    currentSchoolDisplayOther: boolean;
    hasInternationals: boolean;
    isBoardingEnabled: boolean;
    isSpouseEnabled: boolean;
    stripePublicKey: string;
    modules: ISchoolModule[];
    files: File[];
    emailSignature: EmailSignature;
}

export class SchoolList {
    id: number;
    name: string;
    administrativeAreaName: string;
    status: string;
    expirationDate: string;
    timeZoneId: string;
    usersCount: number;
    activated: number;
    last24: number;
    lastLogin: string;
}
