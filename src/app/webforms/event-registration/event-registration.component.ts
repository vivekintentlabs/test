import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { DateAdapter } from '@angular/material/core';

import { emailValidator } from 'app/validators/email.validator';
import { HttpService } from '../../services/http.service';
import { LocaleService } from '../../services/locale.service';
import { ErrorMessageService } from '../../services/error-message.service';

import { Constants } from '../../common/constants';
import { Utils } from '../../common/utils';
import { FormUtils } from '../../common/form-utils';
import { FormType, LICode, WidgetDataProperty } from '../../common/enums';
import { IAddressOptions, IFieldSetting } from '../../common/interfaces';

import { Event } from '../../entities/event';
import { Booking } from '../../entities/booking';
import { Translation } from '../../entities/translation';
import { Campus } from '../../entities/campus';

import { WebformBaseDirective } from '../webform-base.directive';
import { DomSanitizer } from '@angular/platform-browser';

import * as _ from 'lodash';
import * as moment from 'moment';
import Swal from 'sweetalert2';

declare var $: any;

enum PreSelectedEventState {
    no_preselected_event, // there is no preselected event set by the school for this form
    preselected_id_not_found, // there is a preselected event set by the school for this form, but it cannot be found in the db
    preselected_registration_disabled, // there is a preselected event set by the school for this form, but it's registration is disabled
    valid_preselected_event // there is a preselected event which is being displayed successfully in the form
}

@Component({
    selector: 'app-event-registration-cmp',
    templateUrl: './event-registration.component.html',
    styleUrls: ['./event-registration.component.scss'],
})
export class EventRegistrationComponent extends WebformBaseDirective implements OnInit, AfterViewChecked, OnDestroy, AfterViewInit {
    private readonly studentsNumber = 4;
    students: any = [];
    studentsCount = new Array(5);

    contact2Form: FormGroup;

    private allEventsByCampusId: Map<number, Event[]> = new Map<number, Event[]>();
    events: Event[] = null;
    allEvents: Event[] = null;
    event: Event = null;
    eventCampuses: Campus[] = [];

    booking: Booking = new Booking();

    fieldRequired = Constants.fieldRequired;

    activePill = 1;
    dateFormat: string = Constants.dateFormats.dayMonthYearSlashedNew;

    conducts: Translation[] = null;
    conductTitle = '';
    shouldDisplayConduct = false;

    dateDelimiter = Constants.localeFormats.dateDelimiter;
    isVisibleDescription: boolean;

    subtourRequired = false;
    PreSelectedEventState = PreSelectedEventState; // make enum visible in html
    preselectedEventState = PreSelectedEventState.no_preselected_event;

    registrableEventCount = 0;
    isMultiCampusSchool = false;

    constructor(
        protected fb: FormBuilder, protected route: ActivatedRoute, protected httpService: HttpService,
        private ref: ChangeDetectorRef, protected dialog: MatDialog, recaptchaV3Service: ReCaptchaV3Service,
        protected localeService: LocaleService,
        protected dateAdapter: DateAdapter<Date>, sanitizer: DomSanitizer, errorMessageService: ErrorMessageService,
    ) {
        super(httpService, route, dialog, fb, recaptchaV3Service, localeService, dateAdapter, sanitizer, errorMessageService);
    }

    async ngOnInit() {
        await this.getData('signup-form/get-event-registration-form-data')
        if (this.isUnderMaintenance) {
            return
        }
        this.firstStudentData();

        this.createContact1Form();
        this.createContact2Form();
        this.createBookingForm();
        this.setupAdditionalInitialBookingFormValues();
        this.loaded = true;

        this.applyCustomLogo();

        if (this.school.googleTrackingIsEnabled && this.school.googleTrackingId.startsWith('GTM')) {
            this.dataLayer = window['dataLayer'] = window['dataLayer'] || [];
            $('head').append(Utils.getGoogleTagManagerHeader(this.school.googleTrackingId));
            $('body').prepend(Utils.getGoogleTagManagerBody(this.school.googleTrackingId));
        }

        if (!this.preview) {
            FormUtils.updateDisplay(this.uniqId, FormType.event_registration, this.school.id, this.httpService).catch((err) => {
                console.log(err);
            });
        }

        this.generateExtraStyleCssHead();
    }

    private setupAdditionalInitialBookingFormValues() {
        let campusId: string | number = 'all';
        if (this.registrableEventCount === 1 && this.allEvents.length === 1) {
            // if there is only one registrable event, preselect it
            this.event = _.find(this.allEvents, e => !e.isRegistrationDisabled);
            campusId = this.event.campusId;
        } else if (this.registrableEventCount >= 1) {
            this.event = null; // do not preselect an event
            if (this.isMultiCampusSchool) {
                this.events = this.allEvents;
            } else {
                campusId = this.campuses[0].id;
                this.events = this.allEventsByCampusId.get(campusId as number);
            }
        }
        this.bookingForm.controls.eventCampusId.setValue(campusId);
        this.setEventInitialValues();
    }

    private firstStudentData() {
        for (let i = 1; i <= this.studentsNumber; i++) {
            this.students[i] = this.getFirstStudentObj();
        }
    }

    ngAfterViewChecked() {
        Utils.DetectChanges(this.ref);
    }

    activatePill(i: number) {
        this.activePill = i;
    }

    protected createContact1Form() {
        const address = _.find(this.signupForm.fieldSettings.contact1.settings, s => s.id === 'address');
        this.contact1Form = this.fb.group({
            firstName: ['', Validators.compose([
                Validators.required,
                Validators.minLength(this.requiredTextFieldMinLength),
                Validators.maxLength(this.nameMaxLength)
            ])],
            lastName: ['', Validators.compose([
                Validators.required,
                Validators.minLength(this.requiredTextFieldMinLength),
                Validators.maxLength(this.nameMaxLength)
            ])],
            email: ['', Validators.compose([
                Validators.required,
                emailValidator,
                Validators.maxLength(Constants.emailMaxLength)
            ])],
            schoolId: [this.school.id],
            relationshipId: [null, Validators.compose([Validators.required])],
        });
        FormUtils.addControlsIfIncluded(this.contact1Form, this.signupForm.fieldSettings.contact1.settings, [
            { id: 'mobile', validators: FormUtils.phoneValidators },
            { id: 'homePhone', validators: FormUtils.phoneValidators },
            { id: 'workPhone', validators: FormUtils.phoneValidators },
            { id: 'salutationId', validators: [] },
            { id: 'genderId', validators: [] },
            { id: 'sendProspectus', validators: [] },
            { id: 'personalTourRequested', validators: [] },
            { id: 'alumniId', validators: [] },
            { id: 'graduationYear', validators: [] },
            { id: 'nameAtSchool', validators: [] },
        ]);
        const validatorsAddress = [
            Validators.minLength(this.addressFieldMinLength),
            Validators.maxLength(this.addressFieldMaxLength)
        ];
        if (this.isRequiredAddress()) {
            validatorsAddress.push(Validators.required);
        }
        FormUtils.addAddressControlsIfIncluded(this.contact1Form, this.signupForm.fieldSettings.contact1.settings, address,
            {
                id: 'address', validators: validatorsAddress
            }
        );

        if (this.contact1Form && this.contact1Form.controls.address) {
            const validatorCitySuburb = [
                Validators.minLength(this.addressFieldMinLength),
                Validators.maxLength(this.citySuburbFieldMaxLength)
            ];
            this.contact1Form.addControl('sublocality', new FormControl(null, Validators.compose(validatorCitySuburb)));
            const validatorsPostCode = [
                Validators.minLength(this.postCodeMinLength),
                Validators.maxLength(this.postCodeMaxLength)
            ];
            if (this.isRequiredAddress()) {
                validatorCitySuburb.push(Validators.required);
                validatorsPostCode.push(Validators.required);
                this.contact1Form.controls.countryId.setValidators(Validators.required);
            }
            this.contact1Form.addControl('city', new FormControl(null, Validators.compose(validatorCitySuburb)));
            this.contact1Form.addControl('postCode', new FormControl(null, Validators.compose(validatorsPostCode)));
        }
    }

    createContact2Form() {
        this.contact2Form = this.fb.group({
            firstName: ['', Validators.compose([Validators.minLength(Constants.requiredTextFieldMinLength), Validators.maxLength(40)])],
            lastName: ['', Validators.compose([Validators.minLength(Constants.requiredTextFieldMinLength), Validators.maxLength(40)])],
            email: ['', Validators.compose([emailValidator, Validators.maxLength(Constants.emailMaxLength)])],
            relationshipId: null,
            schoolId: [this.school.id],
        });
        FormUtils.addControlsIfIncluded(this.contact2Form, this.signupForm.fieldSettings.contact2.settings, [
            { id: 'mobile', validators: FormUtils.phoneValidators },
            { id: 'homePhone', validators: FormUtils.phoneValidators },
            { id: 'workPhone', validators: FormUtils.phoneValidators },
            { id: 'salutationId', validators: [] },
            { id: 'genderId', validators: [] },
            { id: 'isSpouse', validators: [] },
            { id: 'sendConfirmationContact2', validators: [] },
            { id: 'alumniId', validators: [] },
            { id: 'graduationYear', validators: [] },
            { id: 'nameAtSchool', validators: [] },
        ], true);
    }

    // Overridden
    protected createBookingForm() {
        if (this.signupForm) {
            this.subtourRequired = this.isRequired(this.signupForm.fieldSettings.eventDetails.settings, 'subTours');
        }

        if (this.bookingForm) {
            this.resetBookingForm();
        } else {
            this.bookingForm = this.fb.group({
                eventId: [null, Validators.compose([Validators.required])],
                totalAttendees: [null, Validators.compose([Validators.pattern(Constants.digitsPattern)])],
                eventCampusId: ['all'],
                subTours: [
                    this.event ? (this.event.isMultipleSubtours ? null : this.getSubTour()) : null,
                    Validators.compose(this.subtourRequired ? [Validators.required] : [])
                ]
            });
            FormUtils.addControlsIfIncluded(this.bookingForm, this.signupForm.fieldSettings.general.settings, [
                { id: 'siblingsId', validators: [] },
                { id: 'hearAboutUsId', validators: [] },
                { id: 'message', validators: [Validators.maxLength(Constants.messageMaxLength)] },
                { id: 'isFirstVisit', validators: [] },
            ]);
        }
    }

    resetBookingForm() {
        super.resetBookingForm();
        this.trigger = null;
    }

    setBookingFormInitialValues() {
        super.setBookingFormInitialValues();
        this.setupAdditionalInitialBookingFormValues();
    }

    protected getExtraDataForWebForm(resultData: any): Promise<any> {
        this.conducts = resultData.conducts;
        // tslint:disable-next-line:max-line-length
        this.conductTitle = Utils.getTranslation(this.conducts, Constants.translationPrefix.fd, Constants.webFormFields.displayConduct, Translation.SUBCATEGORY_GENERAL, Translation.CATEGORY_WEBFORM);
        this.setDisplayConduct();
        this.allEvents = resultData.events;

        // filter the available events based on query params the school provides.
        const filteredForSpecificEvent = this.displaySpecificEvent();
        if (!filteredForSpecificEvent) {
            // only filter by campus code and event code if the school does not want to filter for a specific event
            this.filterByCampusAndEventType();
        }

        this.allEvents = Utils.filterFutureEventPersonalTours(this.allEvents, resultData.campuses) as Event[];
        if (this.eventId) { // if interested in a single event, remove all the other events to pick from
            this.allEvents = _.filter(this.allEvents, (e: Event) => e.id === this.eventId);
        }

        _.forEach(this.allEvents, (e: Event) => {
            e.time = moment(e.time, Constants.dateFormats.time).format(Constants.dateFormats.timeShort);
            const campusId: number = e.campusId;
            let events = this.allEventsByCampusId.get(campusId);
            if (events === undefined) {
                events = new Array<Event>();
                this.allEventsByCampusId.set(campusId, events);
            }
            events.push(e);
        });

        this.registrableEventCount = _.filter(this.allEvents, e => !e.isRegistrationDisabled).length;

        let campuses: Campus[] = _.filter(resultData.campuses, (item: Campus) => item.campusType !== Campus.CAMPUS_TYPE_UNDECIDED);
        this.isMultiCampusSchool = campuses?.length > 1;
        campuses = _.orderBy(campuses, ['sequence'], 'asc');
        _.forEach(_.toArray(this.allEventsByCampusId.keys()), (campusId: number) => {
            const campus = _.find(campuses, (item: Campus) => item.id === campusId);
            this.eventCampuses.push(campus);
        });

        const address = _.find(this.signupForm.fieldSettings.contact1.settings, s => s.id === 'address');
        const countryId = address.defaultValue.defaultContactCountryId || 'OTHER';
        if (countryId !== 'OTHER') {
            return this.getCountryData(countryId);
        } else {
            return this.httpService.get('country/' + countryId + '/address-options').then((addressOptions: IAddressOptions) => {
                this.addressOptions = addressOptions;
                return Promise.resolve();
            });
        }
    }

    /**
     * Check if school wants do display not all events but only a preselected event in the web form.
     * returns true if a specific event is displayed, false otherwise
     */
    private displaySpecificEvent(): boolean {
        let foundSpecificEvent = false;
        // data attributes that the school uses for event filtering are passed to this component as query params in the url.
        if (_.has(this.route.snapshot.queryParams, WidgetDataProperty.data_widget_event_id)) {
            foundSpecificEvent = true;
            const widgetEventId = +this.route.snapshot.queryParams[WidgetDataProperty.data_widget_event_id];
            const event = _.find(this.allEvents, (e: Event) => e.id === widgetEventId);
            if (!event) {
                this.preselectedEventState = PreSelectedEventState.preselected_id_not_found;
            } else {
                this.preselectedEventState = event.isRegistrationDisabled ? PreSelectedEventState.preselected_registration_disabled :
                    PreSelectedEventState.valid_preselected_event;
            }
            // Only interested in this event if we can register
            this.allEvents = this.preselectedEventState === PreSelectedEventState.valid_preselected_event ? [event] : [];
        }
        return foundSpecificEvent;
    }

    private filterByCampusAndEventType() {
        // keep all events that have the campus code set in the query param 'data-widget-campus-code' if that param was set.
        if (_.has(this.route.snapshot.queryParams, WidgetDataProperty.data_widget_campus_code)) {
            const desiredCampusSynCode: string = this.route.snapshot.queryParams[WidgetDataProperty.data_widget_campus_code];
            this.allEvents = _.filter(this.allEvents, (e: Event) => {
                return e.campus?.synCode.toUpperCase() === desiredCampusSynCode.toUpperCase()
            });
        }
        // keep all events that have the event type set in the query param 'data-widget-event-type' if that param was set.
        if (_.has(this.route.snapshot.queryParams, WidgetDataProperty.data_widget_event_type)) {
            const desiredEventType: string = this.route.snapshot.queryParams[WidgetDataProperty.data_widget_event_type];
            this.allEvents = _.filter(this.allEvents,
                (e: Event) => e.schoolTour?.synCode?.toUpperCase() === desiredEventType.toUpperCase());
        }
    }

    validStudent(event) {
        this.students[event.studNumber] = {
            isValid: event.isValid,
            formData: (!event.isEmpty) ? event.formData : null
        };
    }

    public setDisplayConduct() {
        const conductSettings = _.find(this.signupForm.fieldSettings.general.settings, (s: IFieldSetting) => s.id === 'displayConduct');
        this.shouldDisplayConduct = Boolean(conductSettings.isIncluded);
        if (this.shouldDisplayConduct) {
            this.transformText();
        }
    }

    protected submitData(): Promise<void> {
        const formData = {
            contact1: this.contact1Form.value,
            contact2: (this.contact2Form.value.firstName && this.contact2Form.value.lastName && this.contact2Form.value.email
                && this.contact2Form.value.relationshipId) ? this.contact2Form.value : null,
            students: [],
            booking: this.bookingForm.value,
            reCaptcha: this.captchaResponseToken,
            formType: FormType.event_registration,
            campusId: this.event.campusId,
            uniqId: this.uniqId,
            leadSourceId: this.eventId ? (_.find(this.leadSources, ls => ls.code === LICode.in_person)).id : null,
            utmParams: this.setUtmParameters(),
        };
        if (this.shouldDisplayConduct) {
            formData.booking.conductAgreed = this.trigger;
        }

        if (formData.contact1.administrativeAreaId < 0) {
            formData.contact1.administrativeArea = _.find(this.administrativeAreas, s => (
                s.id === formData.contact1.administrativeAreaId
            ));
        }
        if (formData.contact1.countryId < 0) {
            formData.contact1.country = _.find(this.countries, c => c.id === formData.contact1.countryId);
        }
        if (formData.contact1.relationshipId < 0) {
            formData.contact1.relationship = _.find(this.relationships, r => r.id === formData.contact1.relationshipId);
        }
        if (formData.contact2 && formData.contact2.relationshipId < 0) {
            formData.contact2.relationship = _.find(this.relationships, r => r.id === formData.contact2.relationshipId);
        }
        if (formData.contact1.salutationId < 0) {
            formData.contact1.salutation = _.find(this.salutations, r => r.id === formData.contact1.salutationId);
        }
        if (formData.contact2 && formData.contact2.salutationId < 0) {
            formData.contact2.salutation = _.find(this.salutations, r => r.id === formData.contact2.salutationId);
        }
        if (formData.contact1.ptDate) {
            formData.contact1.ptDate = Utils.getDateOnly(formData.contact1.ptDate);
        }

        formData.booking.subTours = this.bookingForm.controls.subTours.value
            ? (this.event.isMultipleSubtours
                ? this.bookingForm.controls.subTours.value
                : [this.bookingForm.controls.subTours.value])
            : [];
        if (formData.booking.hearAboutUsId && (formData.booking.hearAboutUsId < 0)) {
            formData.booking.hearAboutUs = _.find(this.hearAboutUsItems, i => (i.id === formData.booking.hearAboutUsId));
        }

        _.forEach(this.students, (student) => {
            if (student && _.has(student, 'formData')) {
                if (student.formData) {
                    if (student.formData.currentSchoolId && (student.formData.currentSchoolId < 0)) {
                        student.formData.currentSchool =
                            _.find(this.data.currentSchools, i => (i.id === student.formData.currentSchoolId));
                    }
                    if (student.formData.religionId && (student.formData.religionId < 0)) {
                        student.formData.religion = _.find(this.data.religions, i => (i.id === student.formData.religionId));
                    }
                    if (student.formData.specialNeedsReason) {
                        const newIds = _.filter(student.formData.specialNeedsReason, id => id < 0);
                        if (newIds.length) {
                            student.formData.specialNeeds = _.filter(this.data.specialNeeds, s => _.includes(newIds, s.id));
                        }
                    }
                    if (student.formData.dateOfBirth) {
                        student.formData.dateOfBirth = Utils.getDateOnly(student.formData.dateOfBirth);
                    }
                    formData.students.push(student.formData);
                }
            }
        });

        return this.submit(formData).then((data: object) => {
            if (data) {
                this.resetContact2Form();
                this.createBookingForm();
                this.activePill = 1;
                this.submitted = false;
            }
            if (this.eventId) {
                Swal.fire({
                    title: 'Successfully Submitted!',
                    type: 'success',
                    confirmButtonClass: 'btn btn-success',
                    buttonsStyling: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                }).then((result) => {
                    if (result && result.value) {
                        window.close();
                    }
                });
            }
        });
    }

    eventChanged(eventId: number | null) {
        this.event = _.find(this.events, (e: Event) => e.id === eventId);
        this.setEventInitialValues();
    }

    private setEventInitialValues() {
        this.isVisibleDescription = this.isVisibleEventDescription();
        this.bookingForm.controls.eventId.setValue((this.event) ? this.event.id : null);
        this.bookingForm.controls.subTours.setValue(this.event ? this.event.isMultipleSubtours ? null : this.getSubTour() : null);
        this.bookingForm.controls.subTours.setValidators(this.getValidatorRequired());
        this.bookingForm.controls.subTours.updateValueAndValidity();
    }

    campusChanged(campusId) {
        this.events = (campusId === 'all') ? this.allEvents : this.allEventsByCampusId.get(campusId);
        this.eventChanged(null);
    }

    getSubTour() {
        return _.find(this.event.subTours, s => s.isRegistrationDisabled === false);
    }

    public changeTrigger() {
        this.trigger = !this.trigger;
    }

    public transformText() {
        const text = Utils.getTranslation(
            this.conducts,
            Constants.translationPrefix.fl,
            Constants.webFormFields.displayConduct,
            Translation.SUBCATEGORY_GENERAL,
            Translation.CATEGORY_WEBFORM
        );
        this.conductText = Utils.replaceTag(text, '&lt; SCHOOL NAME &gt;', this.school ? this.school.name : '');
    }

    protected isDataInvalid() {
        return (
            !this.contact1Form.valid || !this.contact2Valid || !this.students[1].isValid || !this.students[2].isValid ||
            !this.students[3].isValid || !this.students[4].isValid || !this.bookingForm.valid
        );
    }

    isVisibleEventDescription() {
        const settings = _.find(this.signupForm.fieldSettings.eventDetails.settings, s => s.id === 'description');
        return settings.isIncluded && this.event && this.event.description && this.event.description.length >= 4;
    }

    getValidatorRequired() {
        return (
            this.isRequired(this.signupForm.fieldSettings.eventDetails.settings, 'subTours') &&
            (this.event && this.event.isSubToursEnabled && !_.isEmpty(this.event.subTours))
        ) ? [Validators.required] : [];
    }
}
