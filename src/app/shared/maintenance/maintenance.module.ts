import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaintenanceComponent } from './maintenance.component';

@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        MaintenanceComponent
    ],
    exports: [
        MaintenanceComponent
    ]
})

export class MaintenanceModule { }
