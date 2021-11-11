import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { BaseForm } from 'app/base-form';
import { HttpService } from '../../services/http.service';
import { Constants } from '../../common/constants';
import { Utils, Colors } from '../../common/utils';
import { ISelectUserData } from '../../common/interfaces';
import { User } from '../../entities/user';
import { emailValidator } from 'app/validators/email.validator';

import { SelectUserDialogComponent } from '../../components/select-user-dialog/select-user-dialog.component';

import Swal from 'sweetalert2';
import * as _ from 'lodash';
declare var $: any;

@Component({
    selector: 'app-add-user',
    templateUrl: './add-user.component.html'
})
export class AddUserComponent extends BaseForm implements OnInit, OnDestroy {
    loaded = false;
    title = 'Add User';
    roles: string[] = [];
    userInfo = null;
    noItemSelected = Constants.noItemSelected; // show constant string in html
    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    length50 = Constants.length50;
    length60 = Constants.length60;
    emailMaxLength = Constants.emailMaxLength;

    users: User[] = [];
    isDeletable: boolean;
    selectUserData: ISelectUserData = { htmlId: 'selectUserEditUser' } as ISelectUserData;
    selectUserSub: Subscription;

    constructor(
        private fb: FormBuilder, private route: ActivatedRoute, private router: Router,
        private httpService: HttpService, private dialog: MatDialog
    ) {
        super();
    }

    public ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        const paramId = (this.route.params['value'].id) ? this.route.params['value'].id : null;

        this.httpService.getAuth('users/get-roles').then((roles: string[]) => {
            this.roles = roles;
            if (paramId) {
                this.title = 'Edit User';
                this.httpService.getAuth('users/get-user/' + paramId).then((res: any) => {
                    _.remove(this.users, (u: User) => u.id === res.user.id);
                    this.isDeletable = res.isDeletable;
                    this.createForm(res.user);
                }).catch(err => console.log(err));
            } else {
                this.createForm(new User());
            }
        });
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        if (this.selectUserSub) {
            this.selectUserSub.unsubscribe();
        }
    }

    private createForm(user?: User) {
        this.formGroup = this.fb.group({
            id: [user.id],
            firstName: [user.firstName, Validators.compose([
                Validators.required,
                Validators.minLength(this.requiredTextFieldMinLength),
                Validators.maxLength(this.length50)
            ])],
            lastName: [user.lastName, Validators.compose([
                Validators.required,
                Validators.minLength(this.requiredTextFieldMinLength),
                Validators.maxLength(this.length50)
            ])],
            email: [user.email, Validators.compose([
                Validators.required, emailValidator, Validators.maxLength(this.emailMaxLength)
            ])],
            title: [user.title, Validators.compose([
                Validators.required,
                Validators.minLength(this.requiredTextFieldMinLength), Validators.maxLength(this.length60)
            ])],
            role: [{ value: user.role, disabled: (this.userInfo.id === user.id) }, Validators.compose([Validators.required])],
            sendNotifications: [user?.sendNotifications ?? false],
            activated: [(user.activated) ? true : false],
            invite: [false],
            schoolId: (user.schoolId) ? user.schoolId : this.userInfo.schoolId
        });
        this.loaded = true;
        this.listenToFormChanges();
    }

    onSubmit() {
        this.submit().then(() => {
            this.lastAction();
        }).catch((err) => {
            console.log(err);
        });
    }

    onCancel() {
        super.onCancel();
        this.router.navigate(['/admin/school-users']);
    }

    statusChanged() {
        this.formGroup.controls.invite.setValue(false);
    }

    private lastAction() {
        this.router.navigate(['/admin/school-users']);
    }

    protected doSubmit(): Promise<void> {
        if (!this.formGroup.value.activated && this.isDeletable && this.formGroup.value.id) {
            return this.submitPrompt();
        } else {
            return this.saveUser().then(() => {
                if (this.formGroup.value.activated && this.formGroup.value.invite) {
                    return this.inviteUser(this.formGroup.value.email).then(() => {
                        return Promise.resolve();
                    });
                } else {
                    return Promise.resolve();
                }
            });
        }
    }

    private saveUser() {
        return this.httpService.postAuth('users/add-user', this.formGroup.value).then(() => {
            Utils.showSuccessNotification();
            return Promise.resolve();
        });
    }

    private submitPrompt(): Promise<any> {
        return new Promise<void>((resolve, reject) => {
            Swal.fire({
                title: 'Are you sure?',
                html: 'This user will no longer be active. You need to re-assign any new tasks or events to another user to continue.\
                        <br><br>\
                        <button class="btn btn-cancel cancel">Cancel</button>\
                        <button class="btn btn-success select-user">Select User</button>',
                type: 'warning',
                showConfirmButton: false,
                onOpen: (swalEditUser) => {
                    $(swalEditUser).find('.select-user').off().click((e) => {
                        Swal.close();
                        this.httpService.getAuth('users/get-activated-users').then((users: User[]) => {
                            _.remove(users, (u: User) => u.id === this.formGroup.value.id);
                            this.selectUserData.users = users;
                            const selctUsermDialogRef = this.dialog.open(
                                SelectUserDialogComponent,
                                SelectUserDialogComponent.getDialogConfig(this.selectUserData)
                            );
                            this.selectUserSub = selctUsermDialogRef.afterClosed().subscribe(id => {
                                if (id) {
                                    this.httpService.postAuth('users/reassign-user', {
                                        userId: this.formGroup.value.id, reassignUserId: id
                                    }).then(() => {
                                        this.saveUser().then(() => {
                                            this.lastAction();
                                            resolve();
                                        });
                                    });
                                } else {
                                    reject();
                                }
                            });
                        }).catch((err) => {
                            reject(err);
                        });
                    });
                    $(swalEditUser).find('.cancel').off().click((e) => {
                        Swal.close();
                        reject(e);
                    });
                }
            });
        });
    }

    private inviteUser(email: string): Promise<void> {
        return this.httpService.postAuth('users/invite', { email }).then(() => {
            Utils.showNotification('Invite message has been sent to user', Colors.success);
            return Promise.resolve();
        }).catch(err => console.log(err));
    }
}
