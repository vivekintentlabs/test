import { KeyValueStorage } from 'app/common/storage/key-value-storage';
import { KeyValueCategory } from '../enums';

export class StorageAccessor {

    constructor(private storage: KeyValueStorage, private category: KeyValueCategory) { }

    public get(name: string): Promise<any> {
        return this.storage.get(this.category, name);
    }

    public add(name: string, value: any): Promise<any> {
        return this.storage.add(this.category, name, value);
    }

    public update(name: string, value: any): Promise<any> {
        return this.storage.update(this.category, name, value);
    }

}
