import { Document } from './document';
import { AppForm } from '../app-form';
import { ApplicationStatus, Role } from 'app/common/enums';

export interface FillableAppFormDoc extends Document {
    form: AppForm; // the application form being filled out by the contact
    model: {}; // the values outputted by ngx schema form.
    applicationStatus: ApplicationStatus;
    metaData: {
        contactId: null | number; // the id of the contact filling out the form
        studentId: null | number; // the id of the student that applies to the school
        publishedFormId: string; // the id of the published form version that fillableForm originates from
    };
    editor?: { id: number, role: Role };
}
