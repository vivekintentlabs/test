export interface IMerge {
    title: string;
    mappingParams: Array<{ field: string, type: FieldType, value?: string, model?: string, nestedModel?: string }>;
    mergeType: MergeType;
    isUserSelected?: boolean;
}


export class MergeField {
    constructor(
        public title: string,
        public values: string[],
        public selected: number,
        public mergeType: MergeType,
        public isUserSelected: boolean = false,
    ) { }
}

export enum MergeType {
    Modifiable = 1,
    NotModifiable = 2,
    Readonly = 3,
    CR = 4,
    Address = 5,
    Hidden = 6,
}

export enum Related {
    Contacts = 'related-contacts',
    Students = 'related-students',
}

export enum FieldType {
    String = 1,
    Date = 2,
    NestedId = 3,
    Boolean = 4,
    NestedCollection = 5,
    Related = 6,
    ManyToMany = 7,
    StartingYear = 8,
    AppContact = 9,
    AppStudent = 10,
}

export class Merge {

    public static mergeContactFields: IMerge[] = [
        { title: 'Date Created', mappingParams: [{ field: 'createdAt', type: FieldType.Date }], mergeType: MergeType.NotModifiable },
        {
            title: 'Salutation',
            mappingParams: [{ field: 'salutationId', type: FieldType.NestedId, value: 'name', model: 'salutation' }],
            mergeType: MergeType.Modifiable
        },
        { title: 'First Name', mappingParams: [{ field: 'firstName', type: FieldType.String }], mergeType: MergeType.Modifiable },
        { title: 'Last Name', mappingParams: [{ field: 'lastName', type: FieldType.String }], mergeType: MergeType.Modifiable },
        {
            title: 'Gender',
            mappingParams: [{ field: 'genderId', type: FieldType.NestedId, value: 'name', model: 'gender' }],
            mergeType: MergeType.Modifiable
        },
        { title: 'Address', mappingParams: [{ field: 'address', type: FieldType.String }], mergeType: MergeType.Modifiable },
        {
            title: 'City',
            mappingParams: [
                { field: 'sublocality', type: FieldType.String },
                { field: 'city', type: FieldType.String },
                { field: 'administrativeAreaId', type: FieldType.NestedId, value: 'name', model: 'administrativeArea' },
            ],
            mergeType: MergeType.Address
        },
        {
            title: 'Country',
            mappingParams: [{ field: 'countryId', type: FieldType.NestedId, value: 'name', model: 'country' }],
            mergeType: MergeType.Modifiable
        },
        { title: 'Email', mappingParams: [{ field: 'email', type: FieldType.String }], mergeType: MergeType.Modifiable },
        { title: 'Mobile', mappingParams: [{ field: 'mobile', type: FieldType.String }], mergeType: MergeType.Modifiable },
        { title: 'Home Phone', mappingParams: [{ field: 'homePhone', type: FieldType.String }], mergeType: MergeType.Modifiable },
        { title: 'Work Phone', mappingParams: [{ field: 'workPhone', type: FieldType.String }], mergeType: MergeType.Modifiable },
        {
            title: 'Alumni of school',
            mappingParams: [
                { field: 'alumniId', type: FieldType.NestedId, value: 'name', model: 'alumni' },
                { field: 'graduationYear', type: FieldType.String },
                { field: 'nameAtSchool', type: FieldType.String },
            ],
            mergeType: MergeType.Modifiable
        },
        { title: 'Last Modified', mappingParams: [{ field: 'updatedAt', type: FieldType.Date }], mergeType: MergeType.Readonly },
        { title: 'Related Contacts', mappingParams: [{ field: Related.Contacts, type: FieldType.Related }], mergeType: MergeType.Readonly },
        { title: 'Related Students/Siblings', mappingParams: [{ field: Related.Students, type: FieldType.Related }], mergeType: MergeType.Readonly },
        {
            title: 'Application',
            mappingParams: [{ field: 'appContactMapping', type: FieldType.AppContact, model: 'appContactMapping' }],
            mergeType: MergeType.Readonly
        },
    ];

    public static mergeStudentFields: IMerge[] = [
        { title: 'Date Created', mappingParams: [{ field: 'createdAt', type: FieldType.Date }], mergeType: MergeType.NotModifiable },
        { title: 'School ID', mappingParams: [{ field: 'externalId', type: FieldType.String }], mergeType: MergeType.Modifiable },
        {
            title: 'Relationship to Student',
            mappingParams: [
                {
                    field: 'relationshipTypeId',
                    type: FieldType.NestedCollection,
                    value: 'name',
                    model: 'contactRelationships',
                    nestedModel: 'relationshipType'
                }
            ],
            mergeType: MergeType.Modifiable
        },
        {
            title: 'Contact Type',
            mappingParams: [
                { field: 'contactTypeId', type: 5, value: 'name', model: 'contactRelationships', nestedModel: 'contactType' }
            ],
            mergeType: MergeType.Modifiable
        },
        { title: 'First Name', mappingParams: [{ field: 'firstName', type: FieldType.String }], mergeType: MergeType.Modifiable },
        { title: 'Last Name', mappingParams: [{ field: 'lastName', type: FieldType.String }], mergeType: MergeType.Modifiable },
        { title: 'Preferred Name', mappingParams: [{ field: 'preferredName', type: FieldType.String }], mergeType: MergeType.Modifiable },
        { title: 'Date of Birth', mappingParams: [{ field: 'dateOfBirth', type: FieldType.Date }], mergeType: MergeType.Modifiable },
        {
            title: 'Gender',
            mappingParams: [{ field: 'genderId', type: FieldType.NestedId, value: 'name', model: 'gender' }],
            mergeType: MergeType.Modifiable
        },
        {
            title: 'Religion',
            mappingParams: [{ field: 'religionId', type: FieldType.NestedId, value: 'name', model: 'religion' }],
            mergeType: MergeType.Modifiable
        },
        {
            title: 'merge.titleCampusCurrentSchoolYearIntakeYear',
            mappingParams: [
                { field: 'campusId', type: FieldType.NestedId, value: 'name', model: 'campus' },
                { field: 'currentSchoolYearId', type: FieldType.NestedId, value: 'name', model: 'currentSchoolYear' },
                { field: 'schoolIntakeYearId', type: FieldType.NestedId, value: 'name', model: 'schoolIntakeYear' },
            ],
            mergeType: MergeType.Modifiable
        },
        {
            title: 'Current School',
            mappingParams: [{ field: 'currentSchoolId', type: FieldType.NestedId, value: 'schoolName', model: 'currentSchool' }],
            mergeType: MergeType.Modifiable
        },
        { title: 'Starting Year', mappingParams: [{ field: 'startingYear', type: FieldType.StartingYear }], mergeType: MergeType.Modifiable },
        {
            title: 'Siblings',
            mappingParams: [{ field: 'siblingsId', type: FieldType.NestedId, value: 'name', model: 'siblings' }],
            mergeType: MergeType.Modifiable
        },
        {
            title: 'Alumni',
            mappingParams: [{ field: 'alumniId', type: FieldType.NestedId, value: 'name', model: 'alumni' }],
            mergeType: MergeType.Modifiable
        },
        {
            title: 'Submitted Application',
            mappingParams: [{ field: 'submittedApplication', type: FieldType.String }],
            mergeType: MergeType.Modifiable
        },
        {
            title: 'Country of Origin',
            mappingParams: [{ field: 'countryOfOriginId', type: FieldType.NestedId, value: 'name', model: 'countryOfOrigin' }],
            mergeType: MergeType.Modifiable
        },
        {
            title: 'Student Type',
            mappingParams: [{ field: 'boardingTypeId', type: FieldType.NestedId, value: 'name', model: 'boardingType' }],
            mergeType: MergeType.Modifiable
        },
        { title: 'International Student', mappingParams: [{ field: 'isInternational', type: 4 }], mergeType: MergeType.Modifiable },
        {
            title: 'Has Special Needs',
            mappingParams: [
                { field: 'hasSpecialNeeds', type: FieldType.Boolean },
            ],
            mergeType: MergeType.Modifiable
        },
        {
            title: 'Status',
            mappingParams: [{ field: 'studentStatusId', type: FieldType.NestedId, value: 'status', model: 'studentStatus' }],
            mergeType: MergeType.Modifiable
        },
        {
            title: 'Financial Aid',
            mappingParams: [{ field: 'financialAidId', type: FieldType.NestedId, value: 'name', model: 'financialAid' }],
            mergeType: MergeType.Modifiable
        },
        { title: 'Notes', mappingParams: [{ field: 'notes', type: FieldType.String }], mergeType: MergeType.Modifiable },
        {
            title: 'Lead Source',
            mappingParams: [{ field: 'leadSourceId', type: FieldType.NestedId, value: 'name', model: 'leadSource' }],
            mergeType: MergeType.Modifiable
        },
        {
            title: 'Hear About Us',
            mappingParams: [{ field: 'hearAboutUsId', type: FieldType.NestedId, value: 'name', model: 'hearAboutUs' }],
            mergeType: MergeType.Modifiable
        },
        { title: 'Last Modified', mappingParams: [{ field: 'updatedAt', type: FieldType.Date }], mergeType: MergeType.Readonly },
        {
            title: 'Application',
            mappingParams: [{ field: 'appStudentMapping.applicationId', type: FieldType.AppStudent, model: 'appStudentMapping' }],
            mergeType: MergeType.Readonly
        },
    ];
}
