import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter } from '@angular/material/core';
import { ReCaptchaV3Service } from 'ng-recaptcha';

import { emailValidator } from 'app/validators/email.validator';
import { HttpService } from '../../services/http.service';
import { LocaleService } from '../../services/locale.service';
import { ErrorMessageService } from '../../services/error-message.service';

import { Utils } from '../../common/utils';
import { FormUtils } from '../../common/form-utils';
import { IAddressOptions } from '../../common/interfaces';
import { Constants } from '../../common/constants';
import { FormType } from '../../common/enums';

import { WebformBaseDirective } from '../webform-base.directive';
import { DomSanitizer } from '@angular/platform-browser';

import * as _ from 'lodash';

declare var $: any;

@Component({
    selector: 'app-general-form-cmp',
    templateUrl: './general.component.html',
    styleUrls: ['./general.component.scss']
})

export class GeneralFormComponent extends WebformBaseDirective implements OnInit, AfterViewInit, OnDestroy {
    studentInfo: any;

    constructor(
        protected fb: FormBuilder, protected route: ActivatedRoute, protected httpService: HttpService, protected dialog: MatDialog,
        recaptchaV3Service: ReCaptchaV3Service, protected localeService: LocaleService,
        protected dateAdapter: DateAdapter<Date>, sanitizer: DomSanitizer, errorMessageService: ErrorMessageService,
    ) {
        super(httpService, route, dialog, fb, recaptchaV3Service, localeService, dateAdapter, sanitizer, errorMessageService);
    }

    ngOnInit() {
        this.getData('signup-form/get-webform-data').then(() => {
            if (!this.isUnderMaintenance) {
                this.studentInfo = this.getFirstStudentObj();

                this.createContact1Form();
                this.createContact2Form();
                this.createBookingForm();
                this.resetAll = !this.resetAll;
                this.loaded = true;

                this.applyCustomLogo();

                if (this.school.googleTrackingIsEnabled && this.school.googleTrackingId.startsWith('GTM')) {
                   this.dataLayer = window['dataLayer'] = window['dataLayer'] || [];
                   $('head').append(Utils.getGoogleTagManagerHeader(this.school.googleTrackingId));
                   $('body').prepend(Utils.getGoogleTagManagerBody(this.school.googleTrackingId));
                }

                if (!this.preview) {
                    FormUtils.updateDisplay(this.uniqId, FormType.general, this.school.id, this.httpService).catch((err) => {
                        console.log(err);
                    });
                }

                this.generateExtraStyleCssHead();
            }
        });
    }

    public validStudent(event) {
        this.studentInfo = { isValid: event.isValid, formData: (!event.isEmpty) ? event.formData : null };
    }

    protected createContact1Form() {
        const address = _.find(this.signupForm.fieldSettings.contact1.settings, s => s.id === 'address')
        this.contact1Form = this.fb.group({
            firstName: ['', Validators.compose([
                Validators.required,
                Validators.minLength(this.requiredTextFieldMinLength), Validators.maxLength(this.nameMaxLength)
            ])],
            lastName: ['', Validators.compose([
                Validators.required,
                Validators.minLength(this.requiredTextFieldMinLength), Validators.maxLength(this.nameMaxLength)
            ])],
            relationshipId: [null, Validators.compose([Validators.required])],
            email: ['', Validators.compose([Validators.required, emailValidator, Validators.maxLength(Constants.emailMaxLength)])],
            schoolId: [this.school.id],
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
        if (this.isRequiredAddress()) { validatorsAddress.push(Validators.required) }
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
            const validatorsPostCode = [
                Validators.minLength(this.postCodeMinLength),
                Validators.maxLength(this.postCodeMaxLength)
            ];
            this.contact1Form.addControl('sublocality', new FormControl(null, Validators.compose(validatorCitySuburb)));
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
            { id: 'sendProspectusContact2', validators: [] },
            { id: 'alumniId', validators: [] },
            { id: 'graduationYear', validators: [] },
            { id: 'nameAtSchool', validators: [] },
        ], true);
    }

    protected getExtraDataForWebForm(resultData: any): Promise<any> {
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

    protected submitData(): Promise<void> {
        const formData = {
            contact1: this.contact1Form.value,
            contact2: (this.contact2Form.value.firstName && this.contact2Form.value.lastName && this.contact2Form.value.email
                && this.contact2Form.value.relationshipId) ? this.contact2Form.value : null,
            students: [this.studentInfo.formData],
            reCaptcha: this.captchaResponseToken,
            formType: FormType.general,
            booking: this.bookingForm.value,
            uniqId: this.uniqId,
            utmParams: this.setUtmParameters(),
        };
        formData.contact1.receiveMailUpdates = false;

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

        if (formData.booking.hearAboutUsId && (formData.booking.hearAboutUsId < 0)) {
            formData.booking.hearAboutUs = _.find(this.hearAboutUsItems, i => (i.id === formData.booking.hearAboutUsId));
        }

        _.forEach(formData.students, (student) => {
            if (student.currentSchoolId && (student.currentSchoolId < 0)) {
                student.currentSchool = _.find(this.data.currentSchools, i => i.id === student.currentSchoolId);
            }
            if (student.religionId && (student.religionId < 0)) {
                student.religion = _.find(this.data.religions, i => (i.id === student.religionId));
            }
            if (student.specialNeedsReason) {
                const newIds = _.filter(student.specialNeedsReason, id => id < 0);
                if (newIds.length) {
                    student.specialNeeds = _.filter(this.data.specialNeeds, s => _.includes(newIds, s.id));
                }
            }
            if (student.dateOfBirth) {
                student.dateOfBirth = Utils.getDateOnly(student.dateOfBirth);
            }
        });
        return this.submit(formData).then((data: Object) => {
            if (data) {
                this.resetContact2Form();
                this.resetBookingForm();
                this.ptRequestedChanged(false);
                this.submitted = false;
            }
        });
    }

    protected isDataInvalid() {
        return (!this.contact1Form.valid || !this.contact2Valid || !this.studentInfo.isValid);
    }

}
