export class ConversionRatio {
    schoolIntakeYearId: number;
    schoolIntakeYear: string;
    interest = 0;
    applicant = 0;
    enroled = 0;
    declined = 0;
    yearLevelMax = 0;
    availablePlaces = 0;

    public addStudentCount(stage: string, yearLevelId: number, schoolIntakeYear: string, yearLevelMax = 0, availablePlaces = 0) {
        this.schoolIntakeYearId = yearLevelId;
        this.schoolIntakeYear = schoolIntakeYear;
        this.yearLevelMax = yearLevelMax;
        this.availablePlaces = availablePlaces;

        switch (stage.toUpperCase()) {
            case 'INTEREST': this.interest++; break;
            case 'APPLICANT': this.applicant++; break;
            case 'ENROLED': this.enroled++; break;
            case 'DECLINED': this.declined++; break;
            default: console.log(`unexpected converion ratio input: stage ${stage}`);
        }
    }
}
