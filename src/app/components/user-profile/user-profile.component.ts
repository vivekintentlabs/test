import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { User } from '../../entities/user';
import { UserInfo } from '../../entities/userInfo';
import { Utils } from '../../common/utils';
import { Constants } from '../../common/constants';
import { HttpService } from '../../services/http.service';

import * as _ from 'lodash';
import { version } from 'moment';
import { StorageService } from 'app/services/storage.service';
import { environment } from 'environments/environment';

declare var $: any;


@Component({
    selector: 'app-user-profile-cmp',
    templateUrl: 'user-profile.component.html'
})

export class UserProfileComponent implements OnInit, OnDestroy {
    userProfileForm: FormGroup;
    userInfo: UserInfo = null;
    user: User = null;
    loaded = false;
    isMobile = false;
    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength
    length50 = Constants.length50;
    length60 = Constants.length60;
    public brand = environment.brand;

    constructor(
        private httpService: HttpService,
        private fb: FormBuilder,
        private storageService: StorageService) {
    }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.getUserProfile().then(() => {
            this.createUserProfileForm();
            this.loaded = true;
        });
        if (window.screen.width < 470) {
            this.isMobile = true;
        }
    }

    private getUserProfile(): Promise<any> {
        return this.httpService.getAuth('users/get-current').then((user: User) => {
            this.user = user;
            this.checkUserVersion();
        }).catch(err => console.log(err));
    }

    private createUserProfileForm() {
        this.userProfileForm = this.fb.group({
            id: [this.user.id],
            firstName: [
                this.user.firstName,
                Validators.compose([
                    Validators.required,
                    Validators.minLength(this.requiredTextFieldMinLength),
                    Validators.maxLength(this.length50)
                ],
            )],
            lastName: [
                this.user.lastName,
                Validators.compose([
                    Validators.required,
                    Validators.minLength(this.requiredTextFieldMinLength),
                    Validators.maxLength(this.length50)
                ])
            ],
            email: [this.user.email],
            role: [this.user.role],
            title: [
                this.user.title,
                Validators.compose([
                    Validators.required,
                    Validators.minLength(Constants.requiredTextFieldMinLength),
                    Validators.maxLength(this.length60)
                ])
            ],
            sendNotifications: [this.user.sendNotifications]
        });
    }

    onSubmit() {
        this.httpService.postAuth('users/save-profile', this.userProfileForm.value).then(() => {
            $('#userProfileModal').modal('hide');
            this.userProfileForm.markAsPristine();
            this.user = this.userProfileForm.value;
            Utils.showSuccessNotification();
        }).catch((err) => {
            console.log(err);
        });
    }

    userProfileCancel() {
        this.createUserProfileForm();
        $('#userProfileModal').modal('hide');
    }

    onCancel() {
        $('#whatsNewModal').modal('hide');
    }

    checkUserVersion() {
        const userVersion: string = this.user.last_shown_version;
        const currentVersion: string = Constants.version;
        if (this.isNewRelease(userVersion, currentVersion)) {
            $('#whatsNewModal').modal('show');
        }
        if (userVersion !== currentVersion) { // always update if different, also for hot fixes
            // TODO remove next three lines when merging back 0.11.2 to develp[]
            if (currentVersion === '0.11.2' || currentVersion === '0.11.3') {
                this.storageService.resetFilters();
            }
            this.user.last_shown_version = currentVersion;
            this.httpService.postAuth('users/update-shown-version', { version: currentVersion }).catch((err) => {
                console.log(err);
            });
        }
    }


    /**
     * Checks if the version number means a new release. we only look at the first 3 digits for this. e.g if the current
     * version is 0.9.1, 0.10.0 would mean a new minor release, but 0.9.2 only a hotfix
     */
    private isNewRelease(userversionNumber: string, currentVersionNumber: string): boolean {
        const userVersion = userversionNumber ? Utils.TryParseNumbersFromArray(userversionNumber.split('.')) : [0, 0, 0];
        const currentVersion = currentVersionNumber ? Utils.TryParseNumbersFromArray(currentVersionNumber.split('.')) : [0, 0, 0];
        let isNewRelease = false;
        if (this.isVersionValid(userVersion) && this.isVersionValid(currentVersion)) {
            if (
                (currentVersion[0] > userVersion[0]) || // new major version
                (currentVersion[0] === userVersion[0] && currentVersion[1] > userVersion[1]) // new minor version
            ) {
                isNewRelease = true;
            }
        }
        return isNewRelease;
    }

    private isVersionValid(versionArray: Array<number | null>) {
        // check if data is valid, should be in format w.x.y.z or w.x.y where w,z,y,z are all valid numbers (not null)
        const isVersionValid = (versionArray.length === 3 || versionArray.length === 4) && !(_(versionArray).some((el) => el == null));
        // if the version is not valid, show it console, this should never happen!
        if (!isVersionValid) {
            console.error('ET version number has invalid format!');
        }

        return isVersionValid;
    }

    public ngOnDestroy() {
        Utils.disposeModal('#userProfileModal');
        Utils.disposeModal('#whatsNewModal');
    }
}
