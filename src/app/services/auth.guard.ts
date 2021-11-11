import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Utils } from '../common/utils';
import { HttpService } from './http.service';

@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {

    constructor(private router: Router, private httpService: HttpService, public jwtHelper: JwtHelperService) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const url: string = state.url;
        const expired: boolean = this.jwtHelper.isTokenExpired(localStorage.getItem('token'));
        if (!expired) {
            const userInfo = Utils.getUserInfoFromToken();
            if (url === '/') {
                // log out contacts and school representative if they visit the main page
                const notAllowedRole = userInfo?.isSchoolContact() || userInfo?.isSchoolRepresentative();
                if (notAllowedRole) {
                    return this.logOut();
                }
                this.router.navigate(['dashboard']);
            }
            if (route.data.roles && !route.data.roles.includes(userInfo.role)) {
                return false;
            }
            return true;
        }
        return this.logOut();
    }

    private logOut() {
        this.httpService.updateCurrentSchoolId(null);
        Utils.logout(this.router);
        return false;
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        return this.canActivate(route, state);
    }

}
