import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { ApplicationsService } from './applications.service';

@Injectable({
    providedIn: 'root',
})
export class AppGuard implements CanActivate {

    constructor(private router: Router, private appsService: ApplicationsService) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        return this.appsService.getAppModuleStatus().then((isActive: boolean) => {
            if (!isActive) {
                this.router.navigate(['applications/promo']);
            }
            return isActive;
        });
    }

}
