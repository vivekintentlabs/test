import { Injectable } from '@angular/core';
import { EntityStore, StoreConfig } from '@datorama/akita';
import { ChartEntity } from './chart.entity';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'chart' })
export class ChartStore extends EntityStore<ChartEntity> {
    constructor() {
        super();
    }
}