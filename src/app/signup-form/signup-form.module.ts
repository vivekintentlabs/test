import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../app.module';
import { ComponentsModule } from '../components/components.module';

import { SignupFormRoutes } from './signup-form.routing';
import { SignupFormsComponent } from './signup-forms/signup-forms.component';
import { EditSignupFormComponent } from './edit-signup-form/edit-signup-form.component';


@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(SignupFormRoutes),
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        ComponentsModule,
    ],
    declarations: [
        SignupFormsComponent,
        EditSignupFormComponent
    ],
})

export class SignupFormModule { }
