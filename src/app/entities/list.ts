import { ListSetting } from './list-setting';
import { DisplayGroup } from './display-group';

export class List {
    id: number;
    name: string;
    description: string;
    isShownInList: boolean;
    canAddRemoveItems: boolean;
    sequence: number;
    listSetting: ListSetting | null;
    displayGroupId: number;
    displayGroup: DisplayGroup | null;
}
