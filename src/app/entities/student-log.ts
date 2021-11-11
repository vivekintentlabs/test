import { ListItem } from './list-item';
import { StudentStatus } from './student-status';
export class StudentLog {
    id: number;
    date: string;
    studentStatusId: number;
    studentStatus: StudentStatus;
    note: string;
    user: string;
    studentId: number;
}
