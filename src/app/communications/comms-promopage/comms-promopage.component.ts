import { Component } from '@angular/core';
import { CommunicationService } from 'app/communications/communications.service';
import { environment } from 'environments/environment';

@Component({
    selector: 'comms-promopage',
    templateUrl: './comms-promopage.component.html',
    styleUrls: ['./comms-promopage.component.scss']
})
export class CommsPromopageComponent {
    public brand = environment.brand;

    constructor(public commService: CommunicationService) {
        commService.checkModule();
    }
}
