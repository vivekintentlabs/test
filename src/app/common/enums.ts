import { environment } from "environments/environment";

/* enum must be exactly the same as in /src/utils/enums of angular project!! */
export enum ErrorCode {
    no_error = 0,
    unexpected_error = 1,
    validation_error = 2,
    url_not_found = 3,
    database_error = 4,
    shared_secret_mismatch = 5, // 5 no longer used
    auth_fail = 6,
    param_invalid = 7,
    not_allowed_role = 8,
    mailing_error = 9,
    subscription_expired = 10,
    access_code_expired = 11,
    user_not_exist = 12,
    unsupported_html_method = 13, // 13 no longer used
    duplicate_user_email = 14,
    unsubscribe_link_not_valid = 15,
    disabled_user = 16,
    empty_response = 17,
    google_tag_manager_id_not_exist = 18,
    save_file_error = 19,
    campus_not_exist = 20,
    delete_file_error = 21,
    read_file_error = 22,
    error_without_title = 23,
    maintenance_mode = 24,
    getting_mailchimp_campaign_info_failed = 25,
    captcha_check_failed = 26,
    unsupported_export_format = 27,
    user_is_not_active = 28,
    is_used = 29,
    database_item_is_not_found = 30,
    document_not_found = 31,
    unable_to_trigger_ua_event = 32,
    payment_error = 33,
    payment_is_processing = 34,
    export_partner_error = 35,
    download_partner_error = 36,
}

export enum gen_list_id {
    state = 1,
    gender = 2,
}


export enum list_id {
    special_need = 1,
    school_interest = 2,
    other_interest = 3,
    genders = 4,
    // current_school_year = 5,
    // intake_year_level=6,
    religion = 7,
    parish = 8,
    contact_relationship = 9,
    hear_about_us = 10,
    lead_source = 11,
    stage = 12,
    financial_aid = 13,
    student_state = 14,
    reason = 15,
    activity = 16,
    event = 17,
    siblings = 18,
    alumni = 19,
    application_date = 20,
    classification = 21,
    school_category = 22,
    country = 23,
    state = 24,
    contact_salutation = 25,
    contact_type = 26,
    boarding_type = 27,
    secondary_education_level = 28,
    tertiary_education_level = 29,
    occupational_group = 30,
    occupations = 31,
    residency_status = 32,
    medical_conditions = 33,
    indigenous_status = 34,
    student_residence = 35,
    visa_classes = 36,
    immunisation = 37,
    other_schools = 38,
    language = 39,
    sibling_options = 40,
    fee_responsibility = 41,
    starting_period = 42,
    faith_certificates = 43,
    permission = 44,
    select_school_reasons = 45,
    document_section_status = 46,
    pay_later_options = 47,
}

export enum LICode {
    // guardian = 1,
    activity_sendAProspectus = 2,
    websiteContactUs = 3,
    websiteEventRegistration = 4,
    specialNeeds_no = 5,
    financialAid_none = 6,
    state_deferred = 7,
    state_declined = 8, // also used for student status
    activity_sendACard = 9,
    enquiryForm = 10,
    relationshipUnknown = 11,
    // student_status_enquiry = 12 //deleted
    stage_declined = 13,
    specialNeeds_yes = 14,
    activity_application_submitted = 15,
    country_australia = 16,
    activity_recordOfConversation = 17,
    contact_type_primary = 18,
    contact_type_secondary = 19,
    boarding_type_default = 20,
    father = 21,
    mother = 22,
    email_communications = 23,
    gender_male = 24,
    gender_female = 25,
    in_person = 26,
    request_for_personal_tour = 27,
    religion_not_specified = 28,
    website_prospectus_request = 29,
    alumni_yes = 30,
    alumni_no = 31,
    stage_applicant = 32,
    stage_interest = 33,
    stage_enroled = 34,
    feeder = 80, // we need a gap to not have a merge conflict, because we work on two branches (dev and app-module)
    non_feeder = 81,
    temporary_resident = 82,
    sibling_at_school_current = 83,
    sibling_at_school_past = 84,
    sibling_at_school_future = 85,
    fee_responsibility_full = 86,
    fee_responsibility_shared = 87,
    fee_responsibility_none = 88,
    // activity_email_communications = 89, // ET-2771 this list item code is a duplicate of email_communications (index 23)
    permission_give = 90,
    permission_not_give = 91,
    activity_application_in_progress = 92,
    not_verified = 93,
    pending = 94,
    verified = 95,
    invalid = 96,
    website_online_application = 97,
    online_banking = 98,
    credit_debit_card = 99,
    cheque = 100,
    cash = 101,
    payment_not_verified = 102,
    payment_verified = 103,
    activity_application_deleted = 140,
    indigenous_status_not_applicable = 141,
    student_residence_both_parents = 142,
    student_residence_mother_only = 143,
    student_residence_father_only = 144,
    student_residence_shared_custody = 145,
    faith_certificates_baptism = 146,
    faith_certificates_confirmation = 147,
    faith_certificates_eucharist = 148,
    faith_certificates_reconciliation = 149,
    activity_payment_submitted = 150,
}

export enum RSCriterion {
    Siblings = 1,
    Alumni = 2,
    Religion = 3,
    ApplicationDateReceived = 4,
    CurrentSchoolClassification = 5,
    CurrentSchoolStatus = 6,
    Parish = 7,
}

export enum StudentStatusCode {
    student_status_enquiry = 1,
    student_status_declined = 2,
    student_status_app_invite_to_apply = 3,
    student_status_app_in_progress = 4,
    student_status_app_submitted = 5,
    student_status_app_completed = 6,
}

export enum ManagementSystemCode {
    sas2000 = 3, // SAS2000
    synergetic = 4, // Synergetic
    na = 7 // My option is not listed
}

export enum Parent {
    first = 1,
    second = 2,
}

export enum PageLeaveReason {
    save,
    goBack,
    doNotSave
}

export enum FormType {
    prospectus_request = 1,
    event_registration = 2,
    extended_registration = 3,
    application = 4,
    general = 5
}

export enum FieldType {
    Text = 1,
    Dropdown = 2,
    Checkbox = 3,
    Toggle = 4,
    Date = 5,
    Radio = 6,
    DateRange = 7,
    YearMonthPicker = 8
}

export enum OperationMode {
    Normal = 0,
    Maintenance = 1,
    Maintenance_with_cronJobs = 2
}

export enum ContentType {
    Event = 1,
    Personal_Tour = 2,
}

export enum KeyValueCategory {
    CATEGORY_FILTER = 'filter',
    CATEGORY_TABLE = 'table'
}

export enum SubmittedApplication {
    Yes = 1,
    No = 2,
    Unsure = 3,
}

export enum ChartType {
    Line = 1,
    Bar = 2,
    Pie = 3,
}

export enum MergeState {
    mergingContacts = 'merging-contacts',
    mergingStudents = 'merging-student',
    reviewStudents = 'review-students',
}

export enum ModalAction {
    Done = 1,
    Cancel = 2,
    Create = 3,
    Update = 4,
    Select = 5,
    MergeContacts = 6,
    MergeStudents = 7,
    contactForNewStudent = 8,
    LeavePage = 9,
}

export enum ApplicationStatus {
    InProgress = 'In Progress',
    Submitted = 'Submitted',
    InReview = 'In Review',
    Pending = 'Pending',
    Finalized = 'Finalized'
}

export enum Role {
    SystemAdmin = 'system_admin',
    SchoolAdmin = 'school_admin',
    Editor = 'editor',
    User = 'user',
    SchoolRepresentative = 'school_representative',
    Contact = 'contact',
}

export enum AppType {
    active = 'active',
    firstSubmitted = 'firstSubmitted'
}

// Defines all of the data properties that are supported by one or more widgets.
// The enum string values represent the optional html data attributes in a widget.
// This enum is mirrored in enrollment_node
export enum WidgetDataProperty {
    data_widget_event_type = 'data-widget-event-type', // filter events by event type
    data_widget_campus_code = 'data-widget-campus-code', // filter by campus code
    data_widget_event_id = 'data-widget-event-id', // pick an event by its id
}

export enum InvalidFileType {
    accept = 'accept',
    fileSize = 'fileSize',
}

export enum HasAlumni {
    Yes = 'Yes',
    No = 'No',
    Unknown = 'Unknown',
}

export enum CriterionType {
    ListItem = 'ListItem',
    Enum = 'Enum',
}
