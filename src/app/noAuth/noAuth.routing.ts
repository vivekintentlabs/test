
import { Routes } from '@angular/router';

import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { GoogleLoginComponent } from './google-login/google-login.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { UnsubscribeNotificationsComponent } from './unsubscribe-notifications/unsubscribe-notifications.component';
import { UnsubscribeComponent } from './unsubscribe/unsubscribe.component';

export const NoAuthRoutes: Routes = [{
    path: '',
    children: [
        {
            path: 'login',
            component: LoginComponent
        },
        {
            path: 'google-callback',
            component: GoogleLoginComponent
        },
        {
            path: 'register',
            component: RegisterComponent
        },
        {
            path: 'change-password',
            component: ChangePasswordComponent
        },
        {
            path: 'forgot-password',
            component: ForgotPasswordComponent
        },
        {
            path: 'unsubscribe-notifications',
            component: UnsubscribeNotificationsComponent
        },
        {
            path: 'unsubscribe',
            component: UnsubscribeComponent
        }
    ]
}];
