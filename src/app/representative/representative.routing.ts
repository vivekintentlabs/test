
import { Routes } from '@angular/router';
import { Role } from '../common/enums';

import { RepresentativeEditEventComponent } from './edit-event-representative/edit-event-representative.component';


export const RepresentativeRoutes: Routes = [{
    path: '',
    children: [
        {
            path: 'edit-event',
            component: RepresentativeEditEventComponent,
            data: {
                roles: [Role.SchoolRepresentative]
            }
        }
    ]
}];
