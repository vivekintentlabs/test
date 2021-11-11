import { Component } from '@angular/core';

import { HttpService } from 'app/services/http.service';
import { Utils, Colors } from 'app/common/utils';

@Component({
    selector: 'app-social-login',
    templateUrl: './social-login.component.html'
})

export class SocialLoginComponent {

    constructor(private httpService: HttpService) { }

    signInWithGoogle(): void {
        this.getGoogleLoginUrl();
    }

    private getGoogleLoginUrl() {
        this.httpService.get('login-aditional/social-login').then((url) => {
            if (url) {
                location.href = url.toString(); // May be here we can find some other way..
            } else {
                Utils.showNotification('Something went wrong..', Colors.danger);
            }
        }).catch((error) => console.log(error));
    }

}
