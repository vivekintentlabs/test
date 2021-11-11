import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { ApplicationsService } from 'app/applications/applications.service';
import { environment } from 'environments/environment';

@Component({
    selector: 'apps-promopage',
    templateUrl: './apps-promopage.component.html',
    styleUrls: ['./apps-promopage.component.scss']
})
export class AppsPromopageComponent {
    public brand = environment.brand;

    constructor(private router: Router, private appsService: ApplicationsService) {
        this.appsService.getAppModuleStatus().then((isActive: boolean) => {
            if (isActive) {
                this.router.navigate(['applications/index']);
            }
        });
    }

}
