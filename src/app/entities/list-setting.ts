import { School } from './school';
import { List } from './list';

export class ListSetting {
    id: number;
    displayOther: boolean;
    listId: number;
    list: List;
    schoolId: number;
    school: School;
}
