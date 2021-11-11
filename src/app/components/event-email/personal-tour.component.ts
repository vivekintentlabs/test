import { Component, ChangeDetectorRef } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { HttpService } from '../../services/http.service';
import { EmailComponent } from './email';

import { EventEmail } from '../../entities/event-email';
import { Constants } from '../../common/constants';

import * as _ from 'lodash';

@Component({
    selector: 'app-personal-tour-event-email',
    templateUrl: 'event-email.component.html',
    styleUrls: ['./event-email.component.scss']
})
export class PersonalTourEmailComponent extends EmailComponent {

    constructor(httpService: HttpService, ref: ChangeDetectorRef, modalService: NgbModal, platformLocation: PlatformLocation) {
        super(httpService, ref, modalService, platformLocation);
        this.type = EventEmail.TYPE_EMAIL_PERSONAL_TOUR;
        this.titleEmail = this.eventTypeName = 'Personal Tour';
        this.insertSubjectEmail = Constants.insertSubjectPersonalTourEmail;
        this.insertMessageEmail = Constants.insertMessagePersonalTourEmail;
    }

    protected doGetData(): Promise<any> {
        return this.httpService.postAuth('event-email/personal-tour', { personalTourId: this.id });
    }

    protected doSendTestEmail(email: string): Promise<any> {
        return this.httpService.postAuth('event-email/send-test-personal-tour-email', { id: this.email.id, email });
    }
}
