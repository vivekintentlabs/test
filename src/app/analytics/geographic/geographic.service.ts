import { Injectable } from '@angular/core'

import { HttpService } from 'app/services/http.service';
import { AnalyticsService } from '../analytics.service';

import { Utils } from 'app/common/utils';
import { UniqNames } from 'app/common/uniq-names';
import { LICode } from 'app/common/enums';
import { Keys } from 'app/common/keys';
import { T } from 'app/common/t';

import { Student } from 'app/entities/student';
import { YearLevelList } from 'app/entities/year-level-list';
import { ContactRelationship } from 'app/entities/contact-relationship';

import * as _ from 'lodash'

@Injectable({
    providedIn: 'root',
})
export class GeographicService extends AnalyticsService  {

    constructor(httpService: HttpService) {
        super(httpService);
        this.uniqName = UniqNames[UniqNames.AnalyticsGeographic];
        this.title = "By Location"
        this.icon = "location_on"
    }

    public getData(): Promise<Student[]> {
        return this.httpService.getAuth('student/geographic/').then((result: any) => {
            this.userInfo = Utils.getUserInfoFromToken();
            this.campusId = this.userInfo.campusId || 'all';

            this.campuses = result.campuses;
            _.forEach(result.geographic.intakeYears, (intakeYear: any) => {
                if (intakeYear) {
                    this.intakeYears.push({ intakeYear });
                }
            });

            this.allStudents = result.geographic.studentsJson;
            this.yearLevelList = new YearLevelList(result.geographic.yearLevels);

            return this.allStudents;
        });
    }

    public getLocations(students: Student[]) {
        const allLocations = [];
        _.forEach(students, (student: Student) => {
            _.forEach(student.contactRelationships, (relationshipData: ContactRelationship) => {
                if (relationshipData[Keys.contactType].code === LICode.contact_type_primary) {
                    allLocations.push({
                        address: (relationshipData[Keys.contact].address || '') + ' ' + (relationshipData[Keys.contact].city || ''),
                        contact: relationshipData[Keys.contact],
                        schoolIntakeYear: (student.schoolIntakeYear) ? student.schoolIntakeYear.name : T.unknown,
                        intakeYear: student.startingYear,
                        campusId: student.campusId
                    });
                }
            });
        });
        return allLocations;
    }

}
