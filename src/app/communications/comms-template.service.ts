import { Injectable } from '@angular/core';

import { HttpService } from 'app/services/http.service';
import { CommunicationService } from 'app/communications/communications.service';

import { Utils } from 'app/common/utils';
import { FieldType } from 'app/common/enums';

import { EmailTemplate } from 'app/entities/email-template';
import { User } from 'app/entities/user';
import { CommsMCTextTemplate } from 'app/entities/comms-mc-text-template';
import { CommsMessage } from 'app/entities/comms-message';
import { CustomHttpParams } from 'app/entities/custom-http-params';

import { FilterValue } from 'app/components/filter-constellation/interfaces/filter-value';

import * as _ from 'lodash';
import { environment } from 'environments/environment';

declare var $: any;

@Injectable({
    providedIn: 'root',
})
export class CommsTemplateService {
    public schoolProspectus: EmailTemplate = null;
    public userSignature: User = null;
    schoolLogo: string = null;

    constructor(private httpService: HttpService, private commService: CommunicationService) {}

    /**
     * Gets email templates
     * @param {number} schoolId - school id
     * @return {Promise<object>}
     */
    public getEmailTemplates(): Promise<object> {
        const filterValues: FilterValue[] = [
            { id: 'type', value: EmailTemplate.TYPE_EMAIL_COMMS_MODULE, type: FieldType.Dropdown },
        ];
        const params: CustomHttpParams = new CustomHttpParams().generateFilters(filterValues);
        return this.httpService.getAuth(`email-template?${Utils.toStringEncoded(params)}`);
    }

    /**
     * Deletes email template
     * @param {number} id - template id
     * @return {Promise<object>}
     */
    public deleteEmailTemplate(id: number): Promise<object> {
        return this.httpService.deleteAuth(`email-template/${id}`);
    }

    /**
     * Gets local template
     * @param {number} schoolId - school id
     * @return {Promise<object>}
     */
    public getLocalTemplate(schoolId: number): Promise<object> {
        return this.httpService.getAuth(this.commService.BASE_URL + '/local-template/' + schoolId);
    }

    /**
     * Updates or creates local template
     * @param {CommsMCTextTemplate} data - template data
     * @return {Promise<object>}
     */
    public updateLocalTemplate(data: CommsMCTextTemplate): Promise<object> {
        return this.httpService.postAuth(this.commService.BASE_URL + '/update-local-template', data);
    }

    /**
     * Gets template
     * @param {CommsMessage} commsMessage - message data
     * @param {boolean} skipMergeTagsReplacement - skips merge tag replacement
     * @param {boolean} isTestMessage - if test message
     * @return {Promise<object>}
     */
    public generateTemplate(commsMessage: CommsMessage, skipMergeTagsReplacement = false, isTestMessage = false): Promise<any> {
        return this.httpService.getAuth(this.commService.BASE_URL + '/mailchimp-template')
        .then((html: string) => {
            return this.formatHtml(html, commsMessage, skipMergeTagsReplacement, isTestMessage);
        }).catch((error) => {
            console.log(error);
            throw error;
        });
    }

    /**
     * Gets mailchimp template width
     * @return {Promise<object>}
     */
    public getMailchimpTemplateWidth(): Promise<any> {
        return this.httpService.getAuth(this.commService.BASE_URL + '/mailchimp-template')
        .then((html: string) => {
            $('body').append('<div id="temp-html" style="display:none">' + html + '</div>');
            const $rawHtml = $('#temp-html');
            const templateWidth = $rawHtml.find('.templateContainer').outerWidth();
            $rawHtml.remove();
            return templateWidth;
        }).catch((error) => {
            console.log(error);
            throw error;
        });
    }

    /**
     * Gets formatted template html
     * @param {string} mailchimpHtml - mailchimp html
     * @param {CommsMessage} commsMessage - commsMessage data
     * @param {boolean} skipMergeTagsReplacement - skips merge tag replacement
     * @param {boolean} isTestMessage - if test message
     * @return {string} formatted string
     */
    private formatHtml(mailchimpHtml: string, commsMessage: CommsMessage, skipMergeTagsReplacement = false, isTestMessage = false): string {
        const rawHtml = Utils.replaceTag(
            mailchimpHtml,
            'COMMS_MODULE_BODY_TAG',
            '<div id="emailMessageBody" class="mce-content-body">' + commsMessage.body + '</div>'
        );

        $('body').append('<div id="temp-html" style="display:none">' + rawHtml + '</div>');
        const $rawHtml = $('#temp-html');

        const templateWidth = $rawHtml.find('.templateContainer').outerWidth();
        const subscribeHtml = '<div id="mc-subscribe-block" style="max-width:' + templateWidth + 'px;color:#606060;font-family:Helvetica,Arial,sans-serif;font-size: 11px;">Sent by ' + environment.brand.name + ' on behalf of ' + this.commService.school.name + '. Our records indicate that <a href="mailto:*|EMAIL|*" target="_blank">*|EMAIL|*</a> requested information from, or filled out a form on the ' + this.commService.school.name + ' website. If you no longer wish to receive notifications you can unsubscribe by following this <a href="*|UNSUB|*">LINK</a> now.</div>';

        $rawHtml.find('.mce-content-body').css('min-height', '200px');
        $rawHtml.find('#canspamBarWrapper').css('margin-top', '60px').parent().find('br').remove();
        $rawHtml.find('#canspamBar').replaceWith(subscribeHtml);

        if (!skipMergeTagsReplacement) {
            $rawHtml.find('#campusname').replaceWith(this.commService.mainCampus.name);
            $rawHtml.find('#schoolname').replaceWith(this.commService.school.name);
            $rawHtml.find('#contactfirstname').replaceWith('*|FNAME|*');
            $rawHtml.find('#contactlastname').replaceWith('*|LNAME|*');
            $rawHtml.find('#contactemailaddress').replaceWith('*|EMAIL|*');
            $rawHtml.find('#contactphonenumber').replaceWith('*|PHONE|*');
            const salutationText = (isTestMessage) ? '&lt;&lt; Test Salutation &gt;&gt;' : '*|SALUTATION|*';
            $rawHtml.find('#contactsalutation').replaceWith(salutationText);
        }
        $rawHtml.remove();
        return $rawHtml.html();
    }

    /**
     * Gets signature in html format
     * @return {string} htmlEmailSignature
     */
    getSignatureHtml() {
        const rawHtml = Utils.replaceEmailSignatureTag('&lt; EMAIL SIGNATURE &gt;', this.commService.userSignature, this.commService.school);
        let htmlEmailSignature: string = '<table style="border: none !important;">';
        if (this.commService.schoolLogo !== '' && this.commService.school.emailSignature.includeLogo) {
            if (this.commService.school.emailSignature.locationLogo === 'Left') {
                htmlEmailSignature += '<tr><td><img style="width:90px; height: auto;" src=' + this.commService.schoolLogo + '></td>';
                htmlEmailSignature += '<td style="padding-left:15px; vertical-align: top;">' + rawHtml + '</td></tr>';
            } else if (this.commService.school.emailSignature.locationLogo === 'Below') {
                htmlEmailSignature += '<tr><td>' + rawHtml + '</td></tr>';
                htmlEmailSignature += '<tr><td><img style="width:90px; height: auto;" src=' + this.commService.schoolLogo + '></td></tr>';
            }
        } else {
            htmlEmailSignature += '<tr><td>' + rawHtml + '</td></tr>';
        }
        htmlEmailSignature += '</table>';
        return htmlEmailSignature;
    }
}