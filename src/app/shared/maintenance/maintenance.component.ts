import { Component, Input } from '@angular/core';
import { T } from 'app/common/t';


@Component({
    selector: 'app-maintenance',
    templateUrl: './maintenance.component.html',
    styleUrls: ['./maintenance.component.scss'],
})
export class MaintenanceComponent {
    @Input() isUnderMaintenance = false;
    @Input() msg = T.underMaintenanceMsgForForms;

    constructor() { }

}
