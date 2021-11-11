import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ChartEntity } from './chart.entity';
import { ChartStore } from './chart.store';

@Injectable({ providedIn: 'root' })
export class ChartQuery extends QueryEntity<ChartEntity> {
    chart$ = this.select(state => state);

    constructor(protected store: ChartStore) {
        super(store);
    }

    get(id: string): ChartEntity {
        return this.getEntity(id);
    }

    getChartRawDataObservable(id: string) {
        return this.selectEntity(id, 'chartRawData');
    }

    getAggregateObservable(id: string) {
        return this.selectEntity(id, 'isAggregated');
    }

    getFilterObservable(id: string) {
        return this.selectEntity(id, 'filter');
    }

    getPlotObservable(id: string) {
        return this.selectEntity(id, 'hasPlotTotal');
    }

    getLegendObservable(id: string) {
        return this.selectEntity(id, 'hasLegend');
    }

    getChartTypeObservable(id: string) {
        return this.selectEntity(id, 'chartType');
    }
}
