import { Routes } from '@angular/router';
import { Role } from '../common/enums';

import { SignupFormsComponent } from './signup-forms/signup-forms.component';
import { EditSignupFormComponent } from './edit-signup-form/edit-signup-form.component';
import { CanDeactivateGuard } from '../services/can-deactivate-guard.service';


export const SignupFormRoutes: Routes = [
    {
        path: '',
        children: [{
            path: 'signup-forms',
            component: SignupFormsComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'edit-signup-form',
            component: EditSignupFormComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    }
];
