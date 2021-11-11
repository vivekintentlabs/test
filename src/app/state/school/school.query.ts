import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { SchoolInfo } from './school.model';
import { SchoolStore } from './school.store';

@Injectable({ providedIn: 'root' })
export class SchoolQuery extends Query<SchoolInfo> {
    startingMonth$ = this.select(state => state.startingMonth);
    school$ = this.select(state => state);
    managementSystem$ = this.select(state => state.managementSystem);

    constructor(protected store: SchoolStore) {
        super(store);
    }

}
