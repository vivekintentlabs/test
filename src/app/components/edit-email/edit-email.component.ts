import { Component, Input, AfterViewInit, OnDestroy, Output, EventEmitter, NgZone, } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AmazingTimePickerService } from 'amazing-time-picker';
import { HttpService } from '../../services/http.service';

import { Utils } from '../../common/utils';
import { Constants } from '../../common/constants';
import { adminToolbar, basicToolbar, initTinyMCE } from 'app/common/tinymce-helper';
import { SubscriptionLike as ISubscription } from 'rxjs';

import { EventEmail } from '../../entities/event-email';
import { UserInfo } from '../../entities/userInfo';

import * as _ from 'lodash';
import * as tinymce from 'tinymce';

declare var $: any;

@Component({
    selector: 'app-edit-email',
    templateUrl: 'edit-email.component.html',
    styleUrls: ['./edit-email.component.scss']
})

export class EditEmailComponent implements AfterViewInit, OnDestroy {
    @Input() email: EventEmail;
    @Input() insertSubjectEmail: any[];
    @Input() insertMessageEmail: any[];
    @Input() type: string;
    @Input() title: string;
    @Input() titleEmail: string;
    @Input() eventTypeName = '';
    @Input() hasTwoCampus: boolean;
    @Input() id: number;
    @Input() campusTimezoneId: string;
    @Output() emailChanged = new EventEmitter();
    days: number[] = _.range(1, 31);
    moments: string[] = ['after', 'prior'];
    deleteIds: number[] = [];
    noItemSelected = Constants.noItemSelected; // show constant string in html
    emailForm: FormGroup = null;
    collectDescription = false;
    loaded = false;
    promiseForBtn: Promise<any>;
    isSendImmediately: boolean;
    private userInfo: UserInfo = null;
    private timePickerSubscription: ISubscription;
    requiredEmailSubjectMaxLength = Constants.requiredEmailSubjectMaxLength;
    bodyMessageErrorText = Constants.bodyMessageErrorText;

    constructor(
        private atp: AmazingTimePickerService,
        private httpService: HttpService,
        private fb: FormBuilder,
        private zone: NgZone) {
    }

    ngAfterViewInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        $(document).on('hide.bs.modal', '#emailModal-' + this.type, () => {
            tinymce.remove();
        });
    }

    preparePopUp() {
        if (this.email) {
            _.forEach(this.insertMessageEmail, (item) => {
                if (item.text === 'Campus Name') {
                    return item.hidden = this.hasTwoCampus;
                } else if (this.type === EventEmail.TYPE_EMAIL_EVENT && item.text === 'Subtour Name Time' && this.email.event) {
                    return item.hidden = !this.email.event.isSubToursEnabled;
                }
            });
            this.createForm();
            this.loaded = true;
            setTimeout(() => {
                this.initTinyMCE();
            }, 0);
            $('#emailModal-' + this.type).modal('show');
        }
    }

    insertField(value: string) {
        this.emailForm.controls.subject.setValue(
            (this.emailForm.controls.subject.value === null) ? value : this.emailForm.controls.subject.value + value
        );
        this.emailForm.controls.insertField.setValue(null);
    }

    private createForm() {
        let scheduledLocalTime = this.email.scheduledLocalTime;
        this.isSendImmediately = this.email.isImmediate ? true : false;
        // if this is a real email for pt or event, not a template email, then use the sendAt time and convert it to local time
        if (this.id && !this.email.isImmediate) {
            scheduledLocalTime = Utils.getLocalTimeFromUtc(
                this.email.sendAt, Constants.dateFormats.dateTime, this.campusTimezoneId, Constants.dateFormats.time);
        }
        this.emailForm = this.fb.group({
            id: [this.email.id],
            insertField: null,
            subject: [this.email.subject, Validators.compose([Validators.required, Validators.maxLength(this.requiredEmailSubjectMaxLength)])],
            message: [this.email.message, Validators.maxLength(Constants.textFieldMaxLength)],
            isImmediate: [this.email.isImmediate ? 'true' : 'false'],
            scheduleDays: [this.email.scheduleDays],
            scheduleMoment: [this.email.scheduleMoment],
            scheduledLocalTime: [scheduledLocalTime],
            isCheckedIn: [this.email.isCheckedIn ? 'true' : 'false'],
            activated: [this.email.activated]
        });
    }

    public sendImmediatelyChanged(value: string) {
        if (value === 'true') {
            this.isSendImmediately = true;
            this.emailForm.controls.scheduleDays.setValue(null);
            this.emailForm.controls.scheduleMoment.setValue(null);
            this.emailForm.controls.isCheckedIn.setValue(false);
            this.emailForm.controls.scheduledLocalTime.setValue(null);
        } else if (value === 'false') {
            this.isSendImmediately = false;
            this.emailForm.controls.scheduleDays.setValue(this.days[0]);
            this.emailForm.controls.scheduleMoment.setValue(this.moments[0]);
            this.emailForm.controls.scheduledLocalTime.setValue('06:00');
        }
    }

    public momentChng() {
        this.emailForm.controls.isCheckedIn.setValue(false);
    }

    private initTinyMCE() {
        const toolbar = this.userInfo.isSchoolAdminOrHigher() ? adminToolbar : basicToolbar;
        const config = {
            selector: '#emailMessage',
            toolbar,
            setup: (editor) => {
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
                        this.emailForm.controls.message.setValue(editor.getContent());
                        this.emailForm.controls.message.markAsDirty();
                    });
                });
            }
        }
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
        return this.promiseForBtn = new Promise<void>((resolve, reject) => {
            const data: EventEmail = this.emailForm.value;
            data.type = this.type;
            data.scheduleDays = this.emailForm.value.scheduleDays ? this.emailForm.value.scheduleDays : null;
            data.scheduleMoment = this.emailForm.value.scheduleMoment ? this.emailForm.value.scheduleMoment : null;
            data.isCheckedIn = this.emailForm.value.isCheckedIn === 'true' ? true : false;
            data.isImmediate = this.emailForm.value.isImmediate === 'true' ? true : false;
            data.schoolId = this.userInfo.schoolId;
            if (this.type === EventEmail.TYPE_EMAIL_EVENT) {
                data.eventId = this.id;
            } else if (this.type === EventEmail.TYPE_EMAIL_PERSONAL_TOUR) {
                data.personalTourId = this.id;
            }
            this.httpService.postAuth('event-email/update', data).then((res) => {
                this.emailChanged.emit();
                Utils.showSuccessNotification();
                this.onCancel();
                resolve();
            }).catch(err => {
                console.log(err);
                reject();
            });
        });
    }

    ngOnDestroy() {
        $(document).off('hide.bs.modal', '#emailModal-' + this.type);
        Utils.destroyTinyMCE('#emailMessage');
        Utils.disposeModal('#emailModal-' + this.type);
        if (this.timePickerSubscription) {
            this.timePickerSubscription.unsubscribe();
        }
    }

    onCancel() {
        $('#emailModal-' + this.type).modal('hide');
        this.emailForm = null;
        this.loaded = false;
    }

    timeChanged(timeControl, defaultTime) {
        if (!this.isSendImmediately) {
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
