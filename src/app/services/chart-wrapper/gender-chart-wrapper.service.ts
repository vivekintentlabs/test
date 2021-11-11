import { Injectable } from '@angular/core';
import { Keys } from 'app/common/keys';

import { DemographicChartWrapperService } from './demographic-chart-wrapper-service';

@Injectable()
export class GenderChartWrapperService extends DemographicChartWrapperService {
    public chartName = 'Gender';
    public chartStoreKey = Keys.gender;
}
