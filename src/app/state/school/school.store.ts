import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { School } from '../../entities/school';
import { SchoolInfo } from './school.model';

export function createInitialState(): SchoolInfo {
    return { id: null, name: '', startingMonth: 0, modules: [], managementSystem: { id: null, name: '', export2Xml: false, format: 'default' } };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'school' })
export class SchoolStore extends Store<SchoolInfo> {
    constructor() {
        super(createInitialState());
    }

    updateSchool(school: School) {
        this._setState({
            id: school.id,
            name: school.name,
            startingMonth: school.startingMonth,
            modules: school.modules,
            managementSystem: school.managementSystem,
        });
    }

}
