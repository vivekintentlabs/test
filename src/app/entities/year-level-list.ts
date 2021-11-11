import { YearLevel, IYearLevel } from './year-level';
import { Utils } from 'app/common/utils';
import { UserInfo } from './userInfo';

import * as _ from 'lodash';


export class YearLevelList extends Array<YearLevel> {

    constructor(yearLevels: IYearLevel[]) {
        let items = [];
        if (_.isArray(yearLevels)) {
            items = yearLevels.map(yearLevelObj => new YearLevel(yearLevelObj));
        }
        super(...items);
        Object.setPrototypeOf(this, Object.create(YearLevelList.prototype));
    }

    public getCurrentSchoolYearLevelsByCampus(campusId: number | string): YearLevel[] {
        const yearLevelsForCampus = _.cloneDeep(this);
        const userInfo: UserInfo = Utils.getUserInfoFromToken();
        if (userInfo.undecidedCampusId === campusId) {
            campusId = userInfo.mainCampusId;
        }
        if (campusId && campusId !== 'all') {
            _.remove(yearLevelsForCampus, yl => !yl.isCurrent(+campusId));
        }
        return yearLevelsForCampus;
    }

    public getAvailableSchoolYearLevelsByCampus(campusId: number | string): YearLevel[] {
        const yearLevelsForCampus = _.cloneDeep(this);
        const userInfo: UserInfo =  Utils.getUserInfoFromToken();
        if (userInfo.undecidedCampusId === campusId) {
            campusId = userInfo.mainCampusId;
        }
        if (campusId && campusId !== 'all') {
            _.remove(yearLevelsForCampus, yl => !yl.isAvailable(+campusId));
        }
        return yearLevelsForCampus;
    }

    getCurrentSchoolYearLevels(campusId: number): YearLevel[] {
        return this.filter(yl => yl.isCurrent(campusId));
    }

    getIntakeYearLevels(campusId: number): YearLevel[] {
        return this.filter(yl => yl.isAvailable(campusId));
    }

    getCoreYearLevels(campusId: number): YearLevel[] {
        return this.filter(yl => yl.isCore(campusId));
    }

    updateYearLevelSequences(yearLevels: YearLevel[]): void {
        yearLevels.forEach(yearLevel => {
            const changedYearLevel = this.find(y => y.id === yearLevel.id);
            if (changedYearLevel) {
                changedYearLevel.sequence = yearLevel.sequence;
            }
        });
        this.sort((a, b) => (a.sequence > b.sequence ? 1 : -1));
    }

}
