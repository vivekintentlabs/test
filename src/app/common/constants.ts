import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'environments/environment';
import { Currency, InsertField } from './interfaces';
import { T } from './t';
import * as _ from 'lodash';

export class Constants {
    public static debugMode = false; // show all items in the sidebar
    public static showNew = false; // show items that are under development !!!!!!should always be false before commiting!!!!!!!!!!!!

    public static domainServer: string = environment.domainServer;
    public static baseUrl: string = environment.apiUrl;
    public static apiBaseUrl: string = Constants.baseUrl + 'api/';
    public static authUrl: string = Constants.apiBaseUrl + 'auth/';
    public static noauthUrl: string = Constants.apiBaseUrl + 'noauth/';

    public static readonly termsOfServiceUrl: string = environment.brand.termsOfUseUrl;
    public static readonly privacyPolicyUrl: string = environment.brand.privacyPolicyUrl;

    /**
     *  version is comprised out of 4 numbers.
     *  1: main number, e.g. will change if we go from beta to first real versoin 0 -> 1
     *  2: if we add major change
     *  3: new normal release
     *  4: hot fix during release
     */
    public static version = '1.1.0';
    /*buildversion*/
    public static build = '0100';
    public static showNotificationInMs = 5000;

    public static noItemSelected = 'Please Select...';
    public static noCountrySelected = 'Please Select Country';
    public static fieldRequired = 'This field is required.';
    public static filterAll = 'All';
    public static reservedBySystem = 'Item is reserved by the system';
    public static deleteWarning = 'All selected items, of the whole table will be deleted.';
    // tslint:disable-next-line:max-line-length
    public static passwordErrorText = 'Password format should be at least 8 characters including one uppercase letter, one lowercase letter and one number.';
    public static logoErrorText = 'Could not retrieve logo. Please upload the logo again.';
    public static schoolManagementSystem = 'Student Information System';
    public static noDataInTable = 'No data available in table';
    public static phoneErrorText = 'Only an optional + in the beginning is allowed and a maximum of 16 numbers, dashes or spaces';
    public static mergeWarningText = 'Please select at least one field each row in order to merge';
    public static incompleteFormText = 'Please make sure all required fields have been entered';
    public static partnerPasswordNotValid = 'Password format should be at least 4 characters including one uppercase letter, one lowercase letter and one number.';
    public static partnerSecurityInfo = 'For additional security, you may enter a custom password to access the file or one will be generated. Make a note of this as it cannot be retrieved.';
    public static bodyMessageErrorText = 'You have exceeded the permitted number of 65,535 characters';

    // Messages for when there are problems saving/submitting forms
    public static readonly formResponses = {
        previewMode: 'You can not submit in the preview',
        invalidRequiredFields: 'Please be sure and fill out all the required fields',
        acceptCodeOfConduct: _.template('Please review and agree to the "${ codeOfConductTitle }"'),
        verifyHuman: 'Please click the "I\'m not a robot" checkbox',
    };
    public static msgSchedulingFailed = 'Failed scheduling/sending message';
    public static emptyAppPublishedForm = 'Thank you for your interest in our school. We are not currently taking applications at this time, however, please check again later or contact us directly.';

    public static displayOtherLabel = 'Display Other... in this list';
    public static otherLabel = 'Other...';

    public static virusWarning = 'The uploaded files originate from an external source and cannot be guaranteed to be virus free. Please ensure your anti-virus software is fully up to date and set to check downloads';

    public static defaultItemsShownInTable = 10;
    public static phonePattern = /^ ?(\+ ?)?([\d][ -]?){5,16}$/;
    public static passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/; // = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z-\d]{8,}$/;
    public static partnerPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{4,20}$/;
    public static digitsPattern = /^[\d]{0,10}$/;
    public static urlPattern = /^(?:http(s)?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.%]+$/;
    public static timePattern = /Invalid date|^(0?[0-9]|1[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/i;

    public static reCaptchaSiteKey = environment.reCaptchaSiteKey;
    public static reCaptchaV2SiteKey = environment.reCaptchaV2SiteKey;

    public static emailMinLength = 2;
    public static emailMaxLength = 60;
    public static length60 = 60;
    public static length50 = 50;
    public static nameMaxLength = 40;
    public static synCodeMaxLength = 60;
    public static studentExternalIdsMaxLength = 36;
    public static citySuburbFieldMaxLength = 50;
    public static requiredSchoolNameMaxLength = 80;
    public static requiredListItemNameMaxLength = 150;
    public static addressFieldMaxLength = 255;
    public static requiredTextFieldMinLength = 1; // for all required text fields
    public static textFieldMaxLength = 65535; // max for all text fields
    public static notRequiredTextFieldMinLength = 1; // for addresses, countries ect. not required
    public static descriptionTextFieldMaxLength = 1000; // max length for description fields
    public static requiredStringFieldMaxLength = 255; // max length for string field (not text)
    public static postCodeMinLength = 4; // for post codes not required
    public static postCodeMaxLength = 10;
    public static maxWidth = 1500;
    public static maxHeight = 1500;
    public static maxLogoSize = 1048576 * 2;
    public static almostFullMessageField = 9950;
    public static messageMaxLength = 10000;
    public static htmlContentMaxLength = 10000;
    public static defaultTimeDifferenceInS = 3600;
    public static maxBookingAttendees = 20;
    public static requiredMinNumber = 1;
    public static otherPopupHeight = 213;
    public static requiredEmailSubjectMaxLength = 78;

    public static durationStartingYear = 20;
    public static durationGraduationYear = 70;

    public static minInfiniteTableLength = 25;

    private static ngbModalOptions: NgbModalOptions = { backdrop: 'static', keyboard: false };
    public static ngbModalSm: NgbModalOptions = _.assign({ size: 'sm' }, Constants.ngbModalOptions);
    public static ngbModalMd: NgbModalOptions = _.assign({ size: 'md' }, Constants.ngbModalOptions);
    public static ngbModalXl: NgbModalOptions = _.assign({ size: 'xl' }, Constants.ngbModalOptions);
    public static ngbModalLg: NgbModalOptions = _.assign({ size: 'lg' }, Constants.ngbModalOptions);

    public static dateFormats = {
        year: 'YYYY',
        dayMonthYearSlashed: 'DD/MM/YYYY',
        dayMonthYearSlashedNew: 'dd/MM/yyyy',
        dateTimeUTC: 'YYYY-MM-DDTHH:mm:ssZ',
        hourMinutes: 'HH:mm',
        time: 'HH:mm:ss',
        dayMonthYear: 'DD-MM-YYYY',
        shortMonth: 'MMM',
        monthDay: 'MMMM DD',
        dayMonth: 'DD MMMM',
        dayShortMonth: 'DD MMM',
        date: 'YYYY-MM-DD',
        dateTime: 'YYYY-MM-DD HH:mm:ss',
        dateTimeSlahed: 'DD/MM/YYYY HH:mm',
        timeShort: 'hh:mm A',
        dayMonthYearSlashedTimeShort: 'DD/MM/YYYY hh:mm A',
        dayMonthYearUnderScored: 'yy_MM_DD'
    };

    public static localeFormats = {
        dateDelimiter: 'dateDelimiter',
        dateDelimiterTime: 'dateDelimiterTime',
        dateDelimiterTimeShort: 'dateDelimiterTimeShort',
        dateTime: 'dateTime',
        dateTimeShort: 'dateTimeShort',
        date: 'date',
        longDate: 'longDate',
        longDateWithComma: 'longDateWithComma',
        shortDate: 'shortDate'
    };

    public static readonly UTCTimeCode = 'Etc/UTC';
    public static readonly locale = 'en-AU';

    public static timePickerSettings = {
        format: Constants.dateFormats.timeShort,
        stepping: 15,
        icons: {
            time: 'fa fa-clock-o',
            date: 'fa fa-calendar',
            up: 'fa fa-chevron-up',
            down: 'fa fa-chevron-down',
            previous: 'fa fa-chevron-left',
            next: 'fa fa-chevron-right',
            today: 'fa fa-screenshot',
            clear: 'fa fa-trash',
            close: 'fa fa-remove'
        }
    };

    public static Currencies: Currency[] = [
        { countryName: 'Australia', currencySymbol: '$', currencyText: 'AUD' },
        { countryName: 'Canada', currencySymbol: '$', currencyText: 'CAN' },
        { countryName: 'New Zealand', currencySymbol: '$', currencyText: 'NZD' },
        { countryName: 'USA', currencySymbol: '$', currencyText: 'USD' },
    ];

    public static insertSubjectEventEmail: InsertField[] = [
        { text: 'Contact First Name', value: ' < CONTACT FIRST NAME >' },
        { text: 'Event Date', value: ' < EVENT DATE >' },
        { text: 'Event Name', value: ' < EVENT NAME >' },
        { text: 'Event Start Time', value: ' < EVENT START TIME >' },
        { text: 'Event End Time', value: ' < EVENT END TIME >' },
        { text: 'School Name', value: ' < SCHOOL NAME >' },
        { text: 'Campus Name', value: ' < CAMPUS NAME >' },
    ];

    public static insertSubjectPersonalTourEmail: InsertField[] = [
        { text: 'Contact First Name', value: ' < CONTACT FIRST NAME >' },
        { text: 'Date', value: ' < DATE >' },
        { text: 'School Name', value: ' < SCHOOL NAME >' },
        { text: 'Campus Name', value: ' < CAMPUS NAME >' },
        { text: 'Start Time', value: ' < START TIME >' },
    ];

    public static insertMessageEventEmail: InsertField[] = [
        { text: 'Campus Name', value: '&nbsp;< CAMPUS NAME >' },
        { text: 'Contact Salutation', value: '&nbsp;< CONTACT SALUTATION >' },
        { text: 'Contact First Name', value: '&nbsp;< CONTACT FIRST NAME >' },
        { text: 'Contact Last Name', value: '&nbsp;< CONTACT LAST NAME >' },
        { text: 'Email Signature', value: '&nbsp;< EMAIL SIGNATURE >' },
        { text: 'Event Date', value: '&nbsp;< EVENT DATE >' },
        { text: 'Event Name', value: '&nbsp;< EVENT NAME >' },
        { text: 'Event Location', value: '&nbsp;< EVENT LOCATION >' },
        { text: 'Event Start Time', value: '&nbsp;< EVENT START TIME >' },
        { text: 'Event End Time', value: '&nbsp;< EVENT END TIME >' },
        { text: 'School Name', value: '&nbsp;< SCHOOL NAME >' },
        { text: 'Subtour Name Time', value: '&nbsp;< SUBTOUR NAME TIME >' },
    ];

    public static insertMessagePersonalTourEmail: InsertField[] = [
        { text: 'Campus Name', value: '&nbsp;< CAMPUS NAME >' },
        { text: 'Contact Salutation', value: '&nbsp;< CONTACT SALUTATION >' },
        { text: 'Contact First Name', value: '&nbsp;< CONTACT FIRST NAME >' },
        { text: 'Contact Last Name', value: '&nbsp;< CONTACT LAST NAME >' },
        { text: 'Location', value: '&nbsp;< LOCATION >' },
        { text: 'Date', value: '&nbsp;< DATE >' },
        { text: 'Start Time', value: '&nbsp;< START TIME >' },
        { text: 'Email Signature', value: '&nbsp;< EMAIL SIGNATURE >' },
        { text: 'School Name', value: '&nbsp;< SCHOOL NAME >' },
    ];

    public static insertEmailSignature: InsertField[] = [
        { text: 'School Name', value: '&nbsp;< SCHOOL NAME >' },
        { text: 'School Address', value: '&nbsp;< SCHOOL ADDRESS >' },
        { text: 'School City', value: '&nbsp;< SCHOOL CITY >' },
        { text: 'School State', value: '&nbsp;< SCHOOL STATE >' },
        { text: 'School Postcode', value: '&nbsp;< SCHOOL POSTCODE >' },
        { text: 'User Name', value: '&nbsp;< USER NAME >' },
        { text: 'User Title', value: '&nbsp;< USER TITLE >' },
        { text: 'User Email', value: '&nbsp;< USER EMAIL >' },
    ];

    public static insertSubjectEmailTemplate: InsertField[] = [
        { text: 'Campus Name', value: ' < CAMPUS NAME >' },
        { text: 'Contact Salutation', value: ' < CONTACT SALUTATION >' },
        { text: 'Contact First Name', value: ' < CONTACT FIRST NAME >' },
        { text: 'Contact Last Name', value: ' < CONTACT LAST NAME >' },
        { text: 'School Name', value: ' < SCHOOL NAME >' },
    ];

    public static insertMessageEmailTemplate: InsertField[] = [
        { text: 'Campus Name', value: '&nbsp;< CAMPUS NAME >' },
        { text: 'Contact Salutation', value: '&nbsp;< CONTACT SALUTATION >' },
        { text: 'Contact First Name', value: '&nbsp;< CONTACT FIRST NAME >' },
        { text: 'Contact Last Name', value: '&nbsp;< CONTACT LAST NAME >' },
        { text: 'School Name', value: '&nbsp;< SCHOOL NAME >' },
        { text: 'Email Signature', value: '&nbsp;< EMAIL SIGNATURE >' },
    ];

    public static insertMessageApplicationsEmail: InsertField[] = [
        { text: 'Application ID', value: '&nbsp;< APPLICATION ID >' },
        { text: 'Application Submitted Date', value: '&nbsp;< APPLICATION SUBMITTED DATE >' },
        { text: 'Application Submitted Time', value: '&nbsp;< APPLICATION SUBMITTED TIME >' },
        { text: 'Student First Name', value: '&nbsp;< STUDENT FIRST NAME >' },
        { text: 'Student Last Name', value: '&nbsp;< STUDENT LAST NAME >' },
        { text: 'Starting Year', value: '&nbsp;< STARTING YEAR >' },
        { text: T.intake_year_level, value: T.intakeYearLevelTag },
        { text: 'Date of Birth', value: '&nbsp;< DATE OF BIRTH >' },
        { text: 'Email Signature', value: '&nbsp;< EMAIL SIGNATURE >' },
        { text: 'School Name', value: '&nbsp;< SCHOOL NAME >' },
        { text: 'Campus Name', value: '&nbsp;< CAMPUS NAME >' }
    ];

    public static mergeTagNames: string[] = [
        'Campus Name',
        'School Name',
        'Email Signature',
        'Contact Salutation',
        'Contact First Name',
        'Contact Last Name',
        'Contact Email Address',
        'Contact Phone Number',
    ];

    public static colors: string[] = [
        'text-info', 'text-danger', 'text-warning', 'text-primary',
        'text-success', 'text-six', 'text-seven', 'text-eight', 'text-nine',
        'text-ten', 'text-eleven', 'text-twelve', 'text-thirteen', 'text-fourteen',
        'text-fifteen', 'text-dark-blue', 'text-middle-blue', 'text-light-blue'
    ];

    public static months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    public static pageSizeOptions: number[] = [5, 10, 25, 50];

    public static webFormFields = {
        eventCampusId: 'eventCampusId',
        eventId: 'eventId',
        description: 'description',
        salutationId: 'salutationId',
        firstName: 'firstName',
        lastName: 'lastName',
        relationshipId: 'relationshipId',
        email: 'email',
        mobile: 'mobile',
        homePhone: 'homePhone',
        address: 'address',
        sendProspectus: 'sendProspectus',
        sendConfirmationContact2: 'sendConfirmationContact2',
        sendProspectusContact2: 'sendProspectusContact2',
        dateOfBirth: 'dateOfBirth',
        genderId: 'genderId',
        campusId: 'campusId',
        startingYear: 'startingYear',
        schoolIntakeYearId: 'schoolIntakeYearId',
        currentSchoolId: 'currentSchoolId',
        currentSchoolYearId: 'currentSchoolYearId',
        boardingTypeId: 'boardingTypeId',
        isInternational: 'isInternational',
        countryOfOriginId: 'countryOfOriginId',
        isFirstVisit: 'isFirstVisit',
        hearAboutUsId: 'hearAboutUsId',
        totalAttendees: 'totalAttendees',
        message: 'message',
        displayConduct: 'displayConduct',
        leadSourceId: 'leadSourceId'
    };

    public static translationPrefix = {
        fd: 'FD', // Field Description
        fl: 'FL' // Field Label
    };

    public static schoolModules = {
        commsModule: { name: 'commsModule', title: 'Communications (Email & Mail)' },
        appModule: { name: 'appsModule', title: 'Application Module' }
    };

    public static ChartContextMenuOptionConstant = {
        excelType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
        csvType: 'application/vnd.openxmlformats-officedocument.wordprocessingml;charset=UTF-8',
    }

    public static ColorsList = {
        'text-info': '#00bcd4',
        'text-danger': '#f44336',
        'text-warning': '#ff9800',
        'text-primary': '#9c27b0',
        'text-success': '#4caf50',
        'text-six': '#337ab7',
        'text-seven': '#add',
        'text-eight': '#ad3',
        'text-nine': '#2196F3',
        'text-ten': '#ffeb3b',
        'text-eleven': '#55acee',
        'text-twelve': '#cc2127',
        'text-thirteen': '#CDDC39',
        'text-fourteen': '#546E7A',
        'text-fifteen': '#795548',
        'text-dark-blue': '#0000d6',
        'text-middle-blue': '#5300e8',
        'text-light-blue': '#9965f4'
    }

    public static ChartIcons = {
        pie: 'pie_chart',
        stackedColumnChart: 'stacked_bar_chart',
    };

    public static ChartNames = {
        pie: 'Pie',
        stackedColumnChart: 'Stacked Column Chart',
    };

    public static ChartTypes = {
        pie: 'pie',
        stackedColumnChart: 'stackedColumnChart'
    };
}
