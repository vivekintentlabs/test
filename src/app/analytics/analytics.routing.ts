import { Routes } from '@angular/router';
import { Role } from '../common/enums';

import { DemographicComponent } from './demographic/demographic.component';
import { AnalyticsEventsComponent } from './events/events.component';
import { EnquiriesComponent } from './enquiries/enquiries.component';
import { GeographicComponent } from './geographic/geographic.component';
import { ResearchComponent } from './research/research.component';
import { AnalyticsSchoolComponent } from './school/school.component';
import { environment } from 'environments/environment';

export const AnalyticsRoutes: Routes = [
    {
        path: '',
        children: [ {
            path: 'demographic',
            component: DemographicComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor, Role.User]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'events',
            component: AnalyticsEventsComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor, Role.User]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: environment.localization.enquiriesUrl,
            component: EnquiriesComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor, Role.User]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'geographic',
            component: GeographicComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor, Role.User]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'research',
            component: ResearchComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor, Role.User]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'school',
            component: AnalyticsSchoolComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor, Role.User]
            }
        }]
    }
];
