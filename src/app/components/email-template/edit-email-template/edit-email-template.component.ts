import { Component, Input, NgZone, ViewEncapsulation, OnInit, OnDestroy} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AmazingTimePickerService } from 'amazing-time-picker';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SubscriptionLike as ISubscription } from 'rxjs';

import { HttpService } from 'app/services/http.service';

import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { ModalAction } from 'app/common/enums';
import { InsertField } from 'app/common/interfaces';
import { adminToolbar, basicToolbar, initTinyMCE } from 'app/common/tinymce-helper';

import { UserInfo } from 'app/entities/userInfo';
import { EmailTemplate } from 'app/entities/email-template';

import * as _ from 'lodash';

declare var $: any;

@Component({
    selector: 'app-edit-email-template',
    templateUrl: 'edit-email-template.component.html',
    styleUrls: ['./edit-email-template.component.scss'],
    encapsulation: ViewEncapsulation.None,
})

export class EditEmailTemplateComponent implements OnInit, OnDestroy {
    @Input() email: EmailTemplate;
    @Input() insertSubjectEmail: InsertField[];
    @Input() insertMessageEmail: InsertField[];
    @Input() type: string;
    @Input() title: string;
    @Input() webformName: string;

    public days: number[] = _.range(1, 366);
    public deleteIds: number[] = [];
    public noItemSelected = Constants.noItemSelected; // show constant string in html
    public emailForm: FormGroup = null;
    private userInfo: UserInfo = null;
    public loaded = false;
    requiredEmailSubjectMaxLength = Constants.requiredEmailSubjectMaxLength;
    bodyMessageErrorText = Constants.bodyMessageErrorText;
    private timePickerSubscription: ISubscription;
    promiseForBtn: Promise<any>;

    constructor(
        private atp: AmazingTimePickerService,
        private httpService: HttpService,
        private fb: FormBuilder,
        private zone: NgZone,
        private activeModal: NgbActiveModal
    ) { }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        if (this.email) {
            this.createForm();
            this.loaded = true;
            setTimeout(() => {
                this.initTinyMCE();
            }, 0);
        }
    }

    insertField(value: string) {
        this.emailForm.controls.subject.setValue(
            (this.emailForm.controls.subject.value === null) ? value : this.emailForm.controls.subject.value + value
        );
        this.emailForm.controls.insertField.setValue(null);
    }

    private createForm() {
        this.emailForm = this.fb.group({
            id: [this.email.id],
            insertField: null,
            subject: [this.email.subject, Validators.compose([Validators.required, Validators.maxLength(this.requiredEmailSubjectMaxLength)])],
            message: [this.email.message, Validators.maxLength(Constants.textFieldMaxLength)],
            scheduleDays: [this.email.scheduleDays],
            scheduledLocalTime: [this.email.scheduledLocalTime],
            activated: [this.email.activated]
        });
    }

    private initTinyMCE() {
        const toolbar = this.userInfo.isSchoolAdminOrHigher() ? adminToolbar : basicToolbar;
        const config = {
            selector: '#emailTemplateMessage',
            toolbar,
            setup: (editor) => {
                const self = this;
                editor.addButton('insertFields', {
                    type: 'listbox',
                    text: '<Insert Fields>',
                    icon: false,
                    onselect() {
                        editor.insertContent(this.value());
                    },
                    values: self.insertMessageEmail
                });
                editor.on('change keyup input', () => {
                    this.zone.run(() => {
                        this.emailForm.controls.message.setValue(editor.getContent());
                        this.emailForm.controls.message.markAsDirty();
                    });
                });
            }
        };
        initTinyMCE(config);
    }

    onSubmit() {
        if (this.emailForm.value) {
            return this.submit().then(() => {
                this.activeModal.close({ action: ModalAction.Done });
            });
        }
    }

    private submit() {
        return this.promiseForBtn = new Promise<void>((resolve, reject) => {
            const data: EmailTemplate = this.emailForm.value;
            data.type = this.type;
            data.scheduleDays = this.emailForm.value.scheduleDays;
            data.scheduleMoment = this.email.scheduleMoment;
            data.isImmediate = this.email.isImmediate;
            data.schoolId = this.userInfo.schoolId;
            if (!this.email.id) {
                this.httpService.postAuth('email-template', data).then((res) => {
                    Utils.showSuccessNotification();
                    resolve();
                }).catch(err => {
                    console.log(err);
                    reject();
                });
            } else {
                this.httpService.putAuth(`email-template/${data.id}`, data).then((res) => {
                    Utils.showSuccessNotification();
                    resolve();
                }).catch(err => {
                    console.log(err);
                    reject();
                });
            }
        });
    }

    ngOnDestroy() {
        Utils.destroyTinyMCE('#emailTemplateMessage');
        if (this.timePickerSubscription != null) {
            this.timePickerSubscription.unsubscribe();
        }
    }

    onCancel() {
        this.activeModal.close({ action: ModalAction.Cancel });
    }

    timeChanged(timeControl, defaultTime) {
        if (!this.email.isImmediate) {
            const amazingTimePicker = this.atp.open({
                time: (timeControl.value !== null ? timeControl.value : defaultTime),
                theme: 'material-purple',
                onlyHour: true
            });
            this.timePickerSubscription = amazingTimePicker.afterClose().subscribe(time => {
                timeControl.setValue(time);
                this.emailForm.markAsDirty();
            });
        }
    }

}
