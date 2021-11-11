import { Campus } from './campus';
import { YearLevel } from './year-level';

export class CampusYearLevel {
    campusId: number;
    campus: Campus;
    yearLevelId: number;
    yearLevel: YearLevel;
    isCurrent: boolean;
    isAvailable: boolean;
    isCore: boolean;
}
