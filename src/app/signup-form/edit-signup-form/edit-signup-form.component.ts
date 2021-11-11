import { Component, AfterViewInit, OnDestroy, ViewChild, HostListener, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators, NgForm } from '@angular/forms';
import { BaseForm } from 'app/base-form';
import { HttpService } from '../../services/http.service';

import { Utils, Colors } from '../../common/utils';
import { Constants } from '../../common/constants';
import { IAddressOptions, IFieldSettingsSection, IFieldSetting } from 'app/common/interfaces';
import { FormType, ErrorCode } from '../../common/enums';

import { Webform } from '../../entities/webform';
import { AdministrativeArea } from 'app/entities/administrative-area';
import { Country } from 'app/entities/country';
import { ListItem } from 'app/entities/list-item';
import { Translation } from 'app/entities/translation';
import { UserInfo } from 'app/entities/userInfo';

import * as _ from 'lodash';
import * as copy from 'copy-to-clipboard';

@Component({
    selector: 'app-edit-signup-form',
    templateUrl: 'edit-signup-form.component.html',
    styleUrls: ['edit-signup-form.component.scss']
})

export class EditSignupFormComponent extends BaseForm implements AfterViewInit, OnDestroy {
    @ViewChild('translationForm') translationForm: NgForm;
    isSticky = false;

    @ViewChild('cell1') cell1: ElementRef;
    @ViewChild('cell2') cell2: ElementRef;
    @ViewChild('cell3') cell3: ElementRef;
    @ViewChild('cell4') cell4: ElementRef;
    @ViewChild('cell5') cell5: ElementRef;
    @ViewChild('cellh1') cellh1: ElementRef;
    @ViewChild('cellh2') cellh2: ElementRef;
    @ViewChild('cellh3') cellh3: ElementRef;
    @ViewChild('cellh4') cellh4: ElementRef;
    @ViewChild('cellh5') cellh5: ElementRef;

    signupForm: Webform;
    loaded = false;
    signupFormId: number;
    iframeCode = '';
    fType = FormType;
    noItemSelected = Constants.noItemSelected;
    noCountrySelected = Constants.noCountrySelected;
    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    length50 = Constants.length50;

    administrativeAreas: AdministrativeArea[];
    tempFieldSettings: IFieldSettingsSection[] = [];
    countries: Country[];
    addressOptions: IAddressOptions;
    leadSources: ListItem[];
    boardingTypes: ListItem[];
    translations: Translation[];
    userInfo: UserInfo;

    triggerForAddListItem = false;
    promiseForBtn: Promise<any>;

    constructor(private httpService: HttpService, private fb: FormBuilder, private router: Router, private route: ActivatedRoute) {
        super();
    }

    public ngAfterViewInit() {
        // needed because Perfect Scrollbar library hides scroll events (and Perfect Scroll does not work on Mac)
        if (!Utils.isMac()) {
            const elemMainPanel = document.querySelector('.main-panel') as HTMLElement;
            elemMainPanel.addEventListener('ps-scroll-y', (event: Event) => {
                const target: HTMLElement & Document = event.target as HTMLElement & Document;
                this.stickyCheckHeader(target.scrollTop);
            });
        }
        this.signupFormId = this.route.params['value'].id;
        this.userInfo = Utils.getUserInfoFromToken();
        this.getData();
    }

    private getData(): Promise<void> {
        return this.httpService.getAuth('webform/get/' + this.signupFormId).then((res: {
            webform: Webform, data: { leadSources: ListItem[], boardingTypes: ListItem[], countries: Country[] }
        }) => {
            this.signupForm = res.webform;
            this.leadSources = res.data.leadSources;
            this.boardingTypes = res.data.boardingTypes;
            this.getTemporaryFieldSettings();
            this.countries = res.data.countries;
            const address = _.find(this.signupForm.fieldSettings.contact1.settings, s => s.id === 'address');
            const countryId = address ? address.defaultValue.defaultContactCountryId || 'OTHER' : null;
            return this.httpService.get('country/' + countryId + '/address-options').then((addressOptions: IAddressOptions) => {
                this.addressOptions = addressOptions;
            }).then(() => {
                if (countryId !== 'OTHER') {
                    return this.getCountryData(countryId);
                }
            }).then(() => {
                return this.httpService.getAuth('translation').then((translations: Translation[]) => {
                    this.translations = translations;
                    this.createForm();
                });
            });
        });
    }

    private createForm() {
        this.formGroup = this.fb.group({
            id: [this.signupForm.id],
            name: [
                this.signupForm.name,
                Validators.compose([
                    Validators.required,
                    Validators.minLength(this.requiredTextFieldMinLength),
                    Validators.maxLength(this.length50)
                ])
            ],
            display: [this.signupForm.display],
            submission: [this.signupForm.submission],
            formType: [this.signupForm.formType],
            schoolId: [this.signupForm.schoolId],
            googleTrackingEventName: [
                this.signupForm.googleTrackingEventName,
                Validators.compose([
                    Validators.required,
                    Validators.minLength(this.requiredTextFieldMinLength),
                    Validators.maxLength(this.length50)
                ])
            ],
        });

        this.iframeCode = Utils.getIframe(1, this.signupForm.formType, this.signupForm.school.uniqId);
        this.loaded = true;
        this.listenToFormChanges();
    }

    public onModelClick(field: IFieldSetting, key: string) {
        if (field.id === 'displayConduct') {
            _.forEach(this.tempFieldSettings, (settingSection: IFieldSettingsSection) => {
                if (settingSection['key'] === key) {
                    _.forEach(settingSection.settings, setting => {
                        if (setting.id === field.id) {
                            setting.isRequired = field.isIncluded;
                        }
                    });
                }
            });
        }

        _.forEach(this.tempFieldSettings, (settingSection: IFieldSettingsSection) => {
            if (settingSection['key'] === key) {
                _.forEach(settingSection.settings, setting => {
                    if (setting.dependentOn === field.id) {
                        setting.isIncluded = field.isIncluded;
                    }
                });
            }
        });
        this.formGroup.markAsDirty();
    }

    onSubmit() {
        this.doSubmit().then(() => {
            this.lastAction();
        }).catch((err) => {
            console.log(err);
        });
    }

    protected doSubmit() {
        const data = _.cloneDeep(this.formGroup.value);
        this.setLocalFieldSettings();
        data['fieldSettings'] = this.signupForm.fieldSettings;
        data.translations = this.getTranslationsFieldLabels();
        return this.promiseForBtn = this.httpService.postAuth('webform/update', data).then(() => {
            this.signupForm.name = this.formGroup.value.name;
            return Promise.resolve();
        }).catch(err => {
            console.log(err);
            if (err.errorCode === ErrorCode.google_tag_manager_id_not_exist) {
                this.formGroup.controls.googleTrackingIsEnabled.setValue(false);
            }
            return Promise.reject();
        });
    }

    private getTemporaryFieldSettings() {
        this.tempFieldSettings = [];
        _.forEach(this.signupForm.fieldSettings, (fieldSettings, key) => {
            const tmp = Utils.clone(fieldSettings);
            tmp['key'] = key;
            this.tempFieldSettings.push(tmp);
        });
        this.tempFieldSettings = _.orderBy(this.tempFieldSettings, ['sequence', 'DESC']);
    }

    private setLocalFieldSettings() {
        _.forEach(this.signupForm.fieldSettings, (fieldSetting, key) => {
            const tmp = _.find(this.tempFieldSettings, setting => setting['key'] === key);
            fieldSetting.settings = Utils.clone(tmp.settings);
            if (fieldSetting.isModifiable) {
                fieldSetting.isIncluded = tmp.isIncluded;
            }
        });
    }

    private lastAction(showNotification = true) {
        if (showNotification) {
            Utils.showSuccessNotification();
        }
        if (this.signupFormId) {
            this.loaded = false;
            this.getData();
        } else {
            this.router.navigate(['/admin/signup-forms']);
        }
    }

    private getTranslationsFieldLabels(): Translation[] {
        const translations = new Array<Translation>();
        _.forEach(Object.keys(this.translationForm.value), (key: string) => {
            const fieldProperties: string[] = key.split('_'); // [0] = translation Id [1] = subCategory(sectionType)
            translations.push({
                id: Constants.translationPrefix.fl + '_' + fieldProperties[0],
                category: Translation.CATEGORY_WEBFORM,
                subCategory: fieldProperties[1],
                locale:  this.userInfo.locale,
                translation: _.get(this.translationForm.value, key) as string,
                schoolId: this.userInfo.schoolId
            });
        });
        return translations;
    }

    isVisible(setting: IFieldSetting) {
        let isVisible = true;
        switch (setting.id) {
            case 'isInternational':
            case 'countryOfOriginId':
                (this.signupForm.school.hasInternationals) ? isVisible = true : isVisible = false;
                break;
            case 'boardingTypeId':
                (this.signupForm.school.isBoardingEnabled) ? isVisible = true : isVisible = false;
                break;
            case 'isSpouse':
                (this.signupForm.school.isSpouseEnabled) ? isVisible = true : isVisible = false;
                break;

            default:
                break;
        }
        return isVisible;
    }

    copyFormCode() {
        copy(this.iframeCode);
        Utils.showNotification('Form code is copied to clipboard.', Colors.success);
    }

    onCancel() {
        super.onCancel();
        this.router.navigate(['/admin/signup-forms']);
    }

    private getCountryData(id: string): Promise<void> {
        if (this.formGroup) { this.formGroup.markAsDirty(); }
        return this.httpService.get('country/' + id + '/administrative-areas').then((administrativeAreas: AdministrativeArea[]) => {
            this.administrativeAreas = administrativeAreas;
            return this.httpService.get('country/' + id + '/address-options').then((addressOptions: IAddressOptions) => {
                this.addressOptions = addressOptions;
                return Promise.resolve();
            });
        });
    }

    getFieldDescription(fieldSetting: IFieldSetting, subCategory: string) {
        return Utils.getTranslation(this.translations, Constants.translationPrefix.fd, fieldSetting.id, subCategory, Translation.CATEGORY_WEBFORM);
    }

    getFieldLabel(fieldSetting: IFieldSetting, subCategory: string) {
        if (fieldSetting.id === Constants.webFormFields.displayConduct) {
            return Utils.getTranslation(this.translations, Constants.translationPrefix.fd, fieldSetting.id, subCategory, Translation.CATEGORY_WEBFORM);
        } else {
            return Utils.getTranslation(this.translations, Constants.translationPrefix.fl, fieldSetting.id, subCategory, Translation.CATEGORY_WEBFORM);
        }
    }

    private stickyCheckHeader(pageYOffset: number) {
        this.isSticky = (pageYOffset >= 257);
        if (this.isSticky) {
            this.cellh1.nativeElement.width = this.cell1.nativeElement.offsetWidth;
            this.cellh2.nativeElement.width = this.cell2.nativeElement.offsetWidth;
            this.cellh3.nativeElement.width = this.cell3.nativeElement.offsetWidth;
            this.cellh4.nativeElement.width = this.cell4.nativeElement.offsetWidth;
            this.cellh5.nativeElement.width = this.cell5.nativeElement.offsetWidth;
        }
    }

    @HostListener('window:scroll', ['$event']) // this only works on MAc, because MAC doers not use Perfect Scrollbar
    @HostListener('window:resize', ['$event'])
    onScroll(event) {
        this.stickyCheckHeader(window.pageYOffset);
    }

}
