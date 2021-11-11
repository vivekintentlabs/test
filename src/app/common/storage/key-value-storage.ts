import { KeyValueCategory } from '../enums';

export abstract class KeyValueStorage {

    public static categories = [
        KeyValueCategory.CATEGORY_FILTER,
        KeyValueCategory.CATEGORY_TABLE,
    ]

    public abstract init(): Promise<any>;

    public abstract get(category: string, name: string): Promise<any>;

    public abstract add(category: string, name: string, values: any[]): Promise<any>;

    public abstract update(category: string, name: string, values: any[]): Promise<any>;

    public abstract clear(category: string): Promise<any>;

}
