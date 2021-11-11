import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { emailValidator } from 'app/validators/email.validator';

import { BaseForm } from 'app/base-form';
import { LocaleService } from 'app/services/locale.service';
import { HttpService } from '../../services/http.service';
import { ListenerService } from '../../services/listener.service';
import { TranslateService } from '@ngx-translate/core';

import { School } from '../../entities/school';
import { ListItem } from '../../entities/list-item';
import { ManagementSystem } from '../../entities/management-system';
import { Country } from '../../entities/country';
import { AdministrativeArea } from '../../entities/administrative-area';
import { UserInfo } from '../../entities/userInfo';
import { TimeZone } from '../../entities/time-zone';

import { Utils } from '../../common/utils';
import { Constants } from '../../common/constants';
import { FormUtils } from '../../common/form-utils';

import { list_id, ManagementSystemCode } from '../../common/enums';
import { IAddressOptions, ISchoolModule } from '../../common/interfaces';

import * as _ from 'lodash';
import * as moment from 'moment';
import { environment } from 'environments/environment';


@Component({
    selector: 'app-add-school',
    templateUrl: './add-school.component.html'
})
export class AddSchoolComponent extends BaseForm implements OnInit, OnDestroy {
    schoolId: number;
    school: School;
    loaded = false;
    title = 'School Information';
    private userInfo: UserInfo = null;
    ListId = list_id; // allow access to enum in html
    genders: ListItem[] = [];
    countries: Country[] = [];
    IntakeClass: number;
    managementSystems: ManagementSystem[] = [];
    administrativeAreas: AdministrativeArea[] = [];
    timeZones: TimeZone[] = [];
    addressOptions: IAddressOptions;
    monthList: string[] = [];

    noItemSelected = Constants.noItemSelected; // show constant string in html
    noCountrySelected = Constants.noCountrySelected; // show constant string in html
    notRequiredTextFieldMinLength = Constants.notRequiredTextFieldMinLength;
    addressFieldMaxLength = Constants.addressFieldMaxLength;
    citySuburbFieldMaxLength = Constants.citySuburbFieldMaxLength;
    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    requiredSchoolNameMaxLength = Constants.requiredSchoolNameMaxLength;
    length50 = Constants.length50;
    emailMaxLength = Constants.emailMaxLength;
    postCodeMinLength = Constants.postCodeMinLength;
    postCodeMaxLength = Constants.postCodeMaxLength;
    localeFormats = Constants.localeFormats;
    phoneErrorText = Constants.phoneErrorText;
    schoolFormat = '-';
    public brand = environment.brand;

    constructor(
        private fb: FormBuilder, private route: ActivatedRoute,
        private router: Router, private httpService: HttpService,
        private listenerService: ListenerService,
        private localeService: LocaleService,
        private translate: TranslateService
    ) {
        super();
    }

    public ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();

        const locale = this.localeService.getCurrentLocale();
        this.translate.use(locale);
        this.schoolId = this.route.params['value'].id;
        const isAdd = this.router.url.indexOf('add-school') !== -1;
        this.monthList = this.getMonthList('en');

        if (isAdd) {
            this.schoolId = 0;
            const url = 'schools/get-school/' + this.schoolId;
            return this.httpService.getAuth(url).then((data: Object) => {
                return this.httpService.get('country/OTHER/address-options').then((addressOptions: IAddressOptions) => {
                    this.addressOptions = addressOptions;
                    this.afterServerRequest(data, new School());
                });
            });
        } else {
            this.schoolId = this.schoolId ? this.schoolId : this.userInfo.schoolId;

            const url = 'schools/get-school/' + this.schoolId;
            return this.httpService.getAuth(url).then((data: Object) => {
                this.school = data['school'] ? data['school'] : new School();
                this.getCountryData(this.school.country.id).then(() => {
                    this.afterServerRequest(data, this.school);
                });
            }).catch(err => {
                console.log(err);
            });
        }
    }

    private afterServerRequest(data: Object, school: School) {
        this.genders = data['genders'];
        this.genders.forEach((element: ListItem & { checked: boolean }) => {
            if (_.find(data['school'].genders, (g: ListItem) => g.id === element.id)) {
                element.checked = true;
            }
        });
        this.managementSystems = _.sortBy(data['managementSystems'], i => _.lowerCase(i.name));
        this.managementSystems.push(..._.remove(this.managementSystems, i => i.id === ManagementSystemCode.na));
        this.countries = data['countries'];
        this.createForm(school);
        this.listenToFormChanges();
        this.loaded = true;
    }

    private createForm(school: School) {
        const formJSON = {
            id: [school.id],
            name: [
                school.name,
                Validators.compose([
                    Validators.required,
                    Validators.minLength(this.requiredTextFieldMinLength), Validators.maxLength(this.requiredSchoolNameMaxLength)
                ])
            ],
            address: [
                school.address,
                Validators.compose([
                    Validators.minLength(this.notRequiredTextFieldMinLength),
                    Validators.maxLength(this.addressFieldMaxLength)
                ])
            ],
            timeZoneId: [school.timeZoneId, Validators.compose([Validators.required])],
            startingMonth: [school.startingMonth, Validators.compose([Validators.required, Validators.min(0), Validators.max(11)])],
            adminName: [
                school.adminName,
                Validators.compose([Validators.minLength(this.requiredTextFieldMinLength), Validators.maxLength(this.length50)])
            ],
            sublocality: [
                school.sublocality,
                Validators.compose([
                    Validators.minLength(this.notRequiredTextFieldMinLength),
                    Validators.maxLength(this.citySuburbFieldMaxLength)
                ])
            ],
            city: [
                school.city,
                Validators.compose([
                    Validators.minLength(this.notRequiredTextFieldMinLength),
                    Validators.maxLength(this.citySuburbFieldMaxLength)
                ])
            ],
            genders: [
                school.genders,
                Validators.compose([])
            ],
            administrativeAreaId: [school.administrativeAreaId],
            countryId: [school.countryId, Validators.compose([Validators.required])],
            postCode: [
                school.postCode,
                Validators.compose([
                    Validators.minLength(this.postCodeMinLength),
                    Validators.maxLength(this.postCodeMaxLength)
                ])
            ],
            phone: [
                school.phone,
                Validators.compose(FormUtils.phoneValidators)
            ],
            email: [
                school.email,
                Validators.compose([emailValidator, Validators.maxLength(this.emailMaxLength)])
            ],
            status: [{ value: (school.status) ? school.status : 'pending', disabled: !this.userInfo.isSysAdmin() }],
            expirationDate: [{
                value: (school.id && school.expirationDate)
                    ? this.localeService.getTransformToLocalDate(school.expirationDate, school.timeZoneId, this.localeFormats.dateTime)
                    : null,
                disabled: !this.userInfo.isSysAdmin()
            }],
            managementSystemId: [school.managementSystemId, Validators.compose([Validators.required])],
            isBoardingEnabled: Boolean(school.isBoardingEnabled),
            hasInternationals: Boolean(school.hasInternationals),
            isSpouseEnabled: Boolean(school.isSpouseEnabled)
        };

        this.formGroup = this.fb.group(formJSON);
    }

    protected doSubmit(): Promise<void> {
        if (this.formGroup.controls.expirationDate.value) {
            const endOfDay: string =
                moment(this.formGroup.controls.expirationDate.value).endOf('day').format(Constants.dateFormats.dateTime);
            const localExpirationDateTime = Utils.getUtcTimeFromLocal(
                endOfDay, Constants.dateFormats.dateTime, this.formGroup.controls.timeZoneId.value, Constants.dateFormats.dateTimeUTC
            );
            this.formGroup.controls.expirationDate.setValue(localExpirationDateTime);
        } else {
            this.formGroup.controls.expirationDate.setValue(null);
        }
        const formData: Object = _.cloneDeep(this.formGroup.value);
        formData['email'] = !this.formGroup.value.email ? null : this.formGroup.value.email;
        FormUtils.cleanupForm(formData);

        if (this.schoolId === 0 && this.userInfo.isSysAdmin()) {
            return this.httpService.postAuth('schools/add-school', formData).then((school: any) => {
                this.schoolId = school.id;
                return this.setUserSchool(this.schoolId);
            });
        } else {
            // fill form data with current modules
            formData['modules'] = this.school.modules;
            return this.httpService.postAuth('schools/update-school', formData).then(() => {
                return Promise.resolve();
            });
        }
    }

    onSubmit() {
        return this.submit().then(() => {
            this.listenerService.schoolListChanged();
            Utils.showSuccessNotification();
            return Utils.refreshPage(this.router, ['/admin/edit-school/' + this.schoolId]);
        }).catch((err) => console.log(err));
    }

    private setUserSchool(newSchoolId: number): Promise<any> {
        return this.httpService.postAuth('users/set-school', { schoolId: newSchoolId }).then(() => {
            this.userInfo = Utils.getUserInfoFromToken();
            this.httpService.updateCurrentSchoolId(newSchoolId);
            this.listenerService.schoolListChanged();
            this.listenerService.campusListChanged();
        });
    }

    onCancel() {
        this.changed = 0;
        this.router.navigate(['/system-admin/schools']);
    }

    onCountryChange(id: string) {
        this.getCountryData(id).then(() => {
            this.formGroup.controls.administrativeAreaId.setValue(null);
            this.formGroup.controls.timeZoneId.setValue(null);
            if (!this.addressOptions.sublocality.isUsed) {
                this.formGroup.controls.sublocality.setValue(null);
            }
        });
    }

    private getCountryData(id: string): Promise<void> {
        return this.httpService.get('country/' + id + '/administrative-areas').then((administrativeAreas: AdministrativeArea[]) => {
            this.administrativeAreas = administrativeAreas;
            return this.httpService.get('country/' + id + '/time-zones').then((timeZones: TimeZone[]) => {
                _.forEach(timeZones, tz => {
                    tz.offset = Utils.getStandardOffset(tz.id);
                });
                this.timeZones = _.orderBy(timeZones, ['offset'], 'asc');
                return this.httpService.get('country/' + id + '/address-options').then((addressOptions: IAddressOptions) => {
                    this.addressOptions = addressOptions;
                    this.schoolFormat = this.localeService.getFormatForLocale(Constants.localeFormats.date, this.localeService.getLocaleByCountryId(id));
                    return Promise.resolve();
                });
            });
        });
    }

    /**
     * Event emitter for modules array of the school
     * @param {Event} changedModules
     * @return {void}
     */
    onModulesChange(changedModules: ISchoolModule[]) {
        if (this.userInfo.isSysAdmin()) {
            this.changed++;
            this.formGroup.markAsDirty();
            this.school.modules = changedModules;
        }
    }

    getMonthList(
        locales?: string | string[],
        format: "long" | "short" = "long"
    ): string[] {
        const year = new Date().getFullYear();
        const monthList = Array.from(Array(12).keys());
        const formatter = new Intl.DateTimeFormat(locales, {
            month: format
        });

        const getMonthName = (monthIndex: number) => formatter.format(new Date(year, monthIndex));

        return monthList.map(getMonthName);
    }

}
