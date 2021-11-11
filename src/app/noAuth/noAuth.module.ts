import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { EqualValidator } from './equal-validator.directive';
import { NoAuthRoutes } from './noAuth.routing';
import { MaterialModule } from '../app.module';
import { EventsModule } from '../events/events.module';
import { FooterModule } from 'app/shared/footer/footer.module';

import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { GoogleLoginComponent } from './google-login/google-login.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { SocialLoginComponent } from './social-login/social-login.component';
import { UnsubscribeNotificationsComponent } from './unsubscribe-notifications/unsubscribe-notifications.component';
import { UnsubscribeComponent } from './unsubscribe/unsubscribe.component';
import { MaintenanceModule } from 'app/shared/maintenance/maintenance.module';
import { CoolSocialLoginButtonsModule } from '@angular-cool/social-login-buttons';


@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(NoAuthRoutes),
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    EventsModule,
    MaintenanceModule,
    FooterModule,
    CoolSocialLoginButtonsModule,
    TranslateModule
  ],
  declarations: [
    LoginComponent,
    GoogleLoginComponent,
    RegisterComponent,
    ChangePasswordComponent,
    ForgotPasswordComponent,
    SocialLoginComponent,
    EqualValidator,
    UnsubscribeNotificationsComponent,
    UnsubscribeComponent,
  ]
})

export class NoAuthModule {}
