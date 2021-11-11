import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubscriptionLike as ISubscription } from 'rxjs';

import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';

import { HttpService } from 'app/services/http.service';
import { DataService } from '../../services/data.service';

import { UserInfo } from '../../entities/userInfo';
import { SubTour } from 'app/entities/sub-tour';

import * as _ from 'lodash';
import { AmazingTimePickerService } from 'amazing-time-picker';

declare var $: any;

@Component({
    selector: 'app-edit-sub-tour',
    templateUrl: './edit-sub-tour.component.html'
})
export class EditSubTourComponent implements OnChanges, OnDestroy {

    @Input() subTourId: number;
    @Input() eventId: number;
    @Output() updateSubTour = new EventEmitter();

    userInfo: UserInfo = null;
    title = 'Add Subtour';
    subTourForm: FormGroup;
    loaded = false;
    validEndTime = true;
    promiseForBtn: Promise<any>;
    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    requiredStringFieldMaxLength = Constants.requiredStringFieldMaxLength;

    private timePickerSubscription: ISubscription;

    constructor(
        private fb: FormBuilder,
        private httpService: HttpService,
        private dataService: DataService,
        private atp: AmazingTimePickerService,
    ) {
    }

    ngOnChanges(changes: SimpleChanges) {
        this.userInfo = Utils.getUserInfoFromToken();
        if (this.subTourId) {
            this.title = 'Edit Subtour';
            this.httpService.getAuth(`events/${this.eventId}/sub-tours/${this.subTourId}`).then((res: SubTour) => {
                this.createForm(res);
            }).catch(err => console.log(err));
        } else if (this.subTourId === 0) {
            this.createForm(new SubTour());
        }
    }

    createForm(subTour: SubTour) {
        this.subTourForm = this.fb.group({
            id: [subTour.id],
            name: [
                { value: subTour.name, disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true },
                Validators.compose([
                    Validators.required,
                    Validators.minLength(this.requiredTextFieldMinLength),
                    Validators.maxLength(this.requiredStringFieldMaxLength),
                ])
            ],
            startTime: [
                { value: subTour.startTime, disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true },
                Validators.compose([Validators.required, Validators.pattern(Constants.timePattern)])
            ],
            endTime: [
                { value: subTour.endTime, disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true },
                Validators.compose([Validators.required, Validators.pattern(Constants.timePattern)])
            ],
            maxNumber: [
                { value: subTour.maxNumber, disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true },
                Validators.compose([Validators.required, Validators.pattern(Constants.digitsPattern), Validators.maxLength(10)])
            ],
            isRegistrationDisabled: [{
                value: subTour.isRegistrationDisabled,
                disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true
            }],
            isRegistrationDisabledAutoManaged: [{
                value: subTour.isRegistrationDisabledAutoManaged,
                disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true
            }],
            validator: [this.validEndTime, Validators.compose([Validators.requiredTrue])]
        });
        this.loaded = true;
    }

    timeChanged(timeControl, defaultTime, name) {
        const amazingTimePicker = this.atp.open({
            time: (timeControl.value !== undefined ? timeControl.value : defaultTime),
            theme: 'material-purple'
        });
        this.timePickerSubscription = amazingTimePicker.afterClose().subscribe(time => {
            if (name === 'startTime' && this.subTourForm.controls.endTime.value === undefined) {
                defaultTime = Utils.getEndTime(time, Constants.defaultTimeDifferenceInS);
                this.subTourForm.controls.endTime.setValue(defaultTime)
            } else if (name === 'startTime' && this.subTourForm.controls.endTime.value !== undefined) {
                const timeDifference = Utils.getTimeDifferenceInS(this.subTourForm.controls.startTime.value, this.subTourForm.controls.endTime.value);
                defaultTime = Utils.getEndTime(time, timeDifference)
                this.subTourForm.controls.endTime.setValue(defaultTime)
            }
            timeControl.setValue(time);
            this.subTourForm.markAsDirty();
            this.validEndTime = Utils.startTimeIsBeforeEndTime(
                (this.subTourForm && this.subTourForm.controls.startTime.value ? this.subTourForm.controls.startTime.value
                    : defaultTime),
                (this.subTourForm && this.subTourForm.controls.endTime.value ? this.subTourForm.controls.endTime.value
                    : null))
            this.subTourForm.controls['validator'].setValue(this.validEndTime);
        });
    }

    onSubmit() {
        this.dataService.resetPageDependentData();
        this.submit().then(() => {
            Utils.showSuccessNotification();
            $('#editSubTourModal').modal('hide');
        });
    }

    private submit(): Promise<void> {
        return this.promiseForBtn = new Promise<void>((resolve, reject) => {
            const formData: Object = _.cloneDeep(this.subTourForm.value);

            if (!this.subTourForm.value.id) {
                this.httpService.postAuth(`events/${this.eventId}/sub-tours/`, formData).then(() => {
                    this.updateSubTour.emit();
                    resolve();
                }).catch(err => {
                    console.error(err);
                    reject()
                });
            } else {
                this.httpService.postAuth(`events/${this.eventId}/sub-tours/${this.subTourId}`, formData).then(() => {
                    this.updateSubTour.emit();
                    resolve();
                }).catch(err => {
                    console.error(err);
                    reject()
                });
            }
        });
    }

    disableRegistration(value: boolean) {
        if (value) {
            this.subTourForm.controls.isRegistrationDisabledAutoManaged.setValue(false);
        }
    }

    disableRegistrationAutoManaged(value: boolean) {
        if (value) {
            this.subTourForm.controls.isRegistrationDisabled.setValue(false);
        }
    }

    onCancel() {
        this.loaded = false;
        this.updateSubTour.emit();
        $('#editSubTourModal').modal('hide');
    }

    ngOnDestroy() {
        Utils.disposeModal('#editSubTourModal');
        if (this.timePickerSubscription != null) {
            this.timePickerSubscription.unsubscribe();
        }
    }
}
