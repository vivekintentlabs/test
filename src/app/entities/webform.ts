import { School } from './school';
import { ListItem } from './list-item';
import { AdministrativeArea } from './administrative-area';
import { Country } from './country';
import { IFieldSettings } from '../common/interfaces';

export class Webform {
    id: number;
    name: string;
    display: number;
    submission: number;
    formType: number;
    schoolId: number;
    school: School;
    uniqId: string;
    googleTrackingEventName: string;
    fieldSettings: IFieldSettings;
}
