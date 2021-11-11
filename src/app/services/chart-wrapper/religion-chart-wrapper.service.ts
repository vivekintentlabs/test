import { Injectable } from '@angular/core';
import { Keys } from 'app/common/keys';

import { DemographicChartWrapperService } from './demographic-chart-wrapper-service';

@Injectable()
export class ReligionChartWrapperService extends DemographicChartWrapperService {
    public chartName = 'Religion';
    public chartStoreKey = Keys.religion;
}
