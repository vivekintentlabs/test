import { E } from '@angular/cdk/keycodes';
import { Injectable } from '@angular/core';
import { IWidgetParams } from 'app/common/interfaces';
import { Legend } from 'app/entities/local/legend';
import { PieChartColData } from 'app/entities/local/pie-chart-col-data';
import * as _ from 'lodash';
import { ChartEntity } from './chart.entity';
import { ChartQuery } from './chart.query';
import { ChartStore } from './chart.store';

@Injectable({ providedIn: 'root' })
export class ChartService {

    constructor(private chartStore: ChartStore, private chartQuery: ChartQuery) { }

    set(chartEntity: ChartEntity) {
        this.chartStore.add(chartEntity);
    }

    update(id: string, chartEntity: Partial<ChartEntity>) {
        this.chartStore.update(id, chartEntity);
    }

    updateLegend(id: string, legend: Legend) {
        this.chartStore.update(id, entity => {
            const legends = _.cloneDeep(entity.chartRawData.legends);
            _.forEach(legends, (temp: Legend) => {
                if (legend?.name === temp.name) {
                    temp.isSelected = !legend.isSelected;
                }
            });
            return {
                "chartRawData": {
                    ...entity.chartRawData,
                    legends
                }
            }
        });
    }

    updateLegendSection(id: string) {
        this.chartStore.update(id, entity => {
            const legends = _.cloneDeep(entity.chartRawData.legends);
            _.forEach(legends, (temp: Legend) => {
                temp.isSelected = true;
            });
            return {
                "chartRawData": {
                    ...entity.chartRawData,
                    legends
                },
                "hasLegend": ! entity.hasLegend
            }
        });
    }

    addOrUpdate(id: string, chartRawData: PieChartColData, filter: Pick<IWidgetParams, "students" | "yearLevels">) {
        const chartEntityModel = this.chartQuery.get(id);
        if (chartEntityModel) {
            this.update(id, { chartRawData, filter, "hasLegend": !!(chartRawData?.legends?.length) });
        } else {
            this.set({ id, chartRawData, filter, "isAggregated": true, "hasLegend": !!(chartRawData?.legends?.length) });
        }
    }
}
