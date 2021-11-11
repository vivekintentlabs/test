import { Routes } from '@angular/router';
import { Role } from '../common/enums';

import { CanDeactivateGuard } from '../services/can-deactivate-guard.service';

import { EventsComponent } from './events/events.component';
import { EditEventComponent } from './edit-event/edit-event.component';
import { EditBookingModalComponent } from './edit-booking-modal/edit-booking-modal.component';
import { PersonalToursComponent } from './personal-tours/personal-tours.component';
import { EditPersonalTourComponent } from './edit-personal-tour/edit-personal-tour.component';

export const EventsRoutes: Routes = [
    {
        path: '',
        children: [ {
            path: 'list',
            component: EventsComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'personal-tour',
            component: PersonalToursComponent
        }]
    },
    {
        path: '',
        children: [ {
            path: 'add-event',
            component: EditEventComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'duplicate',
            component: EditEventComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'edit-event',
            component: EditEventComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'add-personal-tour',
            component: EditPersonalTourComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'edit-personal-tour',
            component: EditPersonalTourComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'duplicate-personal-tour',
            component: EditPersonalTourComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    }
];
