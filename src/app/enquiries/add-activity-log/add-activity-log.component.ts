import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { Keys } from 'app/common/keys';

import { HttpService } from 'app/services/http.service';
import { DataService } from '../../services/data.service';

import { UserInfo } from '../../entities/userInfo';
import { ListItem } from '../../entities/list-item';
import { ActivityLog } from '../../entities/activityLog';
import { EmailTemplate } from '../../entities/email-template';
import { Student } from '../../entities/student';
import { ActivityLogDTO } from 'app/common/dto/activity-log';

import * as moment from 'moment';
import * as _ from 'lodash';
import { LICode } from 'app/common/enums';

declare var $: any;

@Component({
    selector: 'app-add-activity-log',
    templateUrl: './add-activity-log.component.html'
})
export class AddActivityLogComponent implements OnChanges, OnDestroy {

    public studentId: number;
    @Input() studentIds: number[];
    @Input() students: Student[];
    @Input() actionEdit: boolean;
    @Input() editableStudentId?: number;
    @Input() activityLogId: number;
    @Input() activityIdSendProspectus: number;
    @Input() activityIdRecordOfConversation: number;
    @Input() schoolProspectus: EmailTemplate;
    @Input() triggerAL: boolean;
    @Output() updatedActivityLog = new EventEmitter();
    activityLogForm: FormGroup;
    loaded = false;
    title = 'Add Activity Log';
    private userInfo: UserInfo = null;
    public activityLog: ActivityLog;
    public editActivityLog: ActivityLog;
    public activities: ListItem[] = [];
    public leadSources: ListItem[] = [];
    public noItemSelected = Constants.noItemSelected; // show constant string in html
    messageMaxLength = Constants.messageMaxLength;
    almostFullMessageField = Constants.almostFullMessageField;
    private sub: any;
    selectTheme = 'primary';
    isSendProspectus = false;
    isRecordOfConversation = false;
    public messageIsEditable = true;
    isMessageVisible = true;

    promiseForBtn: Promise<any>;

    constructor(
        private fb: FormBuilder,
        private httpService: HttpService,
        private dataService: DataService,
    ) {
    }

    ngOnChanges(changes: SimpleChanges) {
        this.studentIds = _.union(this.studentIds);
        this.studentId = this.studentIds.length === 1 ? this.studentIds[0] : null;
        if (this.actionEdit) {
            this.studentId = this.editableStudentId;
        }
        if (this.studentIds) {
            this.userInfo = Utils.getUserInfoFromToken();
            if (this.activityLogId) {
                this.title = 'Edit Activity Log';
                this.httpService.getAuth('activity-log/get-activity-log/' + this.activityLogId).then((res: ActivityLogDTO) => {
                    const activity = _.find(res.activities, (item) => item.id === res.activityLog.activityId);
                    const activityApplicationStarted = _.find(res.activities, (i: ListItem) => i.code === LICode.activity_application_in_progress)
                    this.activities = res.activities;
                    this.leadSources = res.leadSources;
                    this.activityLog = res.activityLog;
                    this.messageIsEditable = this.activityLog.messageIsEditable !== false ? true : false;
                    this.isMessageVisible = (activity.code !== LICode.email_communications || this.messageIsEditable);
                    this.editActivityLog = Utils.clone(this.activityLog);
                    if (activityApplicationStarted?.id !== this.activityLog.activityId) {
                        // Dropdown list in Edit Activity Log popup window
                        // This include-in-list flag is managed in Activites list from School Lists
                        _.remove(res.activities, (i: ListItem) => (i.code === LICode.activity_application_in_progress) || (!i.includeInList && i.id !== activity.id));
                    }
                    this.createForm();
                }).catch(err => console.log(err));
            } else if (this.activityLogId === 0) {
                this.title = 'Add Activity Log';
                this.httpService.getAuth('activity-log/get-activities/').then((res: any) => {
                    // Dropdown list in Add Activity Log popup window
                    // This include-in-list flag is managed in Activites from School Lists
                    _.remove(res.activities, (i: ListItem) => (i.code === LICode.activity_application_in_progress) || !i.includeInList);
                    this.activities = res.activities;
                    this.leadSources = res.leadSources;
                    this.activityLog = new ActivityLog();
                    this.activityLog.date = moment().format(Constants.dateFormats.date);
                    this.messageIsEditable = true;
                    this.isMessageVisible = this.messageIsEditable;
                    this.editActivityLog = Utils.clone(this.activityLog);
                    this.createForm();
                }).catch(err => console.log(err));
            }
        }
    }

    createForm() {
        this.isSendProspectus = this.activityIdSendProspectus === this.editActivityLog.activityId;
        this.isRecordOfConversation = this.activityIdRecordOfConversation === this.editActivityLog.activityId;
        this.activityLogForm = this.fb.group({
            id: [this.editActivityLog.id],
            date: [
                this.editActivityLog.date ? moment(this.editActivityLog.date).toDate() : null,
                Validators.compose([Validators.required])
            ],
            activityId: [this.editActivityLog.activityId, Validators.compose([Validators.required])],
            leadSourceId: [
                this.editActivityLog.leadSourceId, (this.isSendProspectus || this.isRecordOfConversation) ? Validators.required : ''
            ],
            message: [this.editActivityLog.message],
            studentId: [this.studentId, Validators.required],
            sendProspectus: [this.schoolProspectus.activated ? (this.editActivityLog.id ? false : true) : false]
        });
        this.loaded = true;
    }

    onSubmit() {
        this.dataService.resetPageDependentData();
        this.submit().then(() => {
            Utils.showSuccessNotification();
            $('#editActivityLogModal').modal('hide');
        });
    }

    private submit(): Promise<void> {
        return this.promiseForBtn = new Promise<void>((resolve, reject) => {
            const formData: Object = _.cloneDeep(this.activityLogForm.value);

            const leadSource = _.find(this.leadSources, ls => ls.id === formData[Keys.leadSourceId]);
            // TODO workaround to prevent submit going to backend when the user updates activity log leadsource and presses submit before the form fields are updated.
            // better (but more complex solution) would be to prevent submitting the form until the UI settles
            if (!leadSource && (this.isSendProspectus || this.isRecordOfConversation)) {
                reject('Leadsource is required');
            }
            if (this.isSendProspectus) {
                const sent = (formData['sendProspectus']) ? 'Sent' : 'Not Sent';
                formData['notes'] = 'Source: ' + leadSource.name + ', Email: ' + sent;
                formData['isSendProspectus'] = true;
            } else if (this.isRecordOfConversation) {
                formData['notes'] = 'Source: ' + leadSource.name;
                formData['isRecordOfConversation'] = true;
            } else {
                formData[Keys.leadSourceId] = null;
                formData['notes'] = null;
                formData['sendProspectus'] = false;
                formData['isSendProspectus'] = false;
            }

            formData['date'] = moment(formData['date']).format(Constants.dateFormats.date);

            if (!this.activityLogForm.value.id) {
                this.httpService.postAuth('activity-log/add-activity-log', formData).then((newActivityLog: ActivityLog) => {
                    newActivityLog.sendProspectus = this.activityLogForm.controls.sendProspectus.value;
                    this.updatedActivityLog.emit(newActivityLog);
                    resolve();
                }).catch(err => {
                    console.error(err);
                    reject();
                });
            } else {
                this.httpService.postAuth('activity-log/update-activity-log', formData).then((updatedActivityLog) => {
                    this.updatedActivityLog.emit(updatedActivityLog);
                    resolve();
                }).catch(err => {
                    console.error(err);
                    reject();
                });
            }
        });
    }

    onCancel() {
        this.loaded = false;
        this.editActivityLog = Utils.clone(this.activityLog);
        $('#editActivityLogModal').modal('hide');
    }

    activityChange(id: number) {
        this.isSendProspectus = this.activityIdSendProspectus === id;
        this.isRecordOfConversation = this.activityIdRecordOfConversation === id;
        this.activityLogForm.controls.leadSourceId.setValidators((this.isSendProspectus || this.isRecordOfConversation) ? [Validators.required] : []);
        this.activityLogForm.controls.leadSourceId.updateValueAndValidity();
    }

    ngOnDestroy() {
        Utils.disposeModal('#editActivityLogModal');
    }
}
