import { Injectable } from '@angular/core';
import { Keys } from 'app/common/keys';

import { DemographicChartWrapperService } from './demographic-chart-wrapper-service';

@Injectable()
export class AlumniChartWrapperService extends DemographicChartWrapperService {
    public chartName = 'Alumni';
    public chartStoreKey = Keys.alumni;
}
