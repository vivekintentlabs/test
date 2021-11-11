import { ListItem } from './list-item';
import { Student } from './student';

export class ActivityLog {
    id: number;
    date: string;
    activityId: number;
    activity: ListItem;
    leadSourceId: number;
    leadSource: ListItem;
    notes: string;
    sendProspectus: boolean;
    studentId: number;
    student: Student;
    createdAt: string;
    message: string;
    messageIsEditable: boolean;
    userName?: string;
}
