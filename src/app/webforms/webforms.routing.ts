
import { Routes } from '@angular/router';

import { ProspectusRequestComponent } from './prospectus-request/prospectus-request.component';
import { EventRegistrationComponent } from './event-registration/event-registration.component';
import { GeneralFormComponent } from './general/general.component';

export const WebformsRoutes: Routes = [{
    path: '',
    children: [
        {
            path: 'prospectus-request/:id',
            component: ProspectusRequestComponent
        },
        {
            path: 'event-registration/:id',
            component: EventRegistrationComponent
        },
        {
            path: 'general/:id',
            component: GeneralFormComponent
        },
        {
            path: 'prospectus-request',
            component: ProspectusRequestComponent
        },
        {
            path: 'event-registration',
            component: EventRegistrationComponent
        },
        {
            path: 'general',
            component: GeneralFormComponent
        }
    ]
}];
