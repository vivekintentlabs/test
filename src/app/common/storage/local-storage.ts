import { KeyValueStorage } from './key-value-storage';


export class LocalStorage extends KeyValueStorage {

    init(): Promise<void> {
        return Promise.resolve();
    };

    private getName(category: string, name: string): string {
        return category + '_' + name;
    }

    get(category: string, name: string): Promise<any> {
        const value = localStorage.getItem(this.getName(category, name));
        return Promise.resolve(JSON.parse(value));
    }

    add(category: string, name: string, values: any[]): Promise<any> {
        localStorage.setItem(this.getName(category, name), JSON.stringify(values));
        return Promise.resolve();
    }

    update(category: string, name: string, values: any[]): Promise<any> {
        return this.add(category, name, values);
    }

    clear(category: string): Promise<any> {
        Object.keys(localStorage).filter(key => key.startsWith(category)).forEach(key => {
            localStorage.removeItem(key);
        })
        return Promise.resolve();
    }

}
