import { YearLevel } from './year-level';

export class EnrolmentTarget {

    id: number;
    yearLevelMax: number;
    availablePlaces: number;
    intakeClassYearId: number;
    intakeYearId: number;
    intakeYear: YearLevel;
    schoolId: number;
    campusId: number;
}
