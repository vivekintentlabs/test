import { Contact } from '../contact';
import { ListItem } from '../list-item';

export class Prospectus {
    year: number;
    month: string;
    date: string;
    contact: Contact;
    createdAt: string;
    leadSource: ListItem;
    studentId: number;
    campusId: number;
}
