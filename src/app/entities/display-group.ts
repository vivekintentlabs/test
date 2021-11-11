import { List } from './list';

export class DisplayGroup {
    public static GENERAL_ET = 'generalET';
    public static APP_MODULE = 'appModule';

    id: number;
    name: string;
    lists: Array<List>;
}
