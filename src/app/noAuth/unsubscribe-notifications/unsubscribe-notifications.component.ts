import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from 'app/services/http.service';

import Swal from 'sweetalert2';

declare var $: any;

@Component({
    selector: 'unsubscribe-notifications',
    templateUrl: './unsubscribe-notifications.component.html'
})
export class UnsubscribeNotificationsComponent implements OnInit {

    constructor(private httpService: HttpService, private router: Router) { }

    checkFullPageBackgroundImage() {
        const $page = $('.full-page');
        const imageSrc = $page.data('image');

        if (imageSrc !== undefined) {
            const imageContainer = '<div class="full-page-background" style="background-image: url(' + imageSrc + ') "/>';
            $page.append(imageContainer);
        }
    }

    ngOnInit() {
        this.checkFullPageBackgroundImage();
        const unsubscribeCode = this.router.parseUrl(this.router.url).queryParams['unsubscribe_code'];
        if (unsubscribeCode !== undefined) {
            this.httpService.post('login-aditional/unsubscribe-notifications', { unsubscribeCode }).then(() => {
                Swal.fire({
                    title: 'You have been successfully unsubscribed from notifications.',
                    text: 'You can turn this back on at any time in your profile settings.',
                    type: 'success',
                    showCancelButton: false,
                    confirmButtonClass: 'btn btn-success',
                    confirmButtonText: 'OK',
                    buttonsStyling: false
                }).then((result) => {
                    if (result && result.value) {
                        this.router.navigate(['/noAuth/login']);
                    }
                });
            }).catch((error) => {
                console.log(error);
                this.router.navigate(['/noAuth/login']);
            });
        } else {
            this.router.navigate(['/noAuth/login']);
        }
    }
}
