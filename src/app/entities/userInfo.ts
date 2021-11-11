import { User } from './user';

export class UserInfo {

    constructor(
        public id: number,
        public role: string,
        public schoolId: number,
        public schoolUniqId: string,
        public campusId: number,
        public mainCampusId: number,
        public undecidedCampusId: number,
        public specificCampusId: number,
        public managementSystemId: number,
        public eventId: number,
        public locale: string
    ) {}

    public isSysAdmin() {
        return (this.role === User.ROLE_SYSADMIN) ? true : false;
    }

    public isSchoolAdmin() {
        return (this.role === User.ROLE_SCHOOLADMIN) ? true : false;
    }

    public isSchoolRepresentative() {
        return (this.role === User.ROLE_SCHOOLREPRESENTATIVE) ? true : false;
    }

    public isSchoolEditor() {
        return (this.role === User.ROLE_EDITOR) ? true : false;
    }

    public isSchoolUser() {
        return (this.role === User.ROLE_USER) ? true : false;
    }

    public isSchoolContact() {
        return (this.role === User.ROLE_CONTACT) ? true : false;
    }

    public isSchoolUserOrHigher() {
        return (this.isSchoolUser() || this.isSchoolEditorOrHigher());
    }

    public isSchoolEditorOrHigher() {
        return (this.isSchoolEditor() || this.isSchoolAdminOrHigher());
    }

    public isSchoolAdminOrHigher() {
        return (this.isSchoolAdmin() || this.isSysAdmin());
    }

    public isSchoolAdminOrLower() {
        return (this.isSchoolAdmin() || this.isSchoolEditor() || this.isSchoolUser() || this.isSchoolRepresentative());
    }

}
