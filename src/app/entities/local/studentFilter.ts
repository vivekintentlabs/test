export class StudentFilter {
    intakeYear: number | string = 'all';
    intakeYearLevels = [];
    stages = [];
    statuses = [];
    markRecord = false;
    campusId: number | string = 'all';

    parentLastName = '';
    parentAddress = '';
    parentMobile = '';
    filterRecord = '';

    studentLastName = '';
    financialAidId: number | string = 'all';
    genders = [];
    alumnies = [];
    siblings = [];
    religions = [];
    otherInterests = [];
    isExported = [];
    enquiryDates = [];
    specialNeeds = false;
    advanced = false;
};
