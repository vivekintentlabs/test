import { status } from 'app/applications/interfaces/forms/types';

export interface MergeAppFormTemplateInfoDTO {
    applicationId: string;
    status: status;
    name: string;
}
