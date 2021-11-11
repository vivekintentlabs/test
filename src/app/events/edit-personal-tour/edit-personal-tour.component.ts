import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, SubscriptionLike as ISubscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AmazingTimePickerService } from 'amazing-time-picker';

import { HttpService } from 'app/services/http.service';

import { BaseForm } from 'app/base-form';

import { Constants } from 'app/common/constants';
import { Utils } from 'app/common/utils';

import { PersonalTour } from 'app/entities/personal-tour';
import { UserInfo } from 'app/entities/userInfo';
import { Campus } from 'app/entities/campus';
import { User } from 'app/entities/user';

import { emailChipsValidator } from 'app/validators/email-chips.validator';

import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
    selector: 'app-edit-personal-tour',
    styleUrls: ['edit-personal-tour.component.scss'],
    templateUrl: './edit-personal-tour.component.html',
})
export class EditPersonalTourComponent extends BaseForm implements OnInit, OnDestroy {

    loaded = false;
    title = 'Personal Tour Information';
    userInfo: UserInfo = null;
    isAdd: boolean;
    isDuplicate: boolean;

    personalTour: PersonalTour = new PersonalTour();

    currentUrl: string = null;
    personalTourId: number = null;

    showIfNoRepresentative = false;
    campuses: Campus[] = [];
    campus: Campus;
    users: User[] = [];

    validEndTime = true;

    private unsubscribe = new Subject();
    private timePickerSubscription: ISubscription;

    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    requiredStringFieldMaxLength = Constants.requiredStringFieldMaxLength;

    constructor(
        private atp: AmazingTimePickerService, private fb: FormBuilder,
        private route: ActivatedRoute, private router: Router,
        private httpService: HttpService,
    ) {
        super();
    }

    public ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.currentUrl = this.router.url.split(';')[0];
        this.showIfNoRepresentative = !this.userInfo.isSchoolRepresentative();

        this.route.params.pipe(takeUntil(this.unsubscribe)).subscribe(params => {
            this.personalTourId = params['personalTourId'];

            this.isAdd = this.router.url.indexOf('add-personal-tour') !== -1;
            this.isDuplicate = this.router.url.indexOf('duplicate-personal-tour') !== -1;

            if (this.isAdd) {
                return this.httpService.getAuth('campus/with-extra-data').then((data: any) => {
                    this.campuses = _.orderBy(_.filter(data.campuses, c => c.campusType !== Campus.CAMPUS_TYPE_UNDECIDED), ['sequence']);
                    this.campus = _.find(this.campuses, cmp => cmp.id === this.userInfo.campusId);
                    this.users = (data.users && data.users.length !== 0) ? _.orderBy(data.users, ['lastName']) : [];
                    this.personalTour.schoolId = this.userInfo.schoolId;
                    this.createForm(this.personalTour);
                    this.campusChanged(this.formGroup.controls.campusId.value);
                });
            } else if (this.isDuplicate) {
                const id = params['id'];
                return this.httpService.getAuth(`personal-tour/get/${id}`).then((data: any) => {
                    this.personalTour = data.personalTour;
                    this.personalTour.date = null;
                    this.personalTour.id = null;
                    this.campuses = _.orderBy(_.filter(data.campuses, c => c.campusType !== Campus.CAMPUS_TYPE_UNDECIDED), ['sequence']);
                    this.campus = _.find(this.campuses, cmp => cmp.id === this.personalTour.campusId);
                    this.users = (data.users && data.users.length !== 0) ? _.orderBy(data.users, ['lastName']) : [];
                    return this.createForm(this.personalTour);
                });
            } else {
                this.getPersonalTour().then(() => {
                    this.createForm(this.personalTour);
                });
            }
        });
    }

    private getPersonalTour(): Promise<any> {
        return this.httpService.getAuth('personal-tour/get/' + this.personalTourId).then((result: any) => {
            this.personalTour = result.personalTour;
            this.campuses = _.orderBy(_.filter(result.campuses, c => c.campusType !== Campus.CAMPUS_TYPE_UNDECIDED), ['sequence']);
            this.campus = _.find(this.campuses, cmp => cmp.id === this.personalTour.campusId);
            this.users = (result.users && result.users.length !== 0) ? _.orderBy(result.users, ['lastName']) : [];
            return Promise.resolve();
        }).catch(err => console.log(err));
    }

    onSubmit() {
        this.submit().then(() => {
            this.lastAction();
        }).catch(err => console.log(err));
    }

    onCancel() {
        super.onCancel();
        this.router.navigate(['/events/personal-tour']);
    }

    private lastAction(showNotification = true) {
        if (showNotification) {
            Utils.showSuccessNotification();
        }
        if (this.personalTourId) {
            Utils.refreshPage(this.router, ['/events/edit-personal-tour', { personalTourId: this.personalTourId }]);
        } else {
            this.router.navigate(['/events/personal-tour']);
        }
    }

    private createForm(personalTour?: PersonalTour) {
        this.formGroup = this.fb.group({
            id: [personalTour.id],
            date: [
                {
                    value: (personalTour.date != null) ? moment.utc(personalTour.date) : null,
                    disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true
                },
                Validators.compose([Validators.required])
            ],
            time: [
                { value: personalTour.time, disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true },
                Validators.compose([Validators.required, Validators.pattern(Constants.timePattern)])
            ],
            endTime: [
                { value: personalTour.endTime, disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true },
                Validators.compose([Validators.required, Validators.pattern(Constants.timePattern)])
            ],
            assigneeId: [(this.isAdd && !this.userInfo.isSysAdmin()) ? this.userInfo.id : personalTour.assigneeId, Validators.required],
            cc: [(personalTour) ? personalTour.cc : null, Validators.compose([emailChipsValidator])],
            schoolId: [personalTour.schoolId],
            campusId: [
                (this.personalTour.campusId) ?
                    this.personalTour.campusId : (this.campuses.length === 1 ? this.userInfo.mainCampusId :
                        this.userInfo.campusId),
                Validators.compose([Validators.required])
            ],
            location: [
                { value: personalTour.location, disabled: !this.userInfo.isSchoolEditorOrHigher() },
                Validators.compose([
                    Validators.minLength(Constants.requiredTextFieldMinLength),
                    Validators.maxLength(Constants.addressFieldMaxLength),
                    Validators.required
                ])
            ],
            validator: [this.validEndTime, Validators.compose([Validators.requiredTrue])]
        });

        this.loaded = true;
        this.listenToFormChanges();
    }

    protected doSubmit(): Promise<void> {
        const url = (this.formGroup.value.id) ? 'personal-tour/update' : 'personal-tour/add';
        this.setEventDateTime();
        return this.httpService.postAuth(url, this.formGroup.value).then(() => {
            return Promise.resolve();
        });
    }

    timeChanged(timeControl, defaultTime, name) {
        const amazingTimePicker = this.atp.open({
            time: (timeControl.value !== undefined ? timeControl.value : defaultTime),
            theme: 'material-purple'
        });
        this.timePickerSubscription = amazingTimePicker.afterClose().subscribe(time => {
            if (name === 'startTime' && this.formGroup.controls.endTime.value === undefined) {
                defaultTime = Utils.getEndTime(time, Constants.defaultTimeDifferenceInS);
                this.formGroup.controls.endTime.setValue(defaultTime);
            } else if (name === 'startTime' && this.formGroup.controls.endTime.value !== undefined) {
                const timeDifference = Utils.getTimeDifferenceInS(this.formGroup.controls.time.value, this.formGroup.controls.endTime.value);
                defaultTime = Utils.getEndTime(time, timeDifference);
                this.formGroup.controls.endTime.setValue(defaultTime);
            }
            timeControl.setValue(time);
            this.formGroup.markAsDirty();
            this.validEndTime = Utils.startTimeIsBeforeEndTime(
                (this.formGroup && this.formGroup.controls.time.value ? this.formGroup.controls.time.value
                    : defaultTime),
                (this.formGroup && this.formGroup.controls.endTime.value ? this.formGroup.controls.endTime.value
                    : defaultTime));
            this.formGroup.controls['validator'].setValue(this.validEndTime);
        });
    }

    private setEventDateTime() {
        // strip the local timezone info, we just want raw
        const browserDate: string = moment(this.formGroup.controls.date.value).format(Constants.dateFormats.date);
        this.formGroup.controls.date.setValue(browserDate);
    }

    ngOnDestroy() {
        super.ngOnDestroy();

        this.unsubscribe.next();
        this.unsubscribe.complete();

        if (this.timePickerSubscription) {
            this.timePickerSubscription.unsubscribe();
        }
    }

    campusChanged(campusId: number) {
        const campus = _.find(this.campuses, c => c.id === campusId);
        const location = Utils.getLocationByCampus(campus);
        this.formGroup.controls.location.setValue(location);
    }

}
