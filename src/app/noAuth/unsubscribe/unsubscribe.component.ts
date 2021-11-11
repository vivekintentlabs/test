import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { Subscription } from 'rxjs';
import { Utils } from '../../common/utils';
import { Contact } from '../../entities/contact';


@Component({
    selector: 'app-unsubscribe',
    templateUrl: 'unsubscribe.component.html',
    styleUrls: ['./unsubscribe.component.scss']
})

export class UnsubscribeComponent implements OnInit, OnDestroy { // /unsubscribe;schoolId=1;email=asdf@asdf.as
    date: Date = new Date();
    sub: Subscription;
    contact: Contact = null;
    schoolUniqId: string = null;
    contactUniqId: string = null;
    email: string = null;
    schoolName = '';
    hasSubscribtion = false;

    constructor(private httpService: HttpService, private route: ActivatedRoute) { }

    ngOnInit() {
        const body = document.getElementsByTagName('body')[0];
        body.classList.add('lock-page');
        body.classList.add('off-canvas-sidebar');
        const card = document.getElementsByClassName('card')[0];
        setTimeout(function () {
            // after 1000 ms we add the class animated to the login/register card
            card.classList.remove('card-hidden');
        }, 700);
        this.sub = this.route.params.subscribe(params => {
            this.schoolUniqId = params.schoolId;
            this.contactUniqId = params.contactId;
            this.httpService.post('unsubscribe/get-school-info', {
                contactUniqId: this.contactUniqId, schoolUniqId: this.schoolUniqId
            }).then((data: any) => {
                this.schoolName = data.school.name;
                this.contact = data.contact;
                this.hasSubscribtion = this.contact.receiveUpdateEmail;
                this.email = this.contact.email;
            });
        });
    }

    ngOnDestroy() {
        const body = document.getElementsByTagName('body')[0];
        body.classList.remove('lock-page');
        body.classList.remove('off-canvas-sidebar');
        if (this.sub != null) {
            this.sub.unsubscribe();
        }
    }

    submit() {
        this.httpService.post('unsubscribe/unsubscribe', {
            contactUniqId: this.contactUniqId, schoolUniqId: this.schoolUniqId
        }).then((result: any) => {
            this.hasSubscribtion = false;
            if (result && result.msg) {
                Utils.showSuccessNotification(result.msg);
            }
        });
    }

}
