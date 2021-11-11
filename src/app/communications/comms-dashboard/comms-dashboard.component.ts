import { Component } from '@angular/core';
import { CommunicationService } from 'app/communications/communications.service';

@Component({
    selector: 'comms-dashboard',
    templateUrl: './comms-dashboard.component.html',
    styleUrls: ['./comms-dashboard.component.scss']
})
export class CommsDashboardComponent {
    constructor(public commService: CommunicationService) {
        commService.checkModule();
    }
}
