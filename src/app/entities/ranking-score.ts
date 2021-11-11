import { Criterium } from './criterium';
import { ListItem } from './list-item';

export class RankingScore {
    id: number;
    enabled: boolean;
    criteriumId: number;
    criterium?: Criterium;
    listItemId?: number;
    enumValue?: string;
    listItem?: ListItem;
    score: number;
    schoolId: number;
    // local
    isDeleted?: boolean;
    isGreen?: boolean;
    criteriaName?: string;
}
