import { Component, ViewEncapsulation, Input, OnInit, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SubscriptionLike as ISubscription } from 'rxjs';

import { ApplicationsService } from '../applications.service';
import { AmazingTimePickerService } from 'amazing-time-picker';

import { Contact } from 'app/entities/contact';
import { Student } from 'app/entities/student';
import { AppStudentMapping } from 'app/entities/app-student-mapping';
import { ModalAction } from 'app/common/enums';
import { MergeAppFormTemplateInfoDTO } from 'app/common/dto/merge-app-form-template-info';
import { Constants } from 'app/common/constants';
import { Colors, Utils } from 'app/common/utils';

import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
    selector: 'app-new-application-dialog',
    templateUrl: 'apps-new-application-dialog.component.html',
    encapsulation: ViewEncapsulation.None,
})

export class AppsNewApplicationDialog implements OnInit, OnDestroy {

    @Input() student: Student;
    @Input() contact: Contact;

    formId: string;
    formTemplates: MergeAppFormTemplateInfoDTO[] = [];
    public applicationDate = moment();
    public applicationTime: string;
    private timePickerSubscription: ISubscription;

    public promiseForBtn: Promise<any>;
    appStudentMapping$: Promise<AppStudentMapping[]>;
    loaded = false;

    constructor(
        private applicationsService: ApplicationsService,
        private atp: AmazingTimePickerService,
        private activeModal: NgbActiveModal
    ) { }

    ngOnInit() {
        this.applicationTime = moment().format(Constants.dateFormats.hourMinutes);
        return Promise.all([
            this.applicationsService.getFormTemplates().then((formTemplates: MergeAppFormTemplateInfoDTO[]) => {
                this.formTemplates = formTemplates;
                const formTemplate = _.head(this.formTemplates);
                this.formId = formTemplate.applicationId;
                if (formTemplate.status === 'draft') {
                    Utils.showNotification(`Your Application Form must be published before you can create an Application`, Colors.warning);
                    this.activeModal.close({ action: ModalAction.Cancel });
                }
            }),
            this.appStudentMapping$ = this.applicationsService.getAppStudentMapping(this.student.id)
        ]).then(() => {
            this.loaded = true;
        });
    }

    newApplication() {
        const dateTime = moment(this.applicationDate.format(Constants.dateFormats.date) + ' ' + this.applicationTime).toDate();
        this.promiseForBtn = this.applicationsService.createSubmittedFillableForm(this.formId, this.contact, this.student, dateTime)
            .then((id: string) => {
                this.activeModal.close({ action: ModalAction.Done, formId: this.formId, id });
            });
    }

    timeChanged() {
        const amazingTimePicker = this.atp.open({
            time: this.applicationTime,
            theme: 'material-purple'
        });
        this.timePickerSubscription = amazingTimePicker.afterClose().subscribe(time => this.applicationTime = time);
    }

    onCancel() {
        this.activeModal.close({ action: ModalAction.Cancel });
    }

    ngOnDestroy() {
        if (this.timePickerSubscription) {
            this.timePickerSubscription.unsubscribe();
        }
    }
}
