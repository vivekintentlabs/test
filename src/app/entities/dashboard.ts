import { IWidget } from '../common/interfaces';
import { School } from './school';

export class Dashboard {
    id: number;
    dashboardConfig: Array<IWidget>;
    school: School;
    schoolId: number;
}
