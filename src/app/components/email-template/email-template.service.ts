import { Injectable } from '@angular/core'

import { HttpService } from '../../services/http.service';

import { EmailTemplate } from 'app/entities/email-template';
import { Webform } from 'app/entities/webform';
import { CustomHttpParams } from 'app/entities/custom-http-params';

import { Utils, Colors } from 'app/common/utils';
import { FormType, FieldType } from 'app/common/enums';
import { FilterValue } from '../filter-constellation/interfaces/filter-value';

import * as _ from 'lodash'

@Injectable()
export class EmailTemplateService {

    constructor(private httpService: HttpService) {}

    getEmailTemplates(type: string): Promise<EmailTemplate[]> {
        const filterValues: FilterValue[] = [
            { id: 'type', value: type, type: FieldType.Dropdown },
        ];
        const params: CustomHttpParams = new CustomHttpParams().generateFilters(filterValues);
        return this.httpService.getAuth(`email-template?${Utils.toStringEncoded(params)}`).then((emailTemplates: EmailTemplate[]) => {
            return emailTemplates;
        });
    }

    sendTestEmail(id: number, email: string): Promise<void> {
        return this.httpService.postAuth('email-template/send-test-email', { id, email }).then(() => {
            Utils.showNotification('Test Email successfully sent.', Colors.success);
        });
    }

    getWebformName(type: FormType): Promise<string> {
        return this.httpService.getAuth(`webform/by-type/${type}?fields=name`).then((webform: Webform) => {
            return webform.name;
        });
    }

    activate(value: boolean, item: EmailTemplate) {
        item.activated = value;
        return this.httpService.postAuth('email-template/activate', item).then(() => {
            Utils.showSuccessNotification();
        });
    }

    deleteEmailTemplates(ids: number[]): Promise<void> {
        const promises: Array<Promise<Object>> = [];
        ids.forEach(id => {
            promises.push(this.httpService.deleteAuth(`email-template/${id}`));
        });
        return Promise.all(promises).then(_res => undefined);
    }

    deleteEmailTemplate(id: number): Promise<void> {
        return this.deleteEmailTemplates([id]);
    }
}
