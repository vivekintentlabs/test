import { AdministrativeArea } from './administrative-area';

export class Country {
    id: string;
    name: string;
    administrativeAreas?: Array<AdministrativeArea>;
}
