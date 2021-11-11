import { ManyToMany } from './manytoMany';
import { School } from './school';
import { AdministrativeArea } from './administrative-area';
import { Country } from './country';
import { TimeZone } from './time-zone';
export class Campus {
    public static CAMPUS_TYPE_MAIN = 'main';
    public static CAMPUS_TYPE_NORMAL = 'normal';
    public static CAMPUS_TYPE_UNDECIDED = 'undecided';

    id: number;
    name: string;
    campusType: string;
    synCode: string;
    sequence: number;
    address: string;
    lat: number;
    lng: number;
    genders: Array<ManyToMany> = [];
    sublocality?: string;
    city: string;
    administrativeAreaId: string;
    administrativeArea: AdministrativeArea;
    administrativeAreaName: string;
    countryId: string;
    country: Country;
    postCode: string;
    timeZoneId: string;
    timeZone: TimeZone;
    schoolId: number;
    school: School;
}
