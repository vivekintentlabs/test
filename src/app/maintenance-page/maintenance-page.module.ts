import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { MaintenancePageComponent } from './maintenance-page.component';


@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        RouterModule.forRoot([{
            path: 'maintenance-page',
            component: MaintenancePageComponent
        }]),
    ],
    exports: [RouterModule],
    declarations: [
        MaintenancePageComponent,
    ],
    providers: [],
    bootstrap: [MaintenancePageComponent]
})
export class MaintenancePageModule { }
