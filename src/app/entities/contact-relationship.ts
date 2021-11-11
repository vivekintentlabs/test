import { ListItem } from './list-item';
import { Contact } from './contact';
import { Student } from './student';

export class ContactRelationship {
    readonly id: number;
    readonly studentId: number;
    readonly contactId: number;
    readonly relationshipType: ListItem;
    readonly contactType: ListItem;
    readonly relationshipTypeId: number;
    readonly contactTypeId: number;
    readonly contactTypeCode?: number;
    readonly contact: Contact;
    readonly student: Student;

    constructor(studentId: number, contactId: number, relationshipType: ListItem, contactType: ListItem, contactTypeCode?: number) {
        this.studentId = studentId;
        this.contactId = contactId;
        this.relationshipType = relationshipType;
        this.contactType = contactType;
        this.contactTypeCode = contactTypeCode;
    }
}
