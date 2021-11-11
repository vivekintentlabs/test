import { School } from './school';
import { Campus } from './campus';
import { CampusYearLevel } from './campus-year-level';

import * as _ from 'lodash';

export class YearLevel implements IYearLevel {
    id: number;
    name: string;
    synCode: string;
    sequence: number;
    schoolId: number;
    school: School;
    campuses: Campus[];
    campusYearLevels: CampusYearLevel[];

    constructor(obj?: IYearLevel) {
        this.id = obj && obj.id || null;
        this.name = obj && obj.name || '';
        this.synCode = obj && obj.synCode || null;
        this.sequence = obj && obj.sequence || 0;
        this.schoolId = obj && obj.schoolId || 0;
        this.school = obj && obj.school || null;
        this.campusYearLevels = obj && obj.campusYearLevels || [];
    }

    isCurrent(campusId: number): boolean {
        this.checkData();
        return !!(this.campusYearLevels.find(cyl => (cyl.campusId === campusId && cyl.isCurrent)));
    }

    isAvailable(campusId: number): boolean {
        this.checkData();
        return !!(this.campusYearLevels.find(cyl => (cyl.campusId === campusId && cyl.isAvailable)));
    }

    isCore(campusId: number = null): boolean {
        this.checkData();
        return campusId
            ? !!(this.campusYearLevels.find(cyl => (cyl.campusId === campusId && cyl.isCore)))
            : !!(this.campusYearLevels.find(cyl => cyl.isCore));
    }

    private checkData() {
        if (!this.campusYearLevels) {
            throw Error('Include CampusYearLevel to YearLevel');
        }
    }

}

export class IYearLevel {
    id: number;
    name: string;
    synCode: string;
    sequence: number;
    schoolId: number;
    school: School;
    campuses: Campus[];
    campusYearLevels: CampusYearLevel[];

    public isCurrent(campusId: number) { }

    public isAvailable(campusId: number) { }

    public isCore(campusId: number) { }
}
