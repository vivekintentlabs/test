import { School } from './school';

export class User {

    public static ROLE_SYSADMIN = 'system_admin';
    public static ROLE_SCHOOLADMIN = 'school_admin';
    public static ROLE_EDITOR = 'editor';
    public static ROLE_USER = 'user';
    public static ROLE_SCHOOLREPRESENTATIVE = 'school_representative';
    public static ROLE_CONTACT = 'contact';
    // public static DEVELOPER = 'developer';
    // public static ROLES = DataType.ENUM(User.ROLE_SYSADMIN, User.ROLE_SCHOOLADMIN, User.ROLE_EDITOR, User.ROLE_USER);

    id: number;
    lastName: string;
    firstName: string;
    email: string;
    title: string;
    activated: boolean;
    role: string;
    schoolId: number;
    campusId: number;
    school: School;
    lastLogin: string;
    last_shown_version: string;
    sendNotifications: boolean;
}
