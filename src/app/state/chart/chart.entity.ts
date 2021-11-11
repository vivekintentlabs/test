import { EntityState } from "@datorama/akita";
import { ChartTypeMenuItem, IWidgetParams } from "app/common/interfaces";
import { PieChartColData } from "app/entities/local/pie-chart-col-data";

export interface ChartEntity extends EntityState<ChartEntity, string> {
    id: string;
    isAggregated?: boolean;
    chartRawData?: PieChartColData;
    hasPlotTotal?: boolean;
    chartType?: ChartTypeMenuItem;
    filter?: Pick<IWidgetParams, "students" | "yearLevels">;
    hasLegend?: boolean;
}