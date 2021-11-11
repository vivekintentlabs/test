import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Router, NavigationEnd } from '@angular/router';
import * as _ from 'lodash';

type PromiseFunction = () => Promise<Object>;

@Injectable({
    providedIn: 'root',
})
export class DataService {

    private callmap: Map<string, { resetOnPageChange: boolean, data: Promise<object> }>
        = new Map<string, { resetOnPageChange: boolean, data: Promise<object> }>();

    constructor(private httpService: HttpService, private router: Router) {
        this.router.events.subscribe((event: any) => {
            if (event instanceof NavigationEnd) {
                this.resetOnPageChange();
            }
        });
    }

    /**
     *
     * @param url
     * @param useCached
     * @param resetOnPageChange
     */
    public getAuth(url: string, useCached: boolean = true, resetOnPageChange: boolean = true): Promise<object> {
        const promiseFunction: PromiseFunction = () => {
            return this.httpService.getAuth(url);
        };
        return this.cache(url, useCached, resetOnPageChange, promiseFunction);
    }

    /**
     *
     * @param url
     * @param useCached
     * @param resetOnPageChange
     */
    public get(url: string, useCached: boolean = true, resetOnPageChange: boolean = true): Promise<object> {
        const promiseFunction: PromiseFunction = () => {
            return this.httpService.get(url);
        };
        return this.cache(url, useCached, resetOnPageChange, promiseFunction);
    }

    /**
     *
     * @param url
     * @param params
     * @param useCached
     * @param resetOnPageChange
     */
    public postAuth(url: string, params: any, useCached: boolean = true, resetOnPageChange: boolean = true): Promise<object> {
        const promiseFunction: PromiseFunction = () => {
            return this.httpService.postAuth(url, params);
        };
        return this.cache(url, useCached, resetOnPageChange, promiseFunction);
    }

    /**
     *
     * @param url
     * @param useCached
     * @param resetOnPageChange
     * @param promiseFunction
     */
    private cache(url: string, useCached: boolean = true, resetOnPageChange: boolean = true, promiseFunction: PromiseFunction): Promise<object> {
        if ((!useCached || !this.callmap.get(url))) {
            const promise = promiseFunction();
            this.callmap.set(url, { resetOnPageChange, data: promise });
            return promise;
        } else {
            return this.callmap.get(url).data;
        }
    }

    public resetOne(url: string) {
        this.callmap.delete(url);
    }

    public resetAll() {
        this.callmap = new Map<string, { resetOnPageChange: boolean, data: Promise<object> }>();
    }

    private resetOnPageChange() {
        this.resetPageDependentData();
    }

    public resetPageDependentData() {
        this.callmap.forEach((element, key) => {
            if (element.resetOnPageChange) {
                this.callmap.delete(key);
            }
        });
    }


}
