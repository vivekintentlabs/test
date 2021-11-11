import { Document } from './document';

export interface AppSchoolDoc extends Document {
    schoolId: number;
    header: string;
    footer: string;
}
