import { Document } from './document';

export interface SchoolDoc extends Document {
    schoolId: number;
    header: string;
    footer: string;
}
