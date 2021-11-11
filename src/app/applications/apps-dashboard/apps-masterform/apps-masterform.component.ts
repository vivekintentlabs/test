import { Component } from '@angular/core';
import { Utils, Colors } from 'app/common/utils';
import { ApplicationsService } from 'app/applications/applications.service';

import * as _ from 'lodash';
import * as copy from 'copy-to-clipboard';

@Component({
    selector: 'apps-masterform',
    templateUrl: 'apps-masterform.component.html',
    styleUrls: ['apps-masterform.component.scss']
})

export class AppsMasterFormComponent {
    shouldDeleteNestedForms = false;
    contactToken = '';
    promiseForBtn: Promise<any>;

    constructor(public appsService: ApplicationsService) { }

    resetMasterForm() {
        const countryId = 'AUS';
        const formType = 'application';
        return this.promiseForBtn = this.appsService.resetMasterForm(this.shouldDeleteNestedForms, countryId, formType).then((data: any) => {
            Utils.showNotification(`Master form has been reset`, Colors.info);
            return data;
        }).catch(err => console.log(err));
    }

    populateApplicationMapping() {
        return this.promiseForBtn = this.appsService.populateApplicationMapping().then(() => {
            Utils.showNotification(`applications Added To MYSQL`, Colors.info);
        }).catch(err => console.log(err));
    }

    async generateContactToken(contactId: number) {
        this.contactToken = '';
        if (contactId && _.isNumber(contactId) && contactId > 0) {
            this.contactToken = await this.appsService.generateContactToken(contactId).catch(_err => undefined);
        }
    }

    copyContactToken() {
        copy(this.contactToken);
        Utils.showNotification('Contact token is copied to clipboard.', Colors.success);
    }

}
