import { Injectable } from '@angular/core';

import { HttpService } from 'app/services/http.service';
import { CurrentSchool } from 'app/entities/current-school';
import { MergeCurrentSchoolDTO } from 'app/common/dto/merge';

import * as _ from 'lodash';

@Injectable({
    providedIn: 'root',
})
export class MergeCurrentSchoolService {

    constructor(private httpService: HttpService) { }

    public merge(targetId: number, items: CurrentSchool[]): Promise<object> {
        const sourceIds: number[] = items.filter(i => i.id !== targetId).map(i => i.id);
        const mergeData: MergeCurrentSchoolDTO = { targetId, sourceIds };
        return this.httpService.postAuth('current-school/merge', mergeData);
    }

}
