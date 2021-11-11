import { CriterionType } from 'app/common/enums';

export class Criterium {
    id: number;
    listId: number | null;
    type: CriterionType.ListItem | CriterionType.Enum;
    name: string;
}
