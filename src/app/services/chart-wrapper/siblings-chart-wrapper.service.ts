import { Injectable } from '@angular/core';
import { Keys } from 'app/common/keys';

import { DemographicChartWrapperService } from './demographic-chart-wrapper-service';

@Injectable()
export class SiblingsChartWrapperService extends DemographicChartWrapperService {
    public chartName = 'Siblings';
    public chartStoreKey = Keys.siblings;
}
