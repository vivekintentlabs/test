import { Contact } from 'app/entities/contact';
import { Student } from 'app/entities/student';
import { ContactRelationship } from 'app/entities/contact-relationship';

export class MergeContactDTO {
    constructor(
        public sourceContactIds: number[],
        public targetContact: Partial<Contact>,
    ) { }
}

export class MergeStudentDTO {
    constructor(
        public sourceStudentIds: number[],
        public targetStudent: Partial<Student>,
        public contactRelationship: Partial<ContactRelationship>
    ) { }
}

export class MergeListItemDTO {
    constructor(
        public listId: number,
        public targetId: number,
        public sourceIds: number[],
    ) {
    }
}

export class MergeCurrentSchoolDTO {
    constructor(
        public targetId: number,
        public sourceIds: number[],
    ) {
    }
}
