import { KeyValueStorage } from './key-value-storage';

import { NgxIndexedDB } from 'ngx-indexed-db';

import * as _ from 'lodash';

export interface ITableColumn { name: string, unique: boolean }

export class DbStorage extends KeyValueStorage {
    private db: NgxIndexedDB;

    private tableColumns: ITableColumn[] = [
        { name: 'name', unique: true },
        { name: 'values', unique: false },
    ];

    constructor() {
        super();
        this.db = new NgxIndexedDB('enquiryTrackerDb', 1);
    }

    init(): Promise<void> {
        return this.db.openDatabase(1, evt => {
            KeyValueStorage.categories.forEach((category: string) => {
                const store = evt.currentTarget.result.createObjectStore(category);

                this.tableColumns.forEach(column => {
                    store.createIndex(column.name, column.name, { unique: column.unique });
                });
            })
        });
    };

    get(category: string, name: string): Promise<any> {
        return this.db.getByKey(category, name).then(filter => {
            return Promise.resolve((filter) ? filter : null);
        }).catch(error => {
            console.error(error);
            return Promise.resolve(null);
        });
    }

    add(category: string, name: string, values: any[]): Promise<any> {
        return this.db.add(category, values, name).catch(error => {
            console.error(error);
            throw error;
        });
    }

    update(category: string, name: string, values: any[]): Promise<any> {
        return this.db.update(category, values, name).catch(error => {
            console.error(error);
            throw error;
        });
    }

    clear(category: string): Promise<any> {
        return this.db.clear(category).catch(error => {
            console.error(error);
            throw error;
        });
    }

}
