import { Injectable } from '@angular/core';
import { HttpService } from 'app/services/http.service';

import { Keys } from 'app/common/keys';
import { Utils } from 'app/common/utils';
import { IWidgetParams } from 'app/common/interfaces';

import { Campus } from 'app/entities/campus';
import { Student } from 'app/entities/student';
import { YearLevelList } from 'app/entities/year-level-list';
import { YearLevel } from 'app/entities/year-level';
import { UserInfo } from 'app/entities/userInfo';

import * as _ from 'lodash'

@Injectable()
export abstract class AnalyticsService {
    protected uniqName: string;
    protected filterFields: string[] = [];
    protected title = '';
    protected icon = 'filter_list';

    private _campuses: Campus[] = [];
    public get campuses(): Campus[] {
        return this._campuses;
    }
    public set campuses(campuses: Campus[]) {
        this._campuses = campuses;
    }

    private _campusId: number | string;
    public get campusId(): number | string {
        return this._campusId;
    }
    public set campusId(campusId: number | string) {
        this._campusId = campusId;
    }

    protected allStudents: Student[] = [];

    protected yearLevelList: YearLevelList;
    protected yearLevels: YearLevel[];
    protected intakeYears: any[] = [];

    protected userInfo: UserInfo = null;

    constructor(protected httpService: HttpService) {
        this.filterFields = [Keys.startingYear, Keys.schoolIntakeYearId, Keys.studentStatusStageId, Keys.studentStatusId];
    }

    public abstract getData(): Promise<Student[]>;

    campusIsChanged(): IWidgetParams {
        if (this.campusId === 'all') {
            return this.initializationLevels(this.yearLevelList.getCurrentSchoolYearLevelsByCampus(this.campusId), this.allStudents);
        } else {
            const students = _.filter(this.allStudents, s => s.campusId === this.campusId);
            const currentCampusId = Utils.getCurrentCampusId(+this.campusId, this.campuses);
            return this.initializationLevels(this.yearLevelList.getCurrentSchoolYearLevelsByCampus(currentCampusId), students);
        }
    }

    protected initializationLevels(yearLevels: YearLevel[], students: Student[]): IWidgetParams {
        this.yearLevels = yearLevels;
        const widgetParams = {
            icon: this.icon,
            title: this.title,
            students,
            yearLevels,
            intakeYears: this.intakeYears,
            uniqName: this.uniqName,
            filterFields: this.filterFields,
        };
        return widgetParams;
    }

}
