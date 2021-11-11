import { Injectable } from "@angular/core";
import { Router } from "@angular/router";

import { HttpService } from "../services/http.service";

import { Utils, Colors } from "../common/utils";
import { TranslateService } from "@ngx-translate/core";

@Injectable()
export class LoginService {

    constructor(
        private httpService: HttpService,
        private router: Router,
        private translate: TranslateService
    ) {
        this.translate.use('en-US');
    }

    login(url: string, params: Object, msg: string = ''): Promise<void> {
        return this.httpService.post(url, params).then((login) => {
            if (login) {
                const userInfo = Utils.getUserInfoFromToken();
                if (userInfo.isSchoolRepresentative()) {
                    this.router.navigate(['events/list']);
                } else {
                    if (msg) {
                        Utils.showNotification(msg, Colors.success);
                    }
                    this.router.navigate(['dashboard']);
                }
            } else {
                this.router.navigate(['/noAuth/login']);
            }
        }).catch(() => {
            this.router.navigate(['/noAuth/login']);
        });
    }
 
}
