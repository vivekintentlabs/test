import { ApplicationStatus } from 'app/common/enums';
import { FillableAppFormDoc } from './documents/fillable-app-form-doc';

export interface SnapshotFillableAppForm {
    fillableAppFormDoc: FillableAppFormDoc;
    applicationStatus: ApplicationStatus;
    metaData: {
        schoolName: string;
        schoolTimezoneId: string;
        formName: string;
    };
}
