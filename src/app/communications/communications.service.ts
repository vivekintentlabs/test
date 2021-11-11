import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { HttpService } from 'app/services/http.service';

import { Constants } from 'app/common/constants';
import { Utils } from 'app/common/utils';
import { Keys } from 'app/common/keys';

import { School } from 'app/entities/school';
import { Campus } from 'app/entities/campus';
import { UserInfo } from 'app/entities/userInfo';
import { CommsMessage } from 'app/entities/comms-message';
import { User } from 'app/entities/user';

import * as _ from 'lodash';

@Injectable({
    providedIn: 'root',
})
export class CommunicationService {
    readonly BASE_URL: string       = 'communications';
    readonly ACTIVITY_LIST_ITEM_NAME: string = 'Email Communications';
    readonly PROMOPAGE_LINK: string = '/' + this.BASE_URL + '/promo';
    readonly HOME_LINK: string      = '/' + this.BASE_URL + '/email';
    userInfo: UserInfo              = null;
    currentUser: User               = null;
    mainCampus: Campus              = null;
    isModuleActive: boolean         = false;
    school: School;
    schoolLogo: string;
    userSignature: User = null;

    constructor(private httpService: HttpService, private router: Router) {}

    /**
     * Checks school modules and check if comms module is enabled or not, only for system admins
     * @param {boolean} doRedirect - page redirect, default true
     * @return {Promise<boolean>}
     */
    public checkModule(doRedirect: boolean = true): Promise<boolean> {
        this.isModuleActive = false;
        this.userInfo = Utils.getUserInfoFromToken();
        if (this.userInfo.isSchoolEditorOrHigher()) {
            return this.httpService.getAuth(this.BASE_URL + '/school/' + this.userInfo.schoolId + '/with-campus/' + this.userInfo.mainCampusId).then((data: Object) => {
                this.school        = data[Keys.school];
                this.mainCampus    = data[Keys.campus];
                this.schoolLogo    = data[Keys.schoolLogo];
                this.userSignature = data[Keys.emailSignature][Keys.emailSignature]['user'];

                this.isModuleActive = Utils.isSchoolModuleEnabled(this.school.modules, Constants.schoolModules.commsModule.name);

                if (!this.isModuleActive && doRedirect) {  // inactive module
                    this.router.navigate([this.PROMOPAGE_LINK]);
                } else {  // active module
                    if (this.router.url == this.PROMOPAGE_LINK && doRedirect) {  // accessing promo page while active module
                        this.router.navigate([this.HOME_LINK]);
                    }

                    // get logged in user
                    this.httpService.getAuth('users/get-current').then((user: User) => {
                        this.currentUser = user;
                    }).catch(error => { throw error });
                }
                return this.isModuleActive;
            })
        } else if(doRedirect) {
            this.router.navigate([this.PROMOPAGE_LINK]);
        }
    }

    /**
     * Gets message by id
     * @param {number} id - message id
     * @return {Promise<any>} comms message object or null
     */
    public getMessage(id: number): Promise<any>
    {
        return this.httpService.getAuth(this.BASE_URL + '/message/' + id);
    }

    /**
     * Gets messages
     * @param {string} status - message status
     * @return {Promise<object>} messages array
     */
    public getMessages(status: string): Promise<object>
    {
        return this.httpService.getAuth(this.BASE_URL + '/messages/' + status);
    }

    /**
     * Updates or creates message
     * @param {CommsMessage} data - message data
     * @return {Promise<any>} result operation instance
     */
    public updateMessage(data: CommsMessage): Promise<any>
    {
        return this.httpService.postAuth(this.BASE_URL + '/update', data);
    }

    /**
     * Copies message
     * @param {CommsMessage} commsMessage - message object
     * @return {Promise<object>} result operation instance
     */
    public copyMessage(commsMessage: CommsMessage): Promise<object>
    {
        return this.httpService.postAuth(this.BASE_URL + '/copy-message', commsMessage);
    }

    /**
     * Deletes message
     * @param {number} id - message id
     * @return {Promise<object>} result operation instance
     */
    public deleteMessage(id: number): Promise<object>
    {
        return this.httpService.postAuth(this.BASE_URL + '/delete-message', [id]);
    }

    /**
     * Unschedules message
     * @param {string} campaignId - campaign id
     * @return {Promise<object>}
     */
    public unscheduleMessage(campaignId: string): Promise<object>
    {
        return this.httpService.getAuth(this.BASE_URL + '/unschedule-message/' + campaignId);
    }

    /**
     * Send test email
     * @param {Object} data - email data
     * @return {Promise<object>} messages array
     */
    public sendTestEmail(data: Object): Promise<object>
    {
        return this.httpService.postAuth(this.BASE_URL + '/test-message', data);
    }

    /**
     * Gets campuses
     * @return {Promise<object>} template sections
     */
    public getCampuses(): Promise<object>
    {
        return this.httpService.getAuth(this.BASE_URL + '/campuses/');
    }

    /**
     * Gets campaign reports
     * @param {string} sinceSendTime - since time
     * @param {string} beforeSendTime - before time
     * @return {Promise<object>} template sections
     */
    public getCampaignReports(sinceSendTime: string, beforeSendTime: string): Promise<object>
    {
        return this.httpService.getAuth(this.BASE_URL + '/campaign-reports?sinceSendTime=' + sinceSendTime + '&beforeSendTime=' + beforeSendTime);
    }

    /**
     * Gets campaign report
     * @param {string} campaignId - campaign id
     * @return {Promise<object>} template sections
     */
    public getCampaignReport(campaignId: string): Promise<object>
    {
        return this.httpService.getAuth(this.BASE_URL + '/campaign/' + campaignId);
    }

    /**
     * Gets campaign open details report
     * @param {string} campaignId - campaign id
     * @return {Promise<object>} template sections
     */
    public getCampaignOpenDetailsReport(campaignId: string): Promise<object>
    {
        return this.httpService.getAuth(this.BASE_URL + '/campaign/' + campaignId + '/open-details');
    }

    /**
     * Gets campaign click details report
     * @param {string} campaignId - campaign id
     * @return {Promise<object>} template sections
     */
    public getCampaignClickDetailsReport(campaignId: string): Promise<object>
    {
        return this.httpService.getAuth(this.BASE_URL + '/campaign/' + campaignId + '/click-details');
    }

    /**
     * Gets campaign click member details report
     * @param {string} campaignId - campaign id
     * @param {string} linkId - link id
     * @return {Promise<object>} template sections
     */
    public getCampaignClickMemberDetailsReport(campaignId: string, linkId: string): Promise<object>
    {
        return this.httpService.getAuth(this.BASE_URL + '/campaign/' + campaignId + '/click-details/members/' + linkId);
    }

    /**
     * Gets campaign email activity report
     * @param {string} campaignId - campaign id
     * @return {Promise<object>} template sections
     */
    public getCampaignEmailActivityReport(campaignId: string): Promise<object>
    {
        return this.httpService.getAuth(this.BASE_URL + '/campaign/' + campaignId + '/email-activity');
    }
}
