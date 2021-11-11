import { School } from './school';

export class EmailTemplate {
    public static TYPE_EMAIL_SCHOOL_PROSPECTUS = 'school_prospectus';
    public static TYPE_EMAIL_GENERAL_ENQUIRY = 'general_enquiry';
    public static TYPE_EMAIL_COMMS_MODULE = 'comms_module';
    public static SCHEDULE_MOMENT_AFTER = 'after';
    public static SCHEDULE_MOMENT_PRIOR = 'prior';

    id: number;
    type: string;
    url: string;
    subject: string;
    message: string;
    activated: boolean;
    isImmediate: boolean;
    scheduleDays: number;
    scheduleMoment: 'after';
    scheduledLocalTime: string;
    schoolId: number;
    school: School;

    sentString?: string;
    to?: string;
    check: boolean;
}
