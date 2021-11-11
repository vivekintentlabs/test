import { AbstractControl, ValidatorFn } from '@angular/forms';
import { Sort } from '@angular/material/sort';

import { ErrorCode } from './enums';

import { PersonalTour } from 'app/entities/personal-tour';
import { ListItem } from 'app/entities/list-item';
import { User } from 'app/entities/user';
import { Country } from 'app/entities/country';
import { AdministrativeArea } from 'app/entities/administrative-area';
import { YearLevel } from 'app/entities/year-level';
import { AppFilter } from 'app/entities/app-filter';
import { Student } from 'app/entities/student';
import { StudentStatus } from 'app/entities/student-status';
import { CurrentSchool } from 'app/entities/current-school';
import { YearLevelList } from 'app/entities/year-level-list';

import { FilterValue } from 'app/components/filter-constellation/interfaces/filter-value';

export class ResponseMessage {
    public data: Object;
    public errorCode: ErrorCode;
    public errorMessage: string;
    public params?: string[];
}

export interface IPersonalTour {
    year: number;
    date: string;
    time: string;
    contact: string;
    families: number;
    personalTour: PersonalTour;
    campusId: number;
    isFuture?: boolean;
}

export class AddListItemCmpData {

    constructor(
        public htmlId: string, public listId: number, public schoolId: number,
        public defaultValue: number, public formName: string, public controlName: string,
        public currentSchoolId: number, public top: number,
        public isPublicPage: boolean, public control: AbstractControl, public items: ListItem[],
        public beforeRefactoring = false
    ) { }
}

export interface IAddCurrentSchoolCmpData {
    htmlId: string;
    schoolId: number;
    controlName: string;
    formName: string;
    displayOther: boolean;
    studentNumber: number;
    isPublicPage: boolean;
    top: number;
}

export interface Currency {
    countryName: string;
    currencySymbol: string;
    currencyText: string;
}
export interface ISelectUserData {
    htmlId: string;
    users: User[];
}

export interface IFieldSettings {
    eventDetails?: IFieldSettingsSection;
    contact1: IFieldSettingsSection;
    contact2?: IFieldSettingsSection;
    student: IFieldSettingsSection;
    hidden: IFieldSettingsSection;
    general: IFieldSettingsSection;
}

export interface IFieldSettingsSection {
    field: string;
    description: string;
    settings: IFieldSetting[];
    sequence: number;
    sectionType: string;
    isIncluded: boolean;
    isModifiable: boolean;
}

export interface IFieldSetting {
    isRequired: boolean;
    isIncluded: boolean;
    isModifiable: boolean;
    fieldType: number;
    id: string;
    defaultValue: any;
    isFieldLabelModifiable: boolean;
    isExcludable: boolean;
    dependentOn?: string;
}

export interface IControl {
    id: string;
    validators: ValidatorFn[];
}

export interface IAddressOption {
    label: string;
    isUsed: boolean;
}

export interface IAddressOptions {
    sublocality: IAddressOption;
    city: IAddressOption;
    state: IAddressOption;
    otherState: IAddressOption;
    postCode: IAddressOption;
}

export interface IStyle {
    param: string;
    value: string;
    styleType: string;
    styleClass: string;
    schoolId: number;
}

export interface ISynCodeList {
    name: string;
    synCode: string;
    key: string;
}

export interface IWidget {
    id: string;
    name: string;
    sequence: number;
    status: boolean;
    subWidgets: ISubWidget[];
}

export interface ISubWidget {
    id: string;
    name: string;
    sequence: number;
    status: boolean;
}

// interface for mailchimp campaign report data
export interface ICampaignOpenReport {
    date: string;
    uniqueOpens: number;
    totalOpens: number;
    emailId?: string;
}

// interface for mailchimp campaign segment data
export interface ICampaignSegmentData {
    condition_type: string;
    field: string;
    op: string;
    value: string;
}

export interface ChildCmpState {
    changed: number;
    submitted: boolean;
}

export interface ISchoolModule {
    name: string;
    title: string;
    isEnabled: boolean;
}

export interface IDateFormats {
    dateDelimiter: string;
    dateDelimiterTime: string;
    dateDelimiterTimeShort: string;
    dateTime: string;
    dateTimeShort: string;
    date: string;
    longDate: string;
    longDateWithComma: string;
    shortDate: string;
}

export interface Address {
    sublocality: string;
    city: string;
    administrativeArea: AdministrativeArea;
    country: Country;
    postCode: string;
}

export interface ICheckboxItem {
    id: number;
    name: string;
    checked: boolean;
}

export interface ITableState {
    id: number;
    searchText: string;
    sortState: Sort;
    pageSize: number;
}

export interface ISelectFormControl {
    id: number;
    name: string;
    checked?: boolean;
    startTime?: string;
}

export interface IWidgetParams {
    icon: string;
    title: string;
    students: Student[];
    yearLevels: YearLevel[];
    intakeYears: object[];
    uniqName: string;
    filterFields: string[];
}

export interface IWidgetFilterParams {
    uniqName: string;
    filters: AppFilter[];
    values: FilterValue[];
    useLocalStorage: boolean;
}

export interface Chart {
    type: number;
    icon: string;
    selected: boolean;
}

export class FilterOptions {
    startingYears: number[] = [];
    listItems: ListItem[] = [];
    yearLevels: YearLevelList;
    studentStatuses: StudentStatus[] = [];
    countries: Country[] = [];
    administrativeAreas: AdministrativeArea[] = [];
    currentSchools: CurrentSchool[] = [];
}

export interface MinifiedStudent {
    id: number;
    isExported: boolean;
    exportDate: string;
    applicationExportDate: string;
    exportInfo: string;
    lastName: string;
    firstName: string;
    score: number;
    startingYear: number;
    year: string;
    stage: string;
    status: string;
    contactLastName: string;
    contactFirstName: string;
    contactMobile: string;
    contactId: number;
}

export interface MinifiedContact {
    id: number;
    updatedAt: string;
    lastName: string;
    firstName: string;
    address: string;
    city: string;
    email: string;
    mobile: string;
}

export interface InsertField {
    text: string;
    value: string;
}

export interface ISortQuery {
    field: string;
    direction: 'DESC' | 'ASC';
}

export interface ContactClaim {
    role: string;
    email: string;
    schoolUniqId: string;
    schoolId: number;
    schoolTimezoneId: string;
    mainCampusId: number;
}

export interface ChartButtonGroupSetup {
    hasCopyButton: boolean;
    menuButton?: ChartSelectorMenuItem;
    hasChartSelectorButton: boolean;
    chartTypeMenus?: ChartTypeMenu;
}

export interface ChartTypeMenu {
    menuIcon: string;
    menus?: ChartTypeMenuItem[];
}

export interface ChartTypeMenuItem {
    name: string;
    type: string;
}

export interface ChartActionSectionSetup {
    hasViewButton: boolean;
}

export interface ChartSelectorMenuItem {
    aggregateSection: ChartSection;
    totalSection: ChartSection;
    legendSection?: ChartSection;
    hasGuideButton: boolean;
    hasDownloadPDFButton: boolean;
    hasDownloadCSVButton: boolean;
    hasDownloadXLSButton: boolean;
    hasPrintButton: boolean;
}

export interface Environment {
    production: boolean,
    isAllowedInvalidAppSubmission: boolean,
    logAppModuleErrors: boolean,
    domainServer: string,
    apiUrl: string,
    googleMapApiKey: string,
    storageType: number,
    reCaptchaSiteKey: string,
    reCaptchaV2SiteKey: string,
    brand: Brand,
    localization,
}

export interface Brand {
    name: string,
    companyName: string,
    title: string,
    supportEmail: string,
    contactEmail: string,
    privacyPolicyUrl: string,
    termsOfUseUrl: string,
    homeUrl: string,
    whatsNewUrl: string,
    exportFilenamePrefix: string
    footerText: string
}

export interface UtmParam {
    param: string;
    value: string;
}

export interface ChartSection {
    isSelected?: boolean;
    hasButton: boolean;
}

export interface Localization {
    enquiriesTitle: string,
    enquiriesUrl: string
}
