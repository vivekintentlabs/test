import { Country } from './country';

export class TimeZone {
    id: string;
    name: string;
    countryId: string;
    country: Country;
    offset?: string;
}
