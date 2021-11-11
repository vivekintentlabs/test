import { Routes } from '@angular/router';
import { AppsPromopageComponent } from './apps-promopage/apps-promopage.component';
import { AppsRequestFormComponent } from './apps-request-form/apps-request-form.component';
import { AppsFormComponent } from './apps-form/apps-form.component';
import { AppsReadonlyFormComponent } from './apps-readonly-form/apps-readonly-form.component';
import { SubmitSucceededComponent } from './submit-succeeded/submit-succeeded.component';
import { FormEditorComponent } from './apps-edit-form/form-editor.component';
import { AppsListFormsComponent } from './apps-list-forms/apps-list-forms.component';
import { AppsListItemsComponent } from './apps-list-items/apps-list-items.component';
import { AppsEditFillableFormComponent } from './apps-edit-fillableform/apps-edit-fillableform.component';
import { AppsPreviewFillableFormComponent } from './apps-preview-fillableform/apps-preview-fillableform.component';
import { AppsSetupComponent } from './apps-setup/apps-setup.component';
import { AppsListComponent } from './apps-list/apps-list.component';
import { AppGuard } from './app.guard';

import { CanDeactivateGuard } from '../services/can-deactivate-guard.service';

import { Role } from '../common/enums';

export const ApplicationsRoutes: Routes = [
    {
        path: '',
        children: [ {
            path: 'promo',
            component: AppsPromopageComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'edit-form/:formId',
            component: FormEditorComponent,
            canActivate: [AppGuard],
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'request-application/:schoolUniqId/:formId',
            component: AppsRequestFormComponent
        }]
    },
    {
        path: '',
        children: [ {
            path: 'index',
            component: AppsListComponent,
            canActivate: [AppGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: ':formId/fillable-forms/update/:id',
            component: AppsEditFillableFormComponent,
            canActivate: [AppGuard],
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: ':formId/fillable-forms/:id/preview',
            component: AppsPreviewFillableFormComponent,
            canActivate: [AppGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'forms',
            component: AppsListFormsComponent,
            canActivate: [AppGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'school-lists-application',
            component: AppsListItemsComponent,
            canActivate: [AppGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: ':formId/setup',
            component: AppsSetupComponent,
            canActivate: [AppGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'application/:formId/:id',
            component: AppsFormComponent
        }]
    },
    {
        path: '',
        children: [ {
            path: ':formId/fillable-forms/:id',
            component: AppsReadonlyFormComponent
        }]
    },
    {
        path: '',
        children: [ {
            path: 'submit-succeeded',
            component: SubmitSucceededComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    }
];
