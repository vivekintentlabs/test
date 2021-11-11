import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { DateAdapter } from '@angular/material/core';
import { Router } from '@angular/router';
import { Subscription, throwError } from 'rxjs';

import { Constants } from '../common/constants';
import { ResponseMessage } from '../common/interfaces';
import { ErrorCode } from '../common/enums';
import { Colors, Utils } from '../common/utils';
import { UserInfo } from '../entities/userInfo';

import { LocaleService } from './locale.service';
import { ErrorMessageService } from './error-message.service';

@Injectable({
    providedIn: 'root',
})
export class HttpService implements OnDestroy {
    private static outdatedErrMsg = 'The contents in this tab are outdated. You will be redirected to the main page';
    private subscr: Subscription;
    private httpHeaders = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
    });

    private currentSchoolId: number = null;

    private static isUnauthorized(status: number): boolean {
        return status === 0 || status === 401 || status === 403;
    }

    constructor(
        private http: HttpClient,
        private router: Router,
        private dateAdapter: DateAdapter<Date>,
        private localeService: LocaleService,
        private errorMessageService: ErrorMessageService,
    ) {
    }

    public updateCurrentSchoolId(schoolId: number) {
        this.currentSchoolId = schoolId;
    }

    private checkSchoolIdOk() {
        const userInfo: UserInfo = Utils.getUserInfoFromToken();
        const schoolIdFromToken = userInfo != null ? userInfo.schoolId : null;
        const isSameSchool = schoolIdFromToken === this.currentSchoolId || this.currentSchoolId == null || schoolIdFromToken == null;
        if (!isSameSchool) {
            alert(HttpService.outdatedErrMsg);
            window.location.href = Utils.getBaseUrl();
        }
        return isSameSchool;
    }

    get(path: string, handleError = true): Promise<Object> {
        return this.http.get(Constants.noauthUrl + path, { observe: 'response' }).toPromise().then((res) => {
            return this.handleError(res, handleError);
        });
    }

    post(path: string, data: Object, handleError = true): Promise<Object> {
        return this.http.post(Constants.noauthUrl + path, data, {
            observe: 'response',
            headers: this.httpHeaders
        }).toPromise().then((res) => {
            this.updateTokenIfExists(res.body);
            return this.handleError(res, handleError);
        });
    }

    getAuth(path: string, handleError = true): Promise<Object> {
        if (this.checkSchoolIdOk()) {
            return this.http.get(Constants.authUrl + path, { observe: 'response' }).toPromise().then((res) => {
                this.updateTokenIfExists(res.body);
                return this.handleError(res, handleError);
            });
        } else {
            return Promise.reject(HttpService.outdatedErrMsg);
        }
    }

    deleteAuth(path: string, handleError = true): Promise<Object> {
        if (this.checkSchoolIdOk()) {
            return this.http.delete(Constants.authUrl + path, { observe: 'response' }).toPromise().then((res) => {
                this.updateTokenIfExists(res.body);
                return this.handleError(res, handleError);
            });
        } else {
            return Promise.reject(HttpService.outdatedErrMsg);
        }
    }

    postAuth(path: string, data: Object, handleError = true): Promise<Object> {
        if (this.checkSchoolIdOk()) {
            return this.http.post(Constants.authUrl + path, data, {
                observe: 'response', headers: this.httpHeaders
            }).toPromise().then((res) => {
                this.updateTokenIfExists(res.body);
                return this.handleError(res, handleError);
            });
        } else {
            return Promise.reject(HttpService.outdatedErrMsg);
        }
    }

    putAuth(path: string, data: Object, handleError = true): Promise<Object> {
        if (this.checkSchoolIdOk()) {
            return this.http.put(Constants.authUrl + path, data, {
                observe: 'response', headers: this.httpHeaders
            }).toPromise().then((res) => {
                this.updateTokenIfExists(res.body);
                return this.handleError(res, handleError);
            });
        } else {
            return Promise.reject(HttpService.outdatedErrMsg);
        }
    }

    postAuthForm(path: string, formData: FormData, handleError = true) {
        if (this.checkSchoolIdOk()) {
            return this.http.post(Constants.authUrl + path, formData, { observe: 'response' }).toPromise().then((res) => {
                return this.handleError(res, handleError);
            });
        } else {
            return Promise.reject(HttpService.outdatedErrMsg);
        }
    }

    postAuthImg(path: string, formData: FormData): Promise<Object> {
        if (this.checkSchoolIdOk()) {
            return this.http.post(Constants.authUrl + path, formData, { observe: 'response' }).toPromise().then((res) => {
                return this.handleError(res, true);
            });
        } else {
            return Promise.reject(HttpService.outdatedErrMsg);
        }
    }

    async postAuthBlob(path: string, data: Object): Promise<Blob> {
        if (!this.checkSchoolIdOk()) {
            return Promise.reject(HttpService.outdatedErrMsg);
        }
        const authData: HttpResponse<Blob> = await this.http.post(Constants.authUrl + path, data, {
            observe: 'response', headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Accept': 'application/json, application/zip, text/plain, */*'
            }),
            responseType: 'blob'
        }).toPromise();

        return new Promise<Blob>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    // if our blob does not contain zip file then throw an error
                    const msg = JSON.parse(reader.result as string);
                    if (msg.errorCode != null) {
                        const errMsg: string = await this.errorMessageService.getMessage(msg.errorCode, msg.errorMessage, msg?.params);
                        Utils.showNotification(errMsg, Colors.danger);
                        reject(msg);
                    }
                } catch (e) {
                    resolve(authData.body);
                    // ignore, we expect a blob
                }
            };
            const blob: Blob = authData.body;
            reader.readAsText(blob);
        });
    }

    private updateTokenIfExists(body: any) {
        if (body.token) {
            Utils.setToken(body.token);
            if (this.localeService.getCurrentLocale()) {
                this.dateAdapter.setLocale(this.localeService.getCurrentLocale());
            }
        }
    }

    private async handleError(res, handleError): Promise<Object> {
        const msg: ResponseMessage = res.body;
        if (HttpService.isUnauthorized(res.status) || msg.errorCode === ErrorCode.maintenance_mode) {
            Utils.logout(this.router);
            if (msg.errorCode === ErrorCode.maintenance_mode) {
                if (!this.subscr) {
                    this.subscr = throwError(msg.errorMessage).subscribe({
                        error: val => Utils.showNotification(val, Colors.danger)
                    });
                }
                setTimeout(() => {
                    this.ngOnDestroy();
                }, 1500);
            }
            return Promise.resolve({});
        } else {
            if (msg.errorCode !== ErrorCode.no_error) {
                const errMsg: string = await this.errorMessageService.getMessage(msg.errorCode, msg.errorMessage, msg?.params);
                if (handleError) {
                    Utils.showNotification(errMsg, Colors.danger);
                }
                return Promise.reject(msg);
            }
            return Promise.resolve(msg.data);
        }
    }

    ngOnDestroy() {
        if (this.subscr) {
            this.subscr.unsubscribe();
            this.subscr = undefined;
        }
    }
}
