import { Component, OnDestroy, NgZone, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from 'app/services/http.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Utils, Colors } from 'app/common/utils';
import { PageLeaveReason } from 'app/common/enums';
import { adminToolbar, basicToolbar, initTinyMCE, skinUrl, TinyMceConfig } from 'app/common/tinymce-helper';
import { CommunicationService } from 'app/communications/communications.service';
import { CommsTemplateService } from 'app/communications/comms-template.service';
import { CommsMessage } from 'app/entities/comms-message';
import { CommsMCTextTemplate } from 'app/entities/comms-mc-text-template';
import { Constants } from 'app/common/constants';
import { User } from 'app/entities/user';
import { School } from 'app/entities/school';
import { EmailTemplate } from 'app/entities/email-template';

import * as _ from 'lodash';
import * as tinymce from 'tinymce';

import Swal from 'sweetalert2';

declare var $: any;

@Component({
    selector: 'comms-create-message',
    templateUrl: './comms-create-message.component.html',
    styleUrls: ['./comms-create-message.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class CommsCreateMessageComponent implements OnDestroy {
    public noItemSelected = Constants.noItemSelected; // show constant string in html
    emailForm: FormGroup = null;
    title: string = '';
    previewModal = {subject:'', from: '', message: ''};
    dropDownValues = [];
    isTinyMceLoaded: boolean = false;
    isTinyMceActive: boolean = false;
    schoolLogo: string = null;
    templateRawHtml: string = null;
    readonly DEFAULT_MSG_STATUS: string = 'draft';
    readonly EDITOR_PREFIX: string = 'emailMessage';
    readonly EDITOR_HEADER: string = this.EDITOR_PREFIX + 'Header';
    readonly EDITOR_BODY: string   = this.EDITOR_PREFIX + 'Body';
    readonly EDITOR_FOOTER: string = this.EDITOR_PREFIX + 'Footer';
    editorIds: Array<String> = [this.EDITOR_HEADER, this.EDITOR_BODY, this.EDITOR_FOOTER];
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
    emailTemplates: Array<EmailTemplate> = null;
    selectedEmailTemplate: EmailTemplate = null;

    constructor(public commService: CommunicationService, private commsTemplateService: CommsTemplateService, private httpService: HttpService, private fb: FormBuilder, private router: Router, private route: ActivatedRoute, private zone: NgZone) {}

    /**
     * Inits component data, a native callback method
     * @return {void}
     */
    ngOnInit() {
        this.commService.checkModule().then((isLoaded: boolean) => {
            if(isLoaded) {
                if (this.router.url.indexOf('create') !== -1) {
                    this.title = 'Add Message';
                    this.loadEmailTemplates();
                } else {
                    this.title = 'Edit Message';
                    const id = this.route.params['value'].id;
                    const emailTemplate = new EmailTemplate();
                    this.selectedEmailTemplate = emailTemplate;
                    this.commService.getMessage(id).then((res) => {
                        this.buildForm(res);
                    }).catch(err => console.log(err));
                }
            }
        });
    }

    /**
     * Loads email template
     * @return {Promise<void>}
     */
    private loadEmailTemplates(): Promise<void> {
        return this.commsTemplateService.getEmailTemplates().then((emailTemplates: Array<EmailTemplate>) => {
            const activatedTemplates = _.filter(emailTemplates, template => template.activated);
            this.emailTemplates = _.sortBy(activatedTemplates, [template => template.subject?.toLocaleLowerCase()]);
            if (this.emailTemplates.length < 1) {
                Utils.showNotification('No template found', Colors.danger);
                this.onCancel();
            }
        }).catch(err => console.log(err));
    }

    /**
     * Selects email template
     * @param {EmailTemplate} emailTemplate - email template object
     * @return {Promise<void>}
     */
    public selectEmailTemplate(emailTemplate: EmailTemplate) {
        this.selectedEmailTemplate = emailTemplate;
        this.buildForm(new CommsMessage());
    }

    /**
     * Builds form
     * @param {CommsMessage} commsMessage - comms message object
     * @return {Promise<void>}
     */
    private buildForm(commsMessage: CommsMessage): Promise<void> {
        this.schoolId = commsMessage.schoolId || this.commService.userInfo.schoolId;
        this.emailForm = this.fb.group({
            id:         commsMessage.id,
            subject:    [commsMessage.subject || this.selectedEmailTemplate.subject, Validators.compose([Validators.required, Validators.maxLength(this.SUBJECT_MAX_LENGTH)])],
            body:       [commsMessage.body || this.selectedEmailTemplate.message, Validators.maxLength(Constants.textFieldMaxLength)],
            fromUserId: commsMessage.fromUserId,
            fromUser:   commsMessage.fromUser,
            status:     commsMessage.status,
            schoolId:   this.schoolId,
        });

        return this.httpService.getAuth('users').then((data: { users: Array<User>, school: School}) => {
            this.schoolUsers = data.users;
            const userId = (this.emailForm.controls.fromUserId.value) ? this.emailForm.controls.fromUserId.value : this.commService.userInfo.id;
            let fromUser = _.find(this.schoolUsers, (item: User) => item.id === userId);
            // reset to email signature user if not found
            if(!fromUser && this.commService.userSignature) fromUser = _.find(this.schoolUsers, (item: User) => item.id === this.commService.userSignature.id)

            this.emailForm.controls.fromUser.setValue(fromUser);

            return this.commsTemplateService.generateTemplate(this.emailForm.value, true).then((template) => {
                $('.editor-wrapper').append(template);
                $(`#${this.EDITOR_BODY}`).before(`<div id="${this.CUSTOM_MCE_TOOLBAR_ID}"></div>`);

                this.setInsertFieldValues();
                this.onChanges();

                return Promise.resolve();
            });
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
     * Gets current active editor name
     * @return {boolean}
     */
    private getActiveEditorName(event) {
        const index = $(event.target).closest('div').prev().data('index');
        const editor = tinymce.get(index);
        tinymce.setActive(editor);
        return (tinymce.activeEditor.id).substring(this.EDITOR_PREFIX.length).toLowerCase();
    }

    /**
     * An active editor is valid if it has content (text or image)
     * @return {boolean}
     */
    private hasValidContent() {
        const editor = tinymce.activeEditor;
        if ($.trim(editor.getContent({format: 'text'})).length || !!$('<div />').html(editor.getContent()).find('img').length) {
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
            selector: `#${this.EDITOR_BODY}`,
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
                        this.emailForm.controls.body.setValue(editor.getContent());
                        this.zone.run(() => {
                            this.changed += 1;
                            this.emailForm.markAsDirty();
                        });
                    } else {
                        this.emailForm.controls.body.setErrors({ 'incorrect': true });
                    }
                });
            }
        }
        initTinyMCE(config);

        /*$('.editor-wrapper').find('#'+this.EDITOR_BODY).after(this.toolbarSideBtns);//.attr('data-index', index);
        $('.editor-wrapper .save-template-btn').on('click', function(e) {
            self.saveTemplate(e);
        });

        $('.editor-wrapper .reload-template-btn').on('click', function(e) {
            self.reloadTemplate(e);
        });*/

        $(document).on('focusin', function (e) {
            if (event && $(event.target).closest('.mce-window').length) {
                e.stopImmediatePropagation();
            }
        });
        this.isTinyMceLoaded = true;
    }

    /**
     * Saves template data
     * @param {Event} event - event object
     * @return {Promise<any>}
     */
    saveTemplate(event): Promise<any> {
        const activeEditorName = this.getActiveEditorName(event);

        if(this.hasValidContent()) {
            return Swal.fire({
                title: 'Are you sure?',
                text: 'Previous template will be overridden.',
                type: 'warning',
                showCancelButton: true,
                confirmButtonClass: 'btn btn-success',
                cancelButtonClass: 'btn btn-cancel',
                confirmButtonText: 'Yes, save it!',
                buttonsStyling: false
            }).then((result) => {
                if (result && result.value) {
                    const data: CommsMCTextTemplate = new CommsMCTextTemplate();
                    data.id = this.emailForm.controls.id.value;
                    tinymce.activeEditor.selection.collapse(false);

                    // send full template if local
                    if(this.isLocalTemplate) {
                        data.header = this.emailForm.controls.header.value;
                        data.body   = this.emailForm.controls.body.value;
                        data.footer = this.emailForm.controls.footer.value;
                    } else {
                        this.emailForm.controls[activeEditorName].setValue(tinymce.activeEditor.getContent());
                        data[activeEditorName] = this.emailForm.controls[activeEditorName].value;
                    }

                    return this.commsTemplateService.updateLocalTemplate(data).then((res) => {
                        this.isTinyMceActive = false;
                        $(event.target).closest('.mc-block').removeClass('active');
                        Utils.showNotification('Template has been saved.', Colors.success);
                        return res;
                    }).catch(err => console.log(err));
                }
                return result;
            });
        } else {
            const errorMsg = `Please enter relevant content in the ${activeEditorName} of your email.`;
            Utils.showNotification(errorMsg, Colors.danger);
            return Promise.reject(errorMsg);
        }
    }

    /**
     * Reloads local template
     * @param {Event} event - event object
     * @return {Promise<object>}
     */
    reloadTemplate(event): Promise<object> {
        return Swal.fire({
            title: 'Are you sure?',
            text: 'Reset to default template.',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn btn-success',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Yes, do it!',
            buttonsStyling: false
        }).then((result) => {
            if (result && result.value) {
                return this.commsTemplateService.getLocalTemplate(this.schoolId).then((template) => {
                    const activeEditorName = this.getActiveEditorName(event);
                    this.emailForm.controls[activeEditorName].setValue(template[activeEditorName]);
                    tinymce.activeEditor.setContent(template[activeEditorName]);
                    tinymce.activeEditor.selection.collapse(false);
                    this.emailForm.markAsDirty();

                    Utils.showNotification('Template has been reset to default.', Colors.success);
                    return template;
                });
            }
            return result;
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
    onSubmit(doExit: boolean = false): Promise<boolean>  {
        return this.submit().then(() => {
            if (doExit) {
                this.onCancel();
            }
            this.submitted = false;
            this.changed = 0;
            this.emailForm.markAsPristine();
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
     * @return {Promise<boolean>}
     */
    private submit(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.emailForm.value && !this.submitted) {
                this.submitted = true;
                const data: CommsMessage = this.emailForm.value;
                data.status = this.DEFAULT_MSG_STATUS;
                data.fromUserId = this.emailForm.controls.fromUser.value.id;
                return this.commService.updateMessage(data).then((res) => {
                    if (res && res.id) {
                        this.emailForm.controls.id.setValue(res.id);
                    }
                    resolve(true);
                }).catch(err => {
                    console.log(err);
                    reject(err);
                });
            } else {
                reject();
            }
        });
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
        this.router.navigate([this.commService.HOME_LINK]);
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

}