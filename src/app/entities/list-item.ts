import { List } from './list';
import { School } from './school';
import { Student } from './student';
import { Contact } from './contact';
import { Constants } from 'app/common/constants';

export class ListItem {

    // Counter for the custom new items which will be created by users. (negative ids which will be replaced after creation in DB)
    private static counter = 0;

    id: number;
    name: string;
    synCode: string;
    readonly description: string;
    sequence: number;
    listId: number;
    list: List;
    schoolId: number;
    school: School;
    students: Array<Student>;
    check: boolean; // for deleting
    isModifiable: boolean;
    isDeletable: boolean;
    code: number;
    includeInList: boolean;
    contacts: Contact[];

    public static getListItemOther() {
        const other: ListItem = new ListItem();
        other.id = 0;
        other.name = Constants.otherLabel;
        return other;
    }

    // When a user creates a custom ListItem (Other...)
    public static newListItem(name: string) {
        ListItem.counter--;
        const newListItem: ListItem = new ListItem();
        newListItem.id = ListItem.counter;
        newListItem.name = name;
        return newListItem;
    }
}
