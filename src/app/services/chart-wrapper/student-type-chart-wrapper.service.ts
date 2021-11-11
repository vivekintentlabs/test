import { Injectable } from '@angular/core';
import { Keys } from 'app/common/keys';

import { DemographicChartWrapperService } from './demographic-chart-wrapper-service';

@Injectable()
export class StudentTypeChartWrapperService extends DemographicChartWrapperService {
    public chartName = 'Student Type';
    public chartStoreKey = Keys.boardingType;
}
