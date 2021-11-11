import { Component, AfterViewInit, OnDestroy, Input, Output, NgZone, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Utils, Colors } from '../../common/utils';
import { Constants } from '../../common/constants';
import { ChildCmpState } from 'app/common/interfaces';
import { ErrorCode, ModalAction } from '../../common/enums';
import { adminToolbar, basicToolbar, initTinyMCE } from 'app/common/tinymce-helper';

import { User } from '../../entities/user';
import { UserInfo } from '../../entities/userInfo';
import { EmailSignature } from '../../entities/email-signature';
import { ImgDisplayWidth } from '../../entities/img-display-width';

import { HttpService } from '../../services/http.service';
import { ErrorMessageService } from '../../services/error-message.service';

import { SendTestEmailComponent } from '../send-test-email/send-test-email.component';

import { environment } from 'environments/environment';

import * as _ from 'lodash';

@Component({
    selector: 'app-email-signature',
    templateUrl: 'email-signature.component.html',
    styleUrls: ['./email-signature.component.scss']
})
export class EmailSignatureComponent implements AfterViewInit, OnDestroy {

    @Input() users: User[] = [];
    @Output() stateChangeOutput = new EventEmitter<ChildCmpState>();
    public userInfo: UserInfo = null;
    public noItemSelected = Constants.noItemSelected; // show constant string in html
    public emailSignatureForm: FormGroup = null;
    public previewUser: User = null;
    public content: string;
    public insertEmailSignature: any[] = Constants.insertEmailSignature;
    public emailSignature: EmailSignature;
    public locations: string[] = [];
    public urlLogo: string;
    public naturalImageWidth: number;
    public imgWidth: number;
    public imgDisplayWidths: ImgDisplayWidth[] = [];

    public promiseForBtn: Promise<any>;

    private changed = 0;
    private submitted = false;
    private sub: Subscription;
    public brand = environment.brand;

    constructor(
        private fb: FormBuilder,
        private httpService: HttpService,
        private zone: NgZone,
        private modalService: NgbModal,
        private errorMessageService: ErrorMessageService,
    ) { }

    ngAfterViewInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        return this.getEmailSignature().then(() => {
            this.getMeta(this.urlLogo);
            this.createForm();
            if (this.emailSignature.userId !== null) {
                this.setPreviewUser(this.emailSignature.userId);
            }
            setTimeout(() => {
                this.initTinyMCE();
                this.setSignature(this.emailSignature.signature);
            }, 10);
        });
    }

    private emitData() {
        this.stateChangeOutput.emit({
            changed: this.changed,
            submitted: this.submitted
        });
    }

    public getEmailSignature(): Promise<any> {
        return this.httpService.getAuth('email-signature', false).then((data: any) => {
            this.userInfo = Utils.getUserInfoFromToken();
            this.emailSignature = data.emailSignature;
            this.locations = data.locations;
            this.imgDisplayWidths = data.imgDisplayWidths;
            if (this.emailSignatureForm) {
                this.emailSignatureForm.controls.userId.setValue(this.emailSignature.userId);
                this.setPreviewUser(this.emailSignature.userId);
                this.setSignature(this.emailSignatureForm.controls.signature.value);
            }
            this.urlLogo = '';
            return this.httpService.getAuth('file/get-url-logo', false).then((url: string) => {
                // to force it to not cache the image
                this.urlLogo = (url === '') ? '' : url + '?' + Math.floor((Math.random() * 100) + 1);
                return Promise.resolve();
            });
        }).catch(async err => {
            console.log(err);
            if (err.errorCode === ErrorCode.read_file_error) {
                Utils.showNotification(Constants.logoErrorText, Colors.danger);
            } else {
                const errMsg: string = await this.errorMessageService.getMessage(err.errorCode, err.errorMessage, err?.params);
                Utils.showNotification(errMsg, Colors.danger);
            }
        });
    }

    private createForm() {
        this.emailSignatureForm = this.fb.group({
            id: [this.emailSignature.id],
            includeLogo: [{
                value: (this.urlLogo === '') ? false : this.emailSignature.includeLogo,
                disabled: (this.urlLogo === '') ? true : false
            }],
            locationLogo: [this.emailSignature.locationLogo],
            imgDisplayWidthId: [
                (this.emailSignature.imgDisplayWidthId === null) ? this.imgDisplayWidths[0].id : this.emailSignature.imgDisplayWidthId,
                Validators.compose([Validators.required])
            ],
            userId: [this.emailSignature.userId, Validators.compose([Validators.required])],
            signature: [this.emailSignature.signature, Validators.compose([Validators.maxLength(Constants.htmlContentMaxLength)])]
        });

        this.sub = this.emailSignatureForm.valueChanges.subscribe(val => {
            this.changed += 1;
            this.emitData();
        });
    }

    getMeta(url: string) {
        const img = new Image();
        const self = this;
        img.addEventListener('load', function () {
            self.naturalImageWidth = this.naturalWidth;
            // tslint:disable-next-line:max-line-length
            self.logoSizeChange((self.emailSignature.imgDisplayWidthId === null) ? self.imgDisplayWidths[0].id : self.emailSignature.imgDisplayWidthId);
        });
        img.addEventListener('error', function () {
            console.log(this);
        });
        img.src = url;
    }

    logoSizeChange(id: number) {
        this.imgWidth = _.find(this.imgDisplayWidths, (item: ImgDisplayWidth) => item.id === id).scale * this.naturalImageWidth;
    }

    onChange(id: number) {
        if (id !== this.emailSignature.userId) {
            this.emailSignature.userId = id;
            this.setPreviewUser(id);
        }
    }

    setPreviewUser(id: number) {
        this.previewUser = _.find(this.users, (item: User) => item.id === id) || null;
    }


    onSubmit() {
        this.submit().then(() => {
            this.lastAction();
        });
    }

    onCancel() {
        this.changed = 0;
        this.emitData();
        this.lastAction(false);
    }

    private lastAction(showNotification = true) {
        if (showNotification) {
            Utils.showSuccessNotification();
        }
    }

    submit() {
        return this.promiseForBtn = this.httpService.postAuth('email-signature/update', this.emailSignatureForm.value).then(() => {
            this.setSignature(this.emailSignatureForm.controls.signature.value);
            this.submitted = true;
            this.emitData();
            return Promise.resolve();
        }).catch(err => {
            console.log(err);
            this.submitted = false;
            this.emitData();
            return Promise.reject();
        });
    }

    private initTinyMCE() {
        const self = this;
        const toolbar = this.userInfo.isSchoolAdminOrHigher() ? adminToolbar : basicToolbar;
        const config = {
            selector: '#emailSignature',
            toolbar,
            setup: (editor) => {
                editor.on('init', () => {
                    this.content = editor.getContent();
                });
                editor.addButton('insertFields', {
                    type: 'listbox',
                    text: '<Insert Fields>',
                    icon: false,
                    onselect() {
                        editor.insertContent(this.value());
                    },
                    values: self.insertEmailSignature
                });
                editor.on('change keyup input', () => {
                    setTimeout(() => {
                        this.zone.run(() => {
                            this.setSignature(editor.getContent());
                            if (editor.isDirty()) {
                                this.emailSignatureForm.controls.signature.markAsDirty();
                            } else {
                                this.emailSignatureForm.controls.signature.markAsPristine();
                            }
                        });
                    }, 0);
                });
            }
        };
        initTinyMCE(config);
    }

    setSignature(content: string) {
        if (content !== null && this.previewUser) {
            this.content = content;
            this.emailSignature.signature = content;
            this.emailSignatureForm.controls.signature.setValue(content);
            this.emailSignature.school.emailSignature = this.emailSignature;
            this.emailSignature.signature = Utils.replaceEmailSignatureTag(this.emailSignature.signature, this.previewUser, this.emailSignature.school);
        }
    }

    saveAndSendTestEmailSignature() {
        const modalSendTestEmailRef = this.modalService.open(SendTestEmailComponent, Constants.ngbModalLg);
        modalSendTestEmailRef.result.then((result: { action: ModalAction, email: string }) => {
            switch (result.action) {
                case ModalAction.Done:
                    this.setSignature(this.content);
                    return this.submit().then(() => {
                        return this.httpService.postAuth(
                            'email-signature/send-test-email',
                            { email: result.email }
                        ).then(() => {
                            Utils.showNotification('Test Email Signature successfully sent.', Colors.success);
                        }).catch(console.error);
                    });
                default:
                    break;
            }
        }).catch(modalSendTestEmailRef.dismiss);
    }

    ngOnDestroy() {
        if (this.sub) {
            this.sub.unsubscribe();
        }
        Utils.destroyTinyMCE('#emailSignature');
    }

}
