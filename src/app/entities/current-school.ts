import { ListItem } from './list-item';
import { School } from './school';

export class CurrentSchool {
    id: number;
    schoolName: string;
    classificationId: number;
    classification: ListItem;
    classificationName: string;
    statusId: number;
    status: ListItem;
    statusName: string;
    synCode: string;
    schoolId: number;
    school: School;
    includeInList: boolean;

    // Counter for the custom new items which will be created by users. (negative ids which will be replaced after creation in DB)
    private static counter = 0;

    // When a user creates a custom CurrentSchool (Other...)
    public static newCurrentSchool(schoolName: string) {
        CurrentSchool.counter--;
        const newCurrentSchool: CurrentSchool = new CurrentSchool();
        newCurrentSchool.id = CurrentSchool.counter;
        newCurrentSchool.schoolName = schoolName;
        return newCurrentSchool;
    }
}
