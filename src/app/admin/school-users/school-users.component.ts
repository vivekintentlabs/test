import { Component, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { HttpService } from '../../services/http.service';
import { StorageService } from 'app/services/storage.service';

import { PageLeaveReason } from 'app/common/enums';
import { Utils, Colors } from '../../common/utils';
import { ISelectUserData, ChildCmpState } from '../../common/interfaces';
import { Constants } from '../../common/constants';

import { School } from '../../entities/school';
import { User } from '../../entities/user';
import { UserInfo } from '../../entities/userInfo';

import { SelectUserDialogComponent } from '../../components/select-user-dialog/select-user-dialog.component';
import { EmailSignatureComponent } from '../../components/email-signature/email-signature.component';
import { BaseTable } from 'app/base-table';

import * as _ from 'lodash';
import Swal from 'sweetalert2';

declare var $: any;

@Component({
    selector: 'app-table-school-users',
    templateUrl: 'school-users.component.html',
    styleUrls: ['./school-users.component.scss']
})
export class SchoolUsersComponent extends BaseTable<User> implements AfterViewInit, OnDestroy {

    schoolUsers: Array<Object> = [];
    userInfo: UserInfo = null;
    users: Array<User> = [];
    noItemSelected = Constants.noItemSelected; // show constant string in html
    dateDelimiterTime = Constants.localeFormats.dateDelimiterTime;
    school: School;
    public tableId = 'schoolUsersTable';

    selectUserData: ISelectUserData = <ISelectUserData>{ htmlId: 'selectUserSchoolUser' };
    selectUserSub: Subscription;
    @ViewChild(EmailSignatureComponent) emailSignatureComponent;

    private changed = 0;
    private submitted = false;

    constructor(
        private router: Router,
        private httpService: HttpService,
        private dialog: MatDialog,
        storageService: StorageService
    ) {
        super(storageService);
        this.displayedColumns = ['name', 'email', 'activated', 'role', 'sendNotifications', 'lastLogin', 'actions'];
    }

    ngAfterViewInit() {
        this.userInfo = Utils.getUserInfoFromToken();

        this.httpService.getAuth('users').then((data: { users: Array<User>, school: School }) => {

            this.users = data.users;
            this.school = data.school;
            _.forEach(this.users, (user: User) => {
                this.schoolUsers.push({
                    id: user.id, lastName: user.lastName, firstName: user.firstName, email: user.email, activated: user.activated,
                    role: user.role, sendNotifications: user.sendNotifications, lastLogin: user.lastLogin, schoolName: user.school.name
                });
            });
            this.buildTable(this.users)
        });
    }

    protected buildTable(users) {
        users.forEach(u => {
            u.name = u.lastName + ', ' + u.firstName;
        });
        super.buildTable(users);
        this.updateTable(users);
    }

    emailSignatureStateChanged(info: ChildCmpState) {
        this.changed = info.changed - 1;
        this.submitted = info.submitted;
    }

    canDeactivate(): Promise<boolean> {
        return Utils.canDeactivate(
            this.changed, this.submitted,
            this.emailSignatureComponent.emailSignatureForm == null || this.emailSignatureComponent.emailSignatureForm.valid
        ).then((can) => {
            if (can === PageLeaveReason.save) {
                return this.doSubmit().catch(() => {
                    return false;
                });
            } else if (can === PageLeaveReason.goBack) {
                return false;
            } else if (can === PageLeaveReason.doNotSave) {
                return true;
            }
        });
    }

    private doSubmit(): Promise<boolean> {
        if (this.changed > 0 && !this.submitted) {
            return this.emailSignatureComponent.submit().then(() => {
                Utils.showSuccessNotification();
                return Promise.resolve(true);
            });
        } else {
            return Promise.resolve(true);
        }
    }

    ngOnDestroy() {
        if (this.selectUserSub) {
            this.selectUserSub.unsubscribe();
        }
    }

    addSchoolUser() {
        this.router.navigate(['/admin/add-user']);
    }

    editSchoolUser(id: number) {
        this.router.navigate(['/admin/edit-user', id]);
    }

    inviteUser(email: string) {
        this.httpService.postAuth('users/invite', { email: email }).then((res) => {
            Utils.showNotification('Invite message has been sent to user', Colors.success);
        }).catch((err) => {
            console.log(err);
        });
    }

    updateSendNotifications(sendNotifications: boolean, id: number) {
        const user: User = new User();
        user.id = id;
        user.sendNotifications = sendNotifications;
        this.httpService.postAuth('users/update-send-notifications', user).then((res) => {
            Utils.showSuccessNotification();
        }).catch(err => console.log(err));
    }

    deleteSchoolUser(userId: number) {
        this.httpService.postAuth('users/deletable', { userId: userId }).then((isDeletable: boolean) => {
            if (isDeletable) {
                const self = this;
                return Swal.fire({
                    title: 'Are you sure?',
                    html: 'You will not be able to revert this! To continue you must assign any new tasks or events to another user.\
                            <br><br>\
                            <button class="btn btn-cancel cancel">Cancel</button>\
                            <button class="btn btn-success select-user">Select User</button>',
                    type: 'warning',
                    showConfirmButton: false,
                    onOpen(swalSchoolUsers: HTMLElement) {
                        $(swalSchoolUsers).find('.select-user').off().click((e) => {
                            Swal.close();
                            const usrs = _.filter(self.users, (item: User) => item.activated === true);
                            _.remove(usrs, (item: User) => item.id === userId);
                            self.selectUserData.users = usrs;
                            // tslint:disable-next-line:max-line-length
                            const selctUsermDialogRef = self.dialog.open(SelectUserDialogComponent, SelectUserDialogComponent.getDialogConfig(self.selectUserData));
                            self.selectUserSub = selctUsermDialogRef.afterClosed().subscribe(id => {
                                if (id !== undefined) {
                                    self.httpService.postAuth('users/reassign-user', { userId: userId, reassignUserId: id }).then(() => {
                                        self.httpService.getAuth('users/delete-user/' + userId).then(() => {
                                            _.remove(self.schoolUsers, (user: any) => user.id === userId);
                                            _.remove(self.users, (user: any) => user.id === userId);
                                            self.emailSignatureComponent.getEmailSignature();
                                            self.buildTable(self.schoolUsers)
                                            Utils.deletedSuccessfully();
                                        }).catch(err => console.log(err));
                                    }).catch(err => console.log(err));
                                } else {
                                    return false;
                                }
                            });
                        });
                        $(swalSchoolUsers).find('.cancel').off().click((e) => {
                            Swal.close();
                            return false;
                        });
                    }
                });
            } else {
                Utils.delete('users/delete-user/', userId, this.httpService).then((res) => {
                    if (res) {
                        _.remove(this.schoolUsers, (user: any) => user.id === userId);
                        this.buildTable(this.schoolUsers)
                    }
                }).catch(err => console.log(err));
            }
        });
    }
}
