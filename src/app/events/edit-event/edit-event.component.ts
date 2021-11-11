import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, SubscriptionLike as ISubscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AmazingTimePickerService } from 'amazing-time-picker';

import { BaseForm } from 'app/base-form';
import { Constants } from '../../common/constants';
import { list_id } from '../../common/enums';
import { Utils, Colors } from '../../common/utils';
import { ResponseMessage } from 'app/common/interfaces';

import { HttpService } from '../../services/http.service';
import { ListenerService } from '../../services/listener.service';
import { LocaleService } from 'app/services/locale.service';
import { DataService } from '../../services/data.service';
import { ErrorMessageService } from '../../services/error-message.service';

import { Event } from '../../entities/event';
import { ListItem } from '../../entities/list-item';
import { Campus } from '../../entities/campus';
import { UserInfo } from '../../entities/userInfo';
import { SubTour } from 'app/entities/sub-tour';

import * as _ from 'lodash';
import * as moment from 'moment';

import { SubTourComponent } from '../sub-tour/sub-tour.component';

@Component({
    selector: 'app-edit-event',
    styleUrls: ['edit-event.component.scss'],
    templateUrl: './edit-event.component.html'
})
export class EditEventComponent extends BaseForm implements OnInit, OnDestroy {

    loaded = false;
    title = 'Event Information';
    userInfo: UserInfo = null;
    isAdd: boolean;
    isDuplicate: boolean;
    eventTime: string = null;
    eventEndTime: string = null;
    eventDate: string = null;

    event: Event = new Event();
    eventTypes: Object[] = [];
    campuses: Campus[] = [];
    campus: Campus;

    currentUrl: string = null;
    eventId: number = null;
    campusId: number = null;

    showIfNoRepresentative = false;
    private locationSubscription: ISubscription;
    private timePickerSubscription: ISubscription;

    validEndTime = true;
    promiseForBtn: Promise<any>;

    noDataInTable = Constants.noDataInTable;
    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    requiredStringFieldMaxLength = Constants.requiredStringFieldMaxLength;
    notRequiredTextFieldMinLength = Constants.notRequiredTextFieldMinLength;
    descriptionTextFieldMaxLength = Constants.descriptionTextFieldMaxLength;
    searchText = '';
    subTourListType: object[] = [
        { id: true, name: 'Yes' },
        { id: false, name: 'No' }
    ];

    private unsubscribe = new Subject();

    @ViewChild(SubTourComponent) subTourComponent;

    constructor(
        private atp: AmazingTimePickerService,
        private fb: FormBuilder,
        private route: ActivatedRoute,
        public router: Router,
        private listenerService: ListenerService,
        private httpService: HttpService,
        private dataService: DataService,
        location: Location,
        private localeService: LocaleService,
        private errorMessageService: ErrorMessageService,
    ) {
        super();
        this.locationSubscription = location.subscribe(() => {
            if (this.userInfo.isSchoolRepresentative()) {
                window.history.forward();
            }
        });
    }

    public ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.currentUrl = this.router.url.split(';')[0];
        this.showIfNoRepresentative = !this.userInfo.isSchoolRepresentative();

        this.route.params.pipe(takeUntil(this.unsubscribe)).subscribe(params => {
            this.eventId = params['eventId'];
            this.campusId = params['campusId'];

            this.isAdd = this.router.url.indexOf('add-event') !== -1;
            this.isDuplicate = this.router.url.indexOf('duplicate') !== -1;

            if (this.isAdd) {
                return this.httpService.postAuth('list-items/getby-categories', [list_id.event]).then((items: ListItem[]) => {
                    return this.httpService.getAuth('campus/with-extra-data').then((data: any) => {
                        this.campuses = _.orderBy(_.filter(data.campuses, c => c.campusType !== Campus.CAMPUS_TYPE_UNDECIDED), ['sequence']);
                        this.campus = _.find(this.campuses, cmp => cmp.id === this.userInfo.campusId);
                        this.eventTypes = items;
                        this.createForm(this.event);
                        this.campusChanged(this.formGroup.controls.campusId.value);
                    });
                });
            } else if (this.isDuplicate) {
                const id = params['id'];
                return this.httpService.getAuth(`events/get-event/${id}`).then((data: any) => {
                    this.eventTypes = data.eventTypeList;
                    this.event = data.event;
                    this.event.date = null;
                    this.event.id = null;
                    this.campuses = _.orderBy(_.filter(data.campuses, c => c.campusType !== Campus.CAMPUS_TYPE_UNDECIDED), ['sequence']);
                    this.campus = _.find(this.campuses, cmp => cmp.id === this.event.campusId);
                    return this.createForm(this.event);
                });
            } else {
                this.loadData();
            }
        });
    }

    loadData() {
        return this.httpService.getAuth('events/get-event/' + this.eventId).then((data: any) => {
            this.event = data.event;
            this.eventTypes = data.eventTypeList;
            this.campuses = _.orderBy(_.filter(data.campuses, c => c.campusType !== Campus.CAMPUS_TYPE_UNDECIDED), ['sequence']);
            this.campus = _.find(this.campuses, cmp => cmp.id === this.event.campusId);
            return this.createForm(this.event);
        }).then(() => {
            if (this.event.isSubToursEnabled && this.userInfo.isSchoolRepresentative()) {
                return this.httpService.getAuth(`events/${this.event.id}/sub-tours`).then((res: SubTour[]) => {
                    this.event.subTours = res;
                });
            }
        }).catch(err => console.log(err));

    }

    ngOnDestroy() {
        super.ngOnDestroy();

        this.unsubscribe.next();
        this.unsubscribe.complete();

        if (this.locationSubscription) {
            this.locationSubscription.unsubscribe();
        }
        if (this.timePickerSubscription) {
            this.timePickerSubscription.unsubscribe();
        }
    }

    onSubmit() {
        this.submit().then(() => {
            this.lastAction();
        }).catch((err) => {
            console.log(err);
        });
    }

    onCancel() {
        super.onCancel();
        this.router.navigate(['/events/list']);
    }

    private lastAction(showNotification = true) {
        if (showNotification) {
            Utils.showSuccessNotification();
        }

        if (this.eventId && this.campusId) {
            Utils.refreshPage(this.router, ['/events/edit-event', { eventId: this.eventId, campusId: this.campusId }]);
        } else {
            this.router.navigate(['/events/list']);
        }
    }

    private createForm(event?: Event) {

        this.formGroup = this.fb.group({
            id: [event.id],
            schoolTourId: [event.schoolTourId, Validators.compose([Validators.required, Validators.pattern(/^((?!null).)*$/)])],
            date: [
                {
                    value: (event.date) ? moment.utc(event.date) : null,
                    disabled: (!event.externalEventId && (this.userInfo.isSchoolEditorOrHigher())) ? false : true
                },
                Validators.compose([Validators.required])
            ],
            time: [
                { value: event.time, disabled: (!event.externalEventId && (this.userInfo.isSchoolEditorOrHigher())) ? false : true },
                Validators.compose([Validators.required, Validators.pattern(Constants.timePattern)])
            ],
            endTime: [
                { value: event.endTime, disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true },
                Validators.compose([Validators.required, Validators.pattern(Constants.timePattern)])
            ],
            maxNumber: [
                { value: event.maxNumber, disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true },
                Validators.compose([Validators.required, Validators.pattern(Constants.digitsPattern), Validators.maxLength(10)])
            ],
            isRegistrationDisabled: [
                { value: event.isRegistrationDisabled, disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true }
            ],
            isRegistrationDisabledAutoManaged: [
                { value: event.isRegistrationDisabledAutoManaged, disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true }
            ],
            description: [
                { value: event.description, disabled: (!event.externalEventId && (this.userInfo.isSchoolEditorOrHigher())) ? false : true },
                Validators.compose([
                    Validators.minLength(this.notRequiredTextFieldMinLength),
                    Validators.maxLength(this.descriptionTextFieldMaxLength)
                ])
            ],
            isSubToursEnabled: [{ value: event.isSubToursEnabled, disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true }],
            isMultipleSubtours: [{ value: event.isMultipleSubtours, disabled: (this.userInfo.isSchoolEditorOrHigher()) ? false : true }],
            campusId: [
                this.event.campusId ?
                    this.event.campusId : (this.campuses.length === 1 ? this.userInfo.mainCampusId : this.userInfo.campusId),
                Validators.compose([Validators.required])
            ],
            location: [
                { value: event.location, disabled: (!event.externalEventId && (this.userInfo.isSchoolEditorOrHigher())) ? false : true },
                Validators.compose([
                    Validators.minLength(this.requiredTextFieldMinLength),
                    Validators.maxLength(this.requiredStringFieldMaxLength),
                    Validators.required
                ])
            ],
            validator: [this.validEndTime, Validators.compose([Validators.requiredTrue])]
        });

        if (this.userInfo.isSchoolRepresentative()) {
            this.eventTime = moment(event.time, Constants.dateFormats.time).format(Constants.dateFormats.timeShort);
            this.eventEndTime = moment(event.endTime, Constants.dateFormats.time).format(Constants.dateFormats.timeShort);
            this.eventDate = this.localeService.transformLocaleDate(event.date, Constants.localeFormats.dateDelimiter);
        }
        this.listenToFormChanges();
        this.formGroup.markAsPristine();
        this.loaded = true;
    }

    protected doSubmit(): Promise<void> {
        if (!this.formGroup.value.id) {
            const data = _.cloneDeep(this.formGroup.value);
            data.date = Utils.formatDate(this.formGroup.controls.date.value); // strip time generated by datepicker
            return this.httpService.postAuth('events/add', data).then(() => {
                return Promise.resolve();
            });
        } else {
            const data: any = _.cloneDeep(this.formGroup.value);
            data.date = Utils.formatDate(this.formGroup.controls.date.value); // strip time generated by datepicker
            return this.httpService.postAuth('events/update', data).then(() => {
                this.listenerService.capacityListChanged();
                return Promise.resolve();
            });
        }
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
                    : null));
            this.formGroup.controls['validator'].setValue(this.validEndTime);
        });
    }

    /**
     * Enables checkin mode
     *
     * It will show an alert if form has some changes and on click to:
     * GO BACK - user will be navigated to fake page with couldGo=false, the alert will be just closed
     * SAVE - the form will be saved first and user will be navigated to fake page with couldGo=true, then to representative page
     * DON'T SAVE - form will not be saved, user will navigate to fake page with couldGo=true, then to representative page
     */
    public enableCheckIn() {
        this.router.navigate(['/dashboard/sendback']).then((couldGo: boolean) => {
            if (couldGo) {
                this.dataService.resetAll();
                this.httpService.postAuth('users/log-in-as-representative/', { eventId: this.eventId }).then(() => {
                    const token = Utils.getToken();
                    this.logout();
                    Utils.setToken(token);
                    this.router.navigate(['/representative/edit-event', { eventId: this.eventId }]);
                });
            }
        });
    }

    logout() {
        Utils.resetSession();
        localStorage.removeItem('token');
        this.router.navigate(['noAuth/login']);
    }

    refreshPage() {
        Utils.refreshPage(this.router, [this.currentUrl, { eventId: this.eventId, campusId: this.campusId }]);
    }

    disableRegistration(value: boolean) {
        if (value) {
            this.formGroup.controls.isRegistrationDisabledAutoManaged.setValue(false);
        }
    }

    disableRegistrationAutoManaged(value: boolean) {
        if (value) {
            this.formGroup.controls.isRegistrationDisabled.setValue(false);
        }
    }

    bookingsUpdated() {
        if (this.event.isSubToursEnabled) {
            this.subTourComponent.updateSubTour();
        }
    }

    updateSubTours(subTours: SubTour[]) {
        this.event.subTours = subTours;
    }

    isMultipleSubtoursChanged(bool: string) {
        if (bool === 'false' && this.eventId) {
            this.httpService.getAuth(`events/check-update-is-valid/${this.eventId}`, false)
                .catch(async (err: ResponseMessage) => {
                    const errMsg: string = await this.errorMessageService.getMessage(err.errorCode, err.errorMessage, err?.params);
                    this.formGroup.controls.isMultipleSubtours.setValue(true);
                    Utils.showNotification(errMsg, Colors.warning);
                });
        }
    }

    campusChanged(campusId: number) {
        campusId = !campusId ? this.userInfo.mainCampusId : campusId;
        const campus = _.find(this.campuses, c => c.id === campusId);
        const location = Utils.getLocationByCampus(campus);
        this.formGroup.controls.location.setValue(location);
    }
}
