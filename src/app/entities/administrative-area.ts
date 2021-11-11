import { Country } from './country';

export class AdministrativeArea {
    id: string;
    name: string;
    countryId: string;
    country: Country;

    toString(): string {
        return this.name;
    }
}
