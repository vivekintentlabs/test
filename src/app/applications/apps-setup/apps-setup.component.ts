import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Utils, Colors } from 'app/common/utils';
import { ApplicationsService } from 'app/applications/applications.service';
import { UserInfo } from 'app/entities/userInfo';
import { InsertField } from 'app/common/interfaces';
import { adminToolbar, basicToolbar, initTinyMCE } from 'app/common/tinymce-helper';
import { MergeAppRequestInfoDTO } from 'app/common/dto/merge-app-request-info';
import * as copy from 'copy-to-clipboard';
declare var $: any;

@Component({
    selector: 'app-apps-setup',
    styleUrls: ['./apps-setup.component.scss'],
    templateUrl: 'apps-setup.component.html'
})

export class AppsSetupComponent implements OnInit, OnDestroy {
    iframeAppCode = '';
    formPermalink = '';
    userInfo: UserInfo = null;
    content = '';
    isTinyMceLoaded = false;
    insertMessageEmail: InsertField[] = [
        { text: 'School Name', value: '&nbsp;< SCHOOL NAME >' },
        { text: 'School Address', value: '&nbsp;< SCHOOL ADDRESS >' }
    ];
    formId: string;

    constructor(
        public appsService: ApplicationsService,
        private zone: NgZone,
        private route: ActivatedRoute,
    ) { }

    ngOnInit() {
        this.formId = this.route.params['value'].formId;
        this.userInfo = Utils.getUserInfoFromToken();
        this.iframeAppCode = Utils.getIframe(2, 4, this.userInfo.schoolUniqId, this.formId);
        this.formPermalink = `${Utils.getBaseUrl()}/request-application/${this.userInfo.schoolUniqId}/${this.formId}`;
        return this.appsService.getAppRequestIntroduction(this.userInfo.schoolUniqId, this.formId)
            .then((appRequestInfo: MergeAppRequestInfoDTO) => {
                if (appRequestInfo?.introductionText) { $('#emailTemplateMessage').append(appRequestInfo.introductionText); }
                setTimeout(() => {
                    this.initTinyMCE();
                }, 0);
                return appRequestInfo;
            });
    }

    copyApplicationCode() {
        copy(this.iframeAppCode);
        Utils.showNotification('Application code is copied to clipboard.', Colors.success);
    }

    copyFormPermalink() {
        copy(this.formPermalink);
        Utils.showNotification('Form Permalink is copied to clipboard.', Colors.success);
    }

    private initTinyMCE() {
        const toolbar = this.userInfo.isSchoolAdminOrHigher() ? adminToolbar : basicToolbar;
        const config = {
            selector: '#emailTemplateMessage',
            toolbar,
            setup: (editor) => {
                editor.on('init', () => {
                    this.content = editor.getContent();
                });
                const self = this;
                editor.addButton('insertFields', {
                    type: 'listbox',
                    text: '<Insert Fields>',
                    icon: false,
                    onselect(e) {
                        editor.insertContent(this.value());
                    },
                    values: self.insertMessageEmail
                });
                editor.on('change keyup input', () => {
                    this.zone.run(() => {
                        this.content = '';
                        this.content = editor.getContent();
                    });
                });
            }
        };
        initTinyMCE(config);
        this.isTinyMceLoaded = true;
    }

    saveAppRequestIntroduction() {
        return this.appsService.saveAppRequestIntroduction(this.formId, this.content)
            .then(() => {
                Utils.showNotification('Saved app request introduction', Colors.info);
            });
    }

    ngOnDestroy() {
        Utils.destroyTinyMCE('#emailTemplateMessage');
    }
}
