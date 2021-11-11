import { Injectable } from '@angular/core';
import { Keys } from 'app/common/keys';
import { Student } from 'app/entities/student';
import { YearLevel } from 'app/entities/year-level';

import { DemographicChartWrapperService } from './demographic-chart-wrapper-service';

@Injectable()
export class InternationalChartWrapperService extends DemographicChartWrapperService {
    public chartName = 'International Students';
    public chartStoreKey = Keys.isInternational;
}
