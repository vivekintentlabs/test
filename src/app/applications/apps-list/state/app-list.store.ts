import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ApplicationSummaryDoc } from 'app/applications/interfaces/documents/app-summary-doc';

export interface ApplicationSummaryDocState extends EntityState<ApplicationSummaryDoc, string> { }

@Injectable()
@StoreConfig({ name: 'app-list', idKey: 'applicationId' })
export class AppListStore extends EntityStore<ApplicationSummaryDocState> {

    constructor() {
        super();
    }

}
