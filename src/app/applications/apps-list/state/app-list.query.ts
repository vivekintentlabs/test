import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ApplicationSummaryDocState, AppListStore } from './app-list.store';

@Injectable()
export class AppListQuery extends QueryEntity<ApplicationSummaryDocState> {
    appListData$ = this.selectAll();
    appListData = this.getAll();

    constructor(protected store: AppListStore) {
        super(store);
    }

}
