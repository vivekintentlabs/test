import { TimeStamp } from '../types';
import { Document } from './document';

export interface StudentApplicationSummaryInfo {
    id: number;
    firstName: string;
    lastName: string;
    campusId: number;
    startingYear: number;
    currentSchoolYearId: number;
    currentSchoolYear: string;
    intakeYearLevelId: number;
    intakeYearLevel: string;
}

export interface ContactApplicationSummaryInfo  {
    id: number;
    firstName: string;
    lastName: string;
    mobilePhone: string;
}

export interface ApplicationSummaryDoc extends Document {
    applicationId: string;
    studentApplicationSummaryInfo: StudentApplicationSummaryInfo;
    contactApplicationSummaryInfo: ContactApplicationSummaryInfo;
    applicationStatus: string;
    submittedAt?: TimeStamp;
}
