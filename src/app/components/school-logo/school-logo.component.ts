import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpEvent } from '@angular/common/http';
import { HttpService } from '../../services/http.service';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Utils, Colors } from '../../common/utils';
import { UserInfo } from '../../entities/userInfo';
import { Subject } from 'rxjs';
import { Constants } from '../../common/constants';
import { takeUntil } from 'rxjs/operators';

import * as moment from 'moment';

// https://ackerapple.github.io/angular-file/, self exaplantory documentation there
@Component({
    selector: 'app-school-logo',
    templateUrl: './school-logo.component.html',
    styleUrls: ['./school-logo.component.scss']
})
export class SchoolLogoComponent implements OnInit, OnDestroy {
    userInfo: UserInfo = null;
    files: FileList[] = [];
    sendableFormData: FormData; // populated via ngfFormData directive
    progress: number;
    httpEvent: HttpEvent<FormData>;
    currentLogoURI: string;
    constants = Constants;
    uploading = false;
    message = '';
    colourTr = '';
    private ngUnsubScribe = new Subject();

    constructor(private httpService: HttpService, private translate: TranslateService) {
        this.getColourTranslate();
        this.translate.onLangChange.pipe(takeUntil(this.ngUnsubScribe)).subscribe((event: LangChangeEvent) => {
            this.getColourTranslate();
        });
    }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        return this.httpService.getAuth('file/get-url-logo', false).then((res: string) => {
            this.currentLogoURI = res ? `${res}?${moment().format('x')}` : '';
        }).catch(err => {
            Utils.showNotification(Constants.logoErrorText, Colors.danger);
        });
    }

    cancel() {
        this.progress = 0;
        this.files = [];
    }

    ngOnDestroy() {
        this.ngUnsubScribe.next();
        this.ngUnsubScribe.complete();
    }

    filesChange(event) {
        const fileList: FileList = event;
        if (fileList.length > 0) {
            const file: File = fileList[fileList.length - 1];
            const url = window.URL;
            const img = new Image();
            img.src = url.createObjectURL(file);
            const self = this;
            img.onload = function () {
                if (Constants.maxHeight >= img.width && Constants.maxHeight >= img.height && file.size <= Constants.maxLogoSize) {
                    self.progress = 0;
                    if (self.files && self.files.length > 1) {
                        self.files = [self.files[self.files.length - 1]];
                    }
                } else {
                    // tslint:disable-next-line:max-line-length
                    Utils.showNotification('Your logo should be in ' + self.colourTr + ', cropped and centered. Please upload a .JPG or .PNG file no larger than '
                        + Constants.maxWidth + ' px x ' + Constants.maxHeight + ' px, size 2Mb.', Colors.danger);
                    self.files = [];
                }
            };
        }
    }

    uploadFiles() {
        this.uploading = true;
        return this.httpService.postAuthImg('file/save-logo', this.sendableFormData).then(() => {
            this.currentLogoURI = null;
            this.files = [];
            this.ngOnInit();
            this.uploading = false;
            Utils.showSuccessNotification('Logo succesfully uploaded.');
        });
    }

    private getColourTranslate() {
        this.translate.get('et.colour').pipe(takeUntil(this.ngUnsubScribe)).subscribe((colour: string) => {
            this.colourTr = colour;
            this.message = 'Your logo should be in ' + colour + ', cropped and centered. \
                Please upload a .JPG or .PNG file no larger than ' +
                Constants.maxWidth + 'px x ' + Constants.maxHeight + 'px, size 2Mb.';
        });
    }

}
