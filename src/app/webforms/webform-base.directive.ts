import { AfterViewInit, Directive, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { ReCaptchaV3Service } from 'ng-recaptcha';

import { HttpService } from '../services/http.service';
import { LocaleService } from '../services/locale.service';
import { ErrorMessageService } from '../services/error-message.service';

import { FormType, LICode, list_id, OperationMode } from 'app/common/enums';
import { Colors, Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { FormUtils } from 'app/common/form-utils';
import { AddListItemCmpData, IAddressOptions, IFieldSetting, UtmParam } from 'app/common/interfaces';
import { T as translation } from 'app/common/t';

import { Setting } from 'app/entities/setting';
import { School } from 'app/entities/school';
import { Campus } from 'app/entities/campus';
import { ListItem } from 'app/entities/list-item';
import { Webform } from 'app/entities/webform';
import { YearLevelList } from 'app/entities/year-level-list';
import { Style } from 'app/entities/style';
import { Translation } from 'app/entities/translation';
import { Country } from 'app/entities/country';
import { AdministrativeArea } from 'app/entities/administrative-area';

import { AddStudentComponent } from './add-student/add-student.component';
import { DomSanitizer } from '@angular/platform-browser';

import * as _ from 'lodash';
import { environment } from 'environments/environment';

import * as urlParse from 'url-parse';

declare var $: any;

@Directive()
export abstract class WebformBaseDirective implements AfterViewInit, OnDestroy {
    public brand = environment.brand;
    public isUnderMaintenance = false;
    public readonly underMaintenanceMsg = translation.underMaintenanceMsgForForms;

    contact1Form: FormGroup;
    contact2Form: FormGroup;
    bookingForm: FormGroup;
    @ViewChildren(AddStudentComponent) private addStudentComponents: QueryList<AddStudentComponent>;

    contact2Valid = true;

    protected uniqId = '';
    school: School = null;
    protected mainCampus: Campus = null;
    signupForm: Webform = null;
    protected captchaResponseToken: string = null;

    campuses: Campus[] = [];
    salutations: ListItem[] = [];
    leadSources: ListItem[] = [];
    hearAboutUsItems: ListItem[] = [];
    relationships: ListItem[] = [];
    yearLevelList: YearLevelList;
    translations: Translation[] = [];

    alumni: ListItem[] = [];
    siblings: ListItem[] = [];
    yesAlumniId: number;
    noAlumniId: number;
    graduationYears: number[] = [];

    protected addListItemData: AddListItemCmpData;

    promiseForBtn: Promise<any>;

    noItemSelected = Constants.noItemSelected;
    phoneErrorText = Constants.phoneErrorText;
    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    nameMaxLength = Constants.nameMaxLength;
    conductText = '';
    data = null;
    dataLayer = null;
    triggerForAddStudent = false;
    trigger = null;
    triggerOtherRelationship = false;
    triggerOtherReligion = false;
    triggerOtherHearAboutUs = false;
    triggerSalutation = false;
    triggerOtherCurrentSchool = false;
    triggerOtherSpecialNeeds = false;

    // default footer logo
    loadedLogo = this.sanitizer.bypassSecurityTrustHtml(`Powered by <img src="/assets/img/company-logo.png" alt="${this.brand.companyName}" >`);

    listId = list_id;
    resetAll = false;
    reset = false;
    private timeOut = true;
    submitted = false;
    preview = false;
    loaded = false;
    public eventId;

    public administrativeAreas: AdministrativeArea[] = [];
    public countries: Country[] = [];
    public addressOptions: IAddressOptions;
    public noCountrySelected = Constants.noCountrySelected;

    public addressFieldMinLength = Constants.notRequiredTextFieldMinLength;
    public addressFieldMaxLength = Constants.addressFieldMaxLength;
    public postCodeMinLength = Constants.postCodeMinLength;
    public postCodeMaxLength = Constants.postCodeMaxLength;
    public citySuburbFieldMaxLength = Constants.citySuburbFieldMaxLength;
    public fieldRequired = Constants.fieldRequired;
    public messageMaxLength = Constants.messageMaxLength;
    private componentDestroyed = new Subject();

    currentDate = new Date();

    grecptchaTermsHtml = `
        <div class="grecaptcha-terms">
            This site is protected by reCAPTCHA and the Google <br>
            <a href="https://policies.google.com/privacy">Privacy Policy</a> and
            <a href="https://policies.google.com/terms">Terms of Service</a> apply.
        </div>
    `;

    constructor(
        protected httpService: HttpService,
        protected route: ActivatedRoute,
        protected dialog: MatDialog,
        protected fb: FormBuilder,
        protected recaptchaV3Service: ReCaptchaV3Service,
        protected localeService: LocaleService,
        protected dateAdapter: DateAdapter<Date>,
        private sanitizer: DomSanitizer,
        private errorMessageService: ErrorMessageService,
    ) {
    }

    ngAfterViewInit() {
        this.setBackgroundColor();
        Utils.onElementHeightChange(document.body, this.route.snapshot.queryParams['idOnPage'] || '');
    }

    private checkIfUnderMaintenance(): Promise<void> {
        return this.httpService.get('login-info').then((operationMode: Setting) => {
            this.isUnderMaintenance = (
                operationMode.intValue === OperationMode.Maintenance ||
                operationMode.intValue === OperationMode.Maintenance_with_cronJobs
            );
            return Promise.resolve();
        });
    }

    protected async getData(url: string): Promise<void> {
        await this.checkIfUnderMaintenance();
        if (this.isUnderMaintenance) {
            return;
        }
        Utils.prepareIframeIos();
        this.uniqId = this.route.snapshot.params['id'] || null;
        this.preview = ((this.route.snapshot.queryParams['preview'] === 'true')) || false;
        this.eventId = +this.route.snapshot.queryParams['eventId'] || null;
        return this.getDataForSchoolWebForm(url, this.uniqId);
    }

    private async getDataForSchoolWebForm(url: string, uniqId: string): Promise<any> {
        const schoolData: any = await this.httpService.post(url, { uniqId });
        if (!schoolData) {
            throw new Error('No school data');
        }

        this.signupForm = schoolData.webform;
        this.school = schoolData.school;
        this.salutations = _.filter(schoolData.listItems, i => i.listId === list_id.contact_salutation);
        this.alumni = _.filter(schoolData.listItems, i => i.listId === list_id.alumni);
        this.siblings = _.filter(schoolData.listItems, i => i.listId === list_id.siblings);
        this.yesAlumniId = _.find(this.alumni, a => a.code === LICode.alumni_yes).id;
        this.noAlumniId = _.find(this.alumni, a => a.code === LICode.alumni_no).id;
        this.graduationYears = Utils.getCurrentAndPastYears(Constants.durationGraduationYear);
        this.relationships = Utils.getIncludedInList(
            _.filter(schoolData.listItems, i => i.listId === list_id.contact_relationship), []
        );
        this.hearAboutUsItems = _.filter(schoolData.listItems, i => i.listId === list_id.hear_about_us);
        this.leadSources = _.filter(schoolData.listItems, i => i.listId === list_id.lead_source);
        this.campuses = schoolData.campuses;
        _.orderBy(schoolData.campuses, ['sequence'], 'asc');
        this.mainCampus = _.find(this.campuses, c => c.campusType === Campus.CAMPUS_TYPE_MAIN);
        this.yearLevelList = new YearLevelList(schoolData.yearLevels);
        this.translations = schoolData.translations;
        const minStartingYear: number = Utils.getStartingYear(this.school.startingMonth);

        this.data = {
            school: this.school,
            campuses: schoolData.campuses,
            countries: schoolData.countries,
            startingYears: Utils.getStartingYears(minStartingYear),
            currentSchools: Utils.getIncludedInListCurrentSchools(
                schoolData.currentSchools, [], this.school.currentSchoolDisplayOther
            ),
            fieldSettings: this.signupForm.fieldSettings.student.settings,
            boardingTypes: _.filter(schoolData.listItems, i => i.listId === list_id.boarding_type),
            genders: _.filter(schoolData.listItems, i => i.listId === list_id.genders),
            religions: _.filter(schoolData.listItems, i => i.listId === list_id.religion),
            specialNeeds: _.filter(schoolData.listItems, i => i.listId === list_id.special_need),
            otherInterests: _.filter(schoolData.listItems, i => i.listId === list_id.other_interest),
            translations: schoolData.translations,
        };
        const locale = this.localeService.getCurrentLocale(this.school.countryId);
        this.dateAdapter.setLocale(locale);

        return this.getExtraDataForWebForm(schoolData);

    }

    protected abstract getExtraDataForWebForm(resultData: any): Promise<any>;

    protected generateExtraStyleCssHead() {
        const head = document.getElementsByTagName('head')[0];
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', `${Constants.noauthUrl}/style/additional-css/${this.school.id}`);
        head.appendChild(link);
    }

    protected applyCustomLogo(): Promise<any> {
        return this.httpService.get('style/footer-logo/' + this.school.id).then((style: Style) => {
            if (style?.value) {
                this.loadedLogo = this.sanitizer.bypassSecurityTrustHtml(style.value);
            }
        });
    }

    protected getFirstStudentObj() {
        return { isValid: true, formData: null };
    }

    getFieldLabel(id: string, subCategory) {
        return Utils.getTranslation(this.translations, Constants.translationPrefix.fl, id, subCategory, Translation.CATEGORY_WEBFORM);
    }

    getFieldDescription(fieldSetting: IFieldSetting, subCategory: string) {
        return Utils.getTranslation(
            this.translations, Constants.translationPrefix.fd, fieldSetting.id, subCategory, Translation.CATEGORY_WEBFORM
        );
    }

    captchaResponse(event) {
        this.captchaResponseToken = event;
        this.timeOut = false;
        setTimeout(() => {
            this.timeOut = true;
        }, 120000);
    }

    protected abstract createContact1Form(): void;

    private setContact1FormValues(): Promise<void> {
        const address = _.find(this.signupForm.fieldSettings.contact1.settings, s => s.id === 'address');
        FormUtils.setValues(this.contact1Form, this.signupForm.fieldSettings.contact1.settings);
        this.contact1Form.controls.schoolId.setValue(this.school.id);
        const defaultCountryId = address ? address.defaultValue['defaultContactCountryId'] : null;
        this.ptRequestedChanged(false);
        if (!defaultCountryId) {
            return Promise.resolve();
        }
        return this.onCountryChange(defaultCountryId).then(() => {
            if (this.contact1Form && this.contact1Form.controls.address) {
                this.contact1Form.controls.countryId.setValue(defaultCountryId);
            }
        });
    }

    protected resetContact1Form() {
        this.contact1Form.reset();
        this.setContact1FormValues();
    }

    protected createBookingForm() {
        this.bookingForm = this.fb.group({});
        FormUtils.addControlsIfIncluded(this.bookingForm, this.signupForm.fieldSettings.general.settings, [
            { id: 'siblingsId', validators: [] },
            { id: 'hearAboutUsId', validators: [] },
            { id: 'message', validators: [Validators.maxLength(this.messageMaxLength)] },
        ]);
    }

    protected abstract isDataInvalid();

    /**
     * Check to make sure everything is fine before attempting to submit
     */
    protected ifSubmitDataIsValid(displayConductCondition = false, conductTitle = '') {
        this.submitted = true;
        if (this.preview) {
            Utils.showNotification(Constants.formResponses.previewMode, Colors.warning, 'bottom', 'center');
            return false;
        } else if (this.isDataInvalid()) {
            FormUtils.markFormGroupTouched(this.contact1Form);
            FormUtils.markFormGroupTouched(this.bookingForm);
            this.addStudentComponents.map(components => FormUtils.markFormGroupTouched(components.studentForm));
            Utils.showNotification(Constants.formResponses.invalidRequiredFields, Colors.danger, 'bottom', 'center');
            return false;
        } else if (displayConductCondition) {
            // if event registration form: else if (this.shouldDisplayConduct && this.conduct.displayConduct && !this.trigger) {
            Utils.showNotification(
                Constants.formResponses.acceptCodeOfConduct({ codeOfConductTitle: conductTitle }),
                Colors.danger, 'bottom', 'center'
            );
            return false;
        }
        return true;
    }

    onSubmit(displayConductCondition = false, conductTitle = ''): Promise<void> {
        if (this.ifSubmitDataIsValid(displayConductCondition, conductTitle)) {
            return this.promiseForBtn = this.recaptchaV3Service.execute(FormType[this.signupForm.formType]).toPromise()
                .then((token) => {
                    this.captchaResponseToken = token;
                    return this.submitData();
                });
        } else {
            setTimeout(() => this.promiseForBtn = Promise.resolve());
        }
    }

    protected abstract submitData(): Promise<void>;

    protected submit(formData: object): Promise<object | null> {
        return this.httpService.post('signup-form/submit-data-for-school', formData, false).then((data) => {
            if (data) {
                const formSubmissionMessage = Utils.getFormSubmissionMessage();
                Utils.showNotification(formSubmissionMessage, Colors.success, 'bottom', 'center');
                this.resetContact1Form();
                this.reset = !this.reset;
                this.resetAll = !this.resetAll;
                this.captchaResponseToken = null;

                Utils.removeCustomItems([
                    this.relationships, this.data.religions, this.data.currentSchools,
                    this.hearAboutUsItems, this.salutations, this.data.specialNeeds
                ]);

                if (this.dataLayer && this.school.googleTrackingIsEnabled && this.school.googleTrackingId.startsWith('GTM')) {
                    this.dataLayer.push({ event: this.signupForm.googleTrackingEventName });
                }
            }
            this.submitted = true;
            return Promise.resolve(data);
        }).catch(async (error) => {
            console.log(error);
            this.captchaResponseToken = null;
            this.reset = !this.reset;
            this.submitted = false;
            const errMsg: string = await this.errorMessageService.getMessage(error.errorCode, error.errorMessage, error?.params);
            Utils.showNotification(errMsg, Colors.danger, 'bottom', 'center');
            return Promise.reject();
        });
    }

    resetContact2Form() {
        this.contact2Form.reset();
        this.setContact2FormValues();
    }

    setContact2FormValues() {
        FormUtils.setValues(this.contact2Form, this.signupForm.fieldSettings.contact2.settings);
        this.contact2Form.controls.schoolId.setValue(this.school.id);
    }

    resetBookingForm() {
        this.bookingForm.reset();
        this.setBookingFormInitialValues();
    }

    protected setBookingFormInitialValues() {
        FormUtils.setValues(this.bookingForm, this.signupForm.fieldSettings.general.settings);
    }

    public isRequired(settings: IFieldSetting[], fieldId: string): boolean {
        return FormUtils.isRequired(settings, fieldId);
    }

    public showHint(control) {
        return (control.value && +control.value.length > Constants.almostFullMessageField) ? true : false;
    }

    public isRequiredAddress(): boolean {
        if (this.contact1Form && this.contact1Form.controls.address) {
            return FormUtils.isRequired(this.signupForm.fieldSettings.contact1.settings, 'address');
        } else {
            return false;
        }
    }

    protected setBackgroundColor() { // ET-356 just to make background-color white for signupFormComponents
        $('body').css('background-color', '#fff');
    }

    public getCountryData(id: string): Promise<void> {
        return Promise.all([
            this.httpService.get('country/' + id + '/administrative-areas').then((administrativeAreas: AdministrativeArea[]) => {
                this.administrativeAreas = administrativeAreas;
            }),
            this.httpService.get('country/' + id + '/address-options').then((addressOptions: IAddressOptions) => {
                this.addressOptions = addressOptions;
            })
        ]).then(() => Promise.resolve());
    }

    protected onCountryChange(id: string): Promise<void> {
        return this.getCountryData(id).then(() => {
            if (this.contact1Form && this.contact1Form.controls.address) {
                if (this.addressOptions.state.isUsed) {
                    const address = _.find(this.signupForm.fieldSettings.contact1.settings, s => s.id === 'address');
                    const defaultContactAdministrativeAreaId = address ? address.defaultValue['defaultContactAdministrativeAreaId'] : null;
                    this.contact1Form.controls.administrativeAreaId.setValue(defaultContactAdministrativeAreaId);
                } else {
                    this.contact1Form.controls.administrativeAreaId.setValue(null);
                }
                if (!this.addressOptions.sublocality.isUsed) {
                    this.contact1Form.controls.sublocality.setValue(null);
                }
            }
        });
    }

    Contact2IsValid() {
        if (this.signupForm.fieldSettings.contact2.isIncluded) {
            const values = [];

            _.forEach(this.signupForm.fieldSettings.contact2.settings, setting => {
                if (setting.isRequired && setting.isIncluded) {
                    values.push(!!(this.contact2Form.controls[setting.id].value));
                }
            });
            // to be valid _.uniq(values) should have only true or false
            // it will say all the required fields are filled in or all of them are empty
            this.contact2Valid = (_.uniq(values).length === 1 && this.contact2Form.valid) ? true : false;
        }
    }

    public updateLists(event) { // if we add an other listitem for contact1 we also need to add it for contact2
        if (event && event.listId === list_id.contact_relationship) {
            this.relationships.push(event.listItem);
            this.triggerOtherRelationship = !this.triggerOtherRelationship;
        }
        if (event && event.listId === list_id.religion) {
            this.data.religions.push(event.listItem);
            this.triggerOtherReligion = !this.triggerOtherReligion;
        }
        if (event && event.listId === list_id.hear_about_us) {
            this.hearAboutUsItems.push(event.listItem);
            this.triggerOtherHearAboutUs = !this.triggerOtherHearAboutUs;
        }
        if (event && event.listId === list_id.contact_salutation) {
            this.salutations.push(event.listItem);
            this.triggerSalutation = !this.triggerSalutation;
        }
        if (event && event.listId === list_id.special_need) {
            event.listItem.includeInList = true;
            this.data.specialNeeds.push(event.listItem);
            this.triggerOtherSpecialNeeds = !this.triggerOtherSpecialNeeds;
        }
        if (event && event.schoolName) {
            this.data.currentSchools.push(event);
            this.triggerOtherCurrentSchool = !this.triggerOtherCurrentSchool;
        }
        setTimeout(() => {
            this.Contact2IsValid();
        }, 0);
    }

    protected ptRequestedChanged(isRequested: boolean) {
        if (isRequested) {
            this.contact1Form.addControl('ptDate', new FormControl(null, Validators.required));
        } else {
            this.contact1Form.removeControl('ptDate');
        }
    }

    alumniChanged(contactEditForm: FormGroup) {
        if (contactEditForm.controls.alumniId.value === this.noAlumniId) {
            contactEditForm.controls.graduationYear.setValue(null);
            if (contactEditForm.controls.nameAtSchool) {
                contactEditForm.controls.nameAtSchool.setValue(null);
            }
        }
    }

    protected setUtmParameters(): UtmParam[] {
        const utmParams = _.pickBy(new urlParse(document.referrer, true).query, (v, k) => _.startsWith(k, 'utm_'));
        return _.map(utmParams, (val, key) => ({
            param: key,
            value: val
        }));
    }

    ngOnDestroy() {
        this.componentDestroyed.next();
        this.componentDestroyed.complete();
    }

}
