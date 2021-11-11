import { Injectable } from '@angular/core';

import { HttpService } from 'app/services/http.service';
import { ListItem } from 'app/entities/list-item';
import { MergeListItemDTO } from 'app/common/dto/merge';

import * as _ from 'lodash';

@Injectable({
    providedIn: 'root',
})
export class MergeListItemService {

    constructor(private httpService: HttpService) { }

    public getMergeData() {

    }

    public merge(listId: number, targetId: number, items: ListItem[]): Promise<object> {
        const sourceIds: number[] = items.filter(i => i.id !== targetId).map(i => i.id);
        const mergeData: MergeListItemDTO = { listId, targetId, sourceIds };
        return this.httpService.postAuth('list-items/merge', mergeData);
    }

}
