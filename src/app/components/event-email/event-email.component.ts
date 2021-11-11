import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { HttpService } from 'app/services/http.service';

import { EmailComponent } from './email';

import { Webform } from 'app/entities/webform';
import { EventEmail } from 'app/entities/event-email';

import { Constants } from 'app/common/constants';
import { FormType } from 'app/common/enums';

import * as _ from 'lodash';

@Component({
    selector: 'app-event-email',
    templateUrl: 'event-email.component.html',
    styleUrls: ['./event-email.component.scss']
})
export class EventEmailComponent extends EmailComponent implements OnInit {

    constructor(httpService: HttpService, ref: ChangeDetectorRef, modalService: NgbModal, platformLocation: PlatformLocation) {
        super(httpService, ref, modalService, platformLocation);
        this.type = EventEmail.TYPE_EMAIL_EVENT;
        this.eventTypeName = 'Event';
        this.insertSubjectEmail = Constants.insertSubjectEventEmail;
        this.insertMessageEmail = Constants.insertMessageEventEmail;
    }

    ngOnInit() {
        return this.httpService.getAuth(`webform/by-type/${FormType.event_registration}?fields=name`).then((webform: Webform) => {
            this.titleEmail = webform.name;
        });
    }

    protected doGetData(): Promise<any> {
        return this.httpService.postAuth('event-email/event', { eventId: this.id });
    }

    protected doSendTestEmail(email: string): Promise<any> {
        return this.httpService.postAuth('event-email/send-test-event-email', { id: this.email.id, email });
    }

}
