import { Injectable } from '@angular/core';
import { Keys } from 'app/common/keys';

import { DemographicChartWrapperService } from './demographic-chart-wrapper-service';

@Injectable()
export class CountryOfOriginChartWrapperService extends DemographicChartWrapperService {
    public chartName = 'Country of Origin for International Students';
    public chartStoreKey = Keys.countryOfOrigin;
}
