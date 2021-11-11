import { Injectable } from '@angular/core';
import { HttpService } from 'app/services/http.service';
import { Router } from '@angular/router';
import { SchoolDoc } from './interfaces/documents/school-doc';

@Injectable({
    providedIn: 'root',
})
export class FormHeaderFooterService {
    readonly BASE_URL: string         = 'applications';
    readonly BASE_URL_WEBFORM: string = 'application-webform';

    constructor(private httpService: HttpService, private router: Router) {}

    public getSchoolHeaderAndFooter(schoolUniqId: string, shouldReplaceTags = false): Promise<any> {
        return this.httpService.get(this.BASE_URL_WEBFORM + '/school-header-footer/' + schoolUniqId + '/' + ((shouldReplaceTags) ? 1 : 0));
    }

    public saveSchoolHeaderAndFooter(data: Partial<SchoolDoc>): Promise<any> {
        return this.httpService.postAuth(this.BASE_URL + '/school-header-footer', data);
    }
}
