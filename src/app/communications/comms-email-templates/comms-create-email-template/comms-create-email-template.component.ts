import { Component, OnDestroy, NgZone, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';

import { HttpService } from 'app/services/http.service';
import { CommunicationService } from 'app/communications/communications.service';
import { CommsTemplateService } from 'app/communications/comms-template.service';

import { Utils, Colors } from 'app/common/utils';
import { PageLeaveReason, ModalAction } from 'app/common/enums';
import { Constants } from 'app/common/constants';
import { adminToolbar, basicToolbar, initTinyMCE, skinUrl, TinyMceConfig } from 'app/common/tinymce-helper';

import { User } from 'app/entities/user';
import { EmailTemplate } from 'app/entities/email-template';

import { SendTestEmailComponent } from 'app/components/send-test-email/send-test-email.component';

import * as _ from 'lodash';
import * as tinymce from 'tinymce';

declare var $: any;

@Component({
    selector: 'comms-create-email-template',
    templateUrl: './comms-create-email-template.component.html',
    styleUrls: ['./comms-create-email-template.component.scss']
})

export class CommsCreateEmailTemplateComponent implements OnDestroy {
    public noItemSelected = Constants.noItemSelected; // show constant string in html
    emailForm: FormGroup = null;
    title: string = '';
    previewModal = { subject: '', from: '', message: '' };
    dropDownValues = [];
    isTinyMceLoaded: boolean = false;
    isTinyMceActive: boolean = false;
    schoolLogo: string = null;
    templateRawHtml: string = null;
    readonly DEFAULT_MSG_STATUS: string = 'draft';
    readonly EDITOR_ID: string = 'et-tinymce-editor';
    schoolUsers: Array<User> = [];
    isLocalTemplate: boolean = false;
    private changed = 0;
    private submitted = false;
    private sub: Subscription;
    schoolId: number = null;
    mergeTagNames: Array<string> = Constants.mergeTagNames;
    readonly SUBJECT_MAX_LENGTH = Constants.requiredEmailSubjectMaxLength;
    readonly toolbarSideBtns = '<div class="mce-toolbar-btns"><button mat-raised-button type="button" #tooltip="matTooltip1" class="d-block save-template-btn bg-secondary rounded-circle btn btn-light p-2" (click)="saveTemplate($event)"><i class="material-icons">save</i><span class="tooltiptext">Save as default</span></button><button mat-raised-button type="button" class="d-block reload-template-btn bg-secondary rounded-circle btn btn-light p-2" (click)="reloadTemplate($event)"><i class="material-icons">refresh</i><span class="tooltiptext">Reload default</span></button></div>';
    readonly CUSTOM_MCE_TOOLBAR_ID = 'customMceToolbar';
    commsEmailTemplate: EmailTemplate;

    constructor(
        public commService: CommunicationService,
        private commsTemplateService: CommsTemplateService,
        private httpService: HttpService,
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private zone: NgZone,
        private modalService: NgbModal,
        private platformLocation: PlatformLocation,
    ) { }

    /**
     * Inits component data, a native callback method
     * @return {void}
     */
    ngOnInit() {
        this.commService.checkModule(false).then((isLoaded: boolean) => {
            if (isLoaded) {
                if (this.router.url.indexOf('create') !== -1) {
                    this.title = 'Add Email Template';
                    this.buildForm(new EmailTemplate());
                } else {
                    this.title = 'Edit Email Template';
                    const id = this.route.params['value'].id;

                    this.httpService.getAuth('email-template/' + id).then((commsEmailTemplate: EmailTemplate) => {
                        this.buildForm(commsEmailTemplate);
                    }).catch(err => console.log(err));
                }
            }
        });
    }

    /**
     * Builds form
     * @param {EmailTemplate} emailTemplate - comms message object
     * @return {void}
     */
    private buildForm(emailTemplate: EmailTemplate) {
        this.schoolId = emailTemplate.schoolId || this.commService.userInfo.schoolId;
        this.emailForm = this.fb.group({
            id: emailTemplate.id,
            subject: [emailTemplate.subject, Validators.compose([Validators.required, Validators.maxLength(this.SUBJECT_MAX_LENGTH)])],
            message: [emailTemplate.message, Validators.maxLength(Constants.textFieldMaxLength)],
            schoolId: this.schoolId,
            activated: emailTemplate.activated || 1,
            type: EmailTemplate.TYPE_EMAIL_COMMS_MODULE
        });

        return this.commsTemplateService.getMailchimpTemplateWidth().then((templateWidth) => {
            $(`#${this.EDITOR_ID}`).html(emailTemplate.message).closest('.editor-block').css('width', templateWidth);
            this.setInsertFieldValues();
            this.onChanges();
            return Promise.resolve();
        });
    }

    /**
     * Creates insert fields for tinymce insertfield button
     * @return {void}
     */
    private setInsertFieldValues() {
        _.forEach(this.mergeTagNames, mergeTagName => {
            const mergeTag = `<input id="${(mergeTagName.replace(/\s/g, "")).toLowerCase()}" type="button" class="mce-merge-tags" value="${mergeTagName}" disabled="disabled" />`;
            this.dropDownValues.push({ text: mergeTagName, value: mergeTag });
        });
        this.initTinyMCE();
    }

    /**
     * An active editor is valid if it has content (text or image)
     * @return {boolean}
     */
    private hasValidContent() {
        const editor = tinymce.activeEditor;
        if ($.trim(editor.getContent({ format: 'text' })).length || !!$('<div />').html(editor.getContent()).find('img').length) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Inits tinymce editor
     * @return {void}
     */
    private initTinyMCE() {
        const self = this;
        const toolbar = this.commService.userInfo.isSchoolAdminOrHigher() ? adminToolbar : basicToolbar;
        const config: Partial<TinyMceConfig> = {
            skin_url: skinUrl.inlineEditor,
            selector: `#${this.EDITOR_ID}`,
            height: '',
            statusbar: false,
            branding: false,
            inline: true,
            fixed_toolbar_container: `#${this.CUSTOM_MCE_TOOLBAR_ID}`,
            toolbar,
            setup: (editor) => {
                editor.on('init', () => {
                    const $window = $(window);
                    const $customMceToolbar = $(`#${this.CUSTOM_MCE_TOOLBAR_ID}`);
                    const offsetTop = $customMceToolbar.offset().top;
                    $window.scroll(function () {
                        $customMceToolbar.toggleClass('fixed', $window.scrollTop() > offsetTop);
                    });
                    this.isTinyMceLoaded = true;
                    this.emailForm.controls.message.setValue(editor.getContent());
                });
                editor.addButton('insertFields', {
                    type: 'listbox',
                    text: '<Insert Fields>',
                    icon: false,
                    onselect: function (e) {
                        let insertContent = this.value();
                        if (this.text() === 'Email Signature') {
                            insertContent = self.commsTemplateService.getSignatureHtml();
                        }
                        editor.insertContent(insertContent);
                    },
                    values: self.dropDownValues
                });
                editor.on('change keyup input', () => {
                    if (this.hasValidContent()) {
                        this.emailForm.controls.message.setValue(editor.getContent());
                        this.zone.run(() => {
                            this.changed += 1;
                            this.emailForm.controls.message.markAsDirty();
                        });
                    } else {
                        this.emailForm.controls.message.setErrors({ 'incorrect': true });
                    }
                });
            }
        }
        initTinyMCE(config);

        $(document).on('focusin', function (e) {
            if (event && $(event.target).closest('.mce-window').length) {
                e.stopImmediatePropagation();
            }
        });
    }

    /**
     * Form do submit handler
     * @return {Promise<boolean>}
     */
    private doSubmit(): Promise<boolean> {
        if (this.changed > 0 && !this.submitted) {
            return this.submit().then(() => {
                return Promise.resolve(true);
            }).catch(err => {
                console.log(err);
                this.submitted = false;
                throw err;
            });
        } else {
            return Promise.resolve(true);
        }
    }

    /**
     * Form submit handler
     * @param {boolean} doExit - redirects page to messages listing if true
     * @return {Promise<boolean>}
     */
    onSubmit(doExit: boolean = false): Promise<boolean> {
        return this.submit().then(() => {
            if (doExit) {
                this.onCancel();
            }
            this.submitted = false;
            Utils.showNotification('Saved successfully!', Colors.success);
            return true;
        }).catch((err) => {
            console.log(err);
            this.submitted = false;
            throw err;
        });
    }

    /**
     * Form submit handler
     * @return {Promise<object>}
     */
    private submit(): Promise<object> {
        if (this.emailForm.value && !this.submitted) {
            this.submitted = true;
            if (this.emailForm.value.id) {
                return this.httpService.putAuth(`email-template/${this.emailForm.value.id}`, this.emailForm.value);
            } else {
                return this.httpService.postAuth('email-template/', this.emailForm.value).then((res: any) => {
                    if (res && res.id) {
                        this.emailForm.controls.id.setValue(res.id);
                    }
                    return res;
                });
            }
        } else {
            return Promise.reject();
        }
    }

    /**
     * Destroys tinymce instance, a native callback invoked immediately after a directive, pipe, or service instance is destroyed.
     * @return {void}
     */
    ngOnDestroy() {
        Utils.destroyTinyMCE('#emailMessage');
        if (this.sub) {
            this.sub.unsubscribe();
        };
    }

    /**
     * Redirects to messages listing
     * @return {void}
     */
    onCancel() {
        this.router.navigate(['admin/emails']);
    }

    /**
     * Fires when a form value(s) changes
     * @return {void}
     */
    private onChanges(): void {
        this.sub = this.emailForm.valueChanges.subscribe(val => {
            this.changed += 1;
        });
    }

    /**
     * Detects if a route can be deactivated
     * @return {Promise<boolean>}
     */
    canDeactivate(): Promise<boolean> {
        return Utils.canDeactivate(this.changed, this.submitted, this.emailForm == null || this.emailForm.valid).then((can) => {
            if (can === PageLeaveReason.save) {
                return this.doSubmit().catch(() => {
                    return false;
                });
            } else if (can === PageLeaveReason.goBack) {
                return false;
            } else if (can === PageLeaveReason.doNotSave) {
                return true;
            }
        });
    }

    /**
     * Shows send email dialog
     * @return {Promise<boolean>}
     */
    showSendTestEmail(): Promise<boolean> {
        if (!this.emailForm.pristine) {
            return this.submit().then(() => {
                this.sendTestEmail();
                return Promise.resolve(true);
            }).catch((err) => {
                console.log(err);
                throw err;
            });
        } else {
            this.sendTestEmail();
            return Promise.resolve(true);
        }
    }

    sendTestEmail() {
        const modalSendTestEmailRef = this.modalService.open(SendTestEmailComponent, Constants.ngbModalLg);
        modalSendTestEmailRef.result.then((result: { action: ModalAction, email: string }) => {
            switch (result.action) {
                case ModalAction.Done:
                    return this.httpService.postAuth(
                        'email-template/send-test-email',
                        { id: this.emailForm.controls.id.value, email: result.email }
                    ).then(() => {
                        Utils.showNotification('Test Email successfully sent.', Colors.success);
                    }).catch(err => console.log(err));
                default:
                    break;
            }
        }).catch((err) => modalSendTestEmailRef.dismiss(err));
        this.platformLocation.onPopState(() => {
            modalSendTestEmailRef.close({ action: ModalAction.LeavePage });
        });
    }

}
