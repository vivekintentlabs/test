import { ListItem } from './list-item';
export class StudentStatus {
    id: number;
    stageId: number;
    stage: ListItem;
    status: string;
    synCode: string;
    readonly description: string;
    sequence: number;
    schoolId: number;
    isModifiable: boolean;
    isDeletable: boolean;
    code: number;
}
