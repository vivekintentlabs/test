import { EnrolmentTarget } from './enrolmentTarget';

export class IntakeClassYear {
    id: number;
    intakeClass: number;
    startDate: string;
    schoolId: number;
    campusId: number;
    enrolmentTargets?: Array<EnrolmentTarget>;
}
