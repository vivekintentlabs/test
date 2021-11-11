import { Injectable } from '@angular/core';
import { School } from '../../entities/school';
import { SchoolInfo } from './school.model';
import { SchoolStore } from './school.store';

@Injectable({ providedIn: 'root' })
export class SchoolService {

    constructor(private schoolStore: SchoolStore) { }

    set(school: School) {
        this.schoolStore.updateSchool(school);
    }

    getSchool(): SchoolInfo {
        return this.schoolStore.getValue();
    }

    getStartingMonth(): number {
        return this.schoolStore.getValue().startingMonth;
    }

    getSchoolName(): string {
        return this.schoolStore.getValue().name;
    }
}
