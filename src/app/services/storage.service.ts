import { Injectable } from '@angular/core';

import { KeyValueStorage } from 'app/common/storage/key-value-storage';
import { LocalStorage } from 'app/common/storage/local-storage';
import { DbStorage } from 'app/common/storage/db-storage';
import { StorageAccessor } from 'app/common/storage/storage-accessor';
import { KeyValueCategory } from 'app/common/enums';
import { Storage } from 'app/common/enums/storage';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root',
})
export class StorageService {
    private storage: KeyValueStorage;

    public init(): Promise<void> {
        this.createStorage();
        return this.storage.init();
    }

    private createStorage() {
        switch (environment.storageType) {
            case Storage.LocalStorage: this.storage = new LocalStorage(); break;
            case Storage.IndexedDB: this.storage = new DbStorage(); break;
            default: break;
        }
    }

    public getStorageAccessor(storageCategory: KeyValueCategory) {
        return new StorageAccessor(this.storage, storageCategory);
    }

    public resetFilters() {
        return this.storage.clear(KeyValueCategory.CATEGORY_FILTER);
    }

    public resetTableStates() {
        return this.storage.clear(KeyValueCategory.CATEGORY_TABLE);
    }

}
