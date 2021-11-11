import { Injectable, OnDestroy } from '@angular/core';
import { ApplicationSummaryDoc } from 'app/applications/interfaces/documents/app-summary-doc';
import { AppListStore } from './app-list.store';
import * as _ from 'lodash';

@Injectable()
export class AppListService implements OnDestroy {

    constructor(private appListStore: AppListStore) { }

    set(appSummaries: ApplicationSummaryDoc[]) {
        this.appListStore.set(appSummaries);
    }

    remove(ids: string[]) {
        this.appListStore.remove(ids)
    }

    ngOnDestroy() {
        this.appListStore.destroy();
    }

}
