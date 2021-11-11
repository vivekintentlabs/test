import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../app.module';
import { SharedModule } from '../shared.module';
import { RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module } from 'ng-recaptcha';

import { Constants } from 'app/common/constants';

import { WebformsRoutes } from './webforms.routing';
import { ProspectusRequestComponent } from './prospectus-request/prospectus-request.component';
import { EventRegistrationComponent } from './event-registration/event-registration.component';
import { AddStudentComponent } from './add-student/add-student.component';
import { GeneralFormComponent } from './general/general.component';

import { ComponentsModule } from '../components/components.module';
import { MaintenanceModule } from 'app/shared/maintenance/maintenance.module';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(WebformsRoutes),
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        ComponentsModule,
        MaintenanceModule,
        SharedModule,
        TranslateModule,
        RecaptchaV3Module,
    ],
    declarations: [
        ProspectusRequestComponent,
        EventRegistrationComponent,
        AddStudentComponent,
        GeneralFormComponent
    ],
    providers: [
        { provide: RECAPTCHA_V3_SITE_KEY, useValue: Constants.reCaptchaSiteKey },
    ],
})

export class WebformsModule {
}
