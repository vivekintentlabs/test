import { Component, Input, OnDestroy, NgZone, OnInit, } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { Constants } from 'app/common/constants';
import { Colors, Utils } from 'app/common/utils';
import { InsertField } from 'app/common/interfaces';
import { ModalAction } from 'app/common/enums';
import { AppFillableFormEmailDTO } from 'app/common/dto/fillable-form-email';
import { adminToolbar, basicToolbar, initTinyMCE } from 'app/common/tinymce-helper';
import { T } from 'app/common/t';
import { UserInfo } from 'app/entities/userInfo';
import { User } from 'app/entities/user';

import { HttpService } from 'app/services/http.service';
import { ApplicationsService } from 'app/applications/applications.service';

import { emailChipsValidator } from 'app/validators/email-chips.validator';

import * as _ from 'lodash';
declare var $: any;

@Component({
    selector: 'apps-fillableform-send-email',
    templateUrl: 'apps-fillableform-send-email.component.html',
    styleUrls: ['./apps-fillableform-send-email.component.scss']
})

export class AppsFillableFormSendEmailComponent implements OnInit, OnDestroy {
    @Input() docId: string;
    @Input() formId: string;
    @Input() contactEmails: string;
    noItemSelected = Constants.noItemSelected; // show constant string in html
    emailForm: FormGroup = null;
    promiseForBtn: Promise<any>;
    private userInfo: UserInfo = null;
    schoolUsers: User[] = [];
    requiredEmailSubjectMaxLength = Constants.requiredEmailSubjectMaxLength;
    textFieldMaxLength = Constants.textFieldMaxLength;
    bodyMessageErrorText = Constants.bodyMessageErrorText;
    insertMessageApplicationsEmail: InsertField[] = _.cloneDeep(Constants.insertMessageApplicationsEmail);

    private ngUnsubScribe = new Subject();

    constructor(
        private activeModal: NgbActiveModal,
        private appsService: ApplicationsService,
        private httpService: HttpService,
        private fb: FormBuilder,
        private zone: NgZone,
        private translate: TranslateService
    ) { }

    ngOnInit() {
        return this.httpService.getAuth(`users/with-attributes?fields=id,firstName,lastName,email`).then((users: User[]) => {
            this.schoolUsers = users;
            this.userInfo = Utils.getUserInfoFromToken();

            this.createForm();
            const fromUser = _.find(this.schoolUsers, (item: User) => item.id === this.userInfo.id);
            this.emailForm.controls.fromUser.setValue(fromUser);

            this.translate.get([T.intake_year_level, T.intakeYearLevelTag]).pipe(takeUntil(this.ngUnsubScribe)).subscribe((data: string[]) => {
                _.set(_.find(this.insertMessageApplicationsEmail, {text: T.intake_year_level}), 'text', data[T.intake_year_level]);
                _.set(_.find(this.insertMessageApplicationsEmail, {value: T.intakeYearLevelTag}), 'value', data[T.intakeYearLevelTag]);
            });

            setTimeout(() => {
                this.initTinyMCE();
            }, 100);
        });
    }

    private createForm() {
        this.emailForm = this.fb.group({
            to: [this.contactEmails, Validators.compose([emailChipsValidator])],
            cc: [null, Validators.compose([emailChipsValidator])],
            bcc: [null, Validators.compose([emailChipsValidator])],
            fromUser: '',
            subject: ['', Validators.compose([Validators.required, Validators.maxLength(Constants.requiredEmailSubjectMaxLength)])],
            message: ['', Validators.maxLength(Constants.textFieldMaxLength)],
        });
    }

    private initTinyMCE() {
        const toolbar = this.userInfo.isSchoolAdminOrHigher() ? adminToolbar : basicToolbar;
        const config = {
            selector: '#emailMessage',
            toolbar,
            setup: (editor) => {
                editor.addButton('insertFields', {
                    type: 'listbox',
                    text: '<Insert Fields>',
                    icon: false,
                    onselect(e) {
                        editor.insertContent(this.value());
                    },
                    values: this.insertMessageApplicationsEmail
                });
                editor.on('change keyup input ', () => {
                    this.zone.run(() => {
                        this.emailForm.controls.message.setValue(editor.getContent());
                        this.emailForm.controls.message.markAsDirty();
                    });
                });
            }
        };
        initTinyMCE(config);

        // for link options, without this, link will be not editable
        $(document).on('focusin', (e) => {
            if (event && $(event.target).closest('.mce-window').length) {
                e.stopImmediatePropagation();
            }
        });
    }

    onSubmit() {
        if (this.emailForm.value) {
            this.submit();
        }
    }

    private submit() {
        return this.promiseForBtn = new Promise((resolve, reject) => {
            const data: AppFillableFormEmailDTO = {
                email: this.emailForm.controls.to.value,
                cc: this.emailForm.controls.cc.value,
                bcc: this.emailForm.controls.bcc.value,
                fromUserEmail: this.emailForm.controls.fromUser.value.email,
                fromUserName: `${this.emailForm.controls.fromUser.value.firstName} ${this.emailForm.controls.fromUser.value.lastName}`,
                subject: this.emailForm.controls.subject.value,
                message: this.emailForm.controls.message.value
            };
            return this.appsService.sendEmail(this.docId, this.formId, data).then(() => {
                this.emailForm.markAsPristine();
                Utils.showNotification('Email has been sent.', Colors.success);
                this.promiseForBtn = null;
                this.activeModal.close({ action: ModalAction.Update });
                resolve(true);
            }).catch(err => {
                this.promiseForBtn = null;
                reject(err);
            });
        });
    }

    ngOnDestroy() {
        Utils.destroyTinyMCE('#emailMessage');
        this.ngUnsubScribe.next();
        this.ngUnsubScribe.complete();
    }

    onCancel() {
        this.promiseForBtn = null;
        this.activeModal.close({ action: ModalAction.Cancel });
    }

}
