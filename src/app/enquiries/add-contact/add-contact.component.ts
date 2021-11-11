import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Utils } from '../../common/utils';
import { PageLeaveReason } from '../../common/enums';
import { Constants } from 'app/common/constants';

import { Contact } from '../../entities/contact';
import { Student } from '../../entities/student';

import { EditContactComponent } from 'app/components/edit-contact/edit-contact.component';

@Component({
    selector: 'app-add-contact',
    templateUrl: './add-contact.component.html'
})
export class AddContactComponent implements OnInit, OnDestroy {
    title = 'Add Contact';
    sub: Subscription;
    contactId: number = null;
    contact: Contact;
    contactEditForm: FormGroup;
    students: Array<Student> = [];
    trigger = false;
    dateTime = Constants.localeFormats.dateTime;
    timeZone: string;

    private changed = 0;
    private submitted = false;
    @ViewChild(EditContactComponent) editContactComponent;

    constructor(private route: ActivatedRoute) { }

    public ngOnInit() {
        this.sub = this.route.params.subscribe(params => {
            this.contactId = +params.contactId || 0;
        });

        if (this.contactId > 0) {
            this.title = 'Edit Contact';
        }
    }

    ngOnDestroy() {
        if (this.sub != null) {
            this.sub.unsubscribe();
        }
    }

    canDeactivate(): Promise<boolean> {
        return Utils.canDeactivate(this.changed, this.submitted, this.editContactComponent.contactEditForm.valid).then((can) => {
            if (can === PageLeaveReason.save) {
                return this.doSubmit(true).catch(() => {
                    return false;
                });
            } else if (can === PageLeaveReason.goBack) {
                return false;
            } else if (can === PageLeaveReason.doNotSave) {
                return true;
            }
        });
    }

    private doSubmit(submitFromConfirmDialog: boolean): Promise<boolean> {
        if (this.changed > 0 && !this.submitted) {
            return this.editContactComponent.submit(submitFromConfirmDialog).then(() => {
                return Promise.resolve(true);
            });
        } else {
            return Promise.resolve(true);
        }
    }

    infoFromChild(info: any) {
        this.changed = info.changed;
        this.submitted = info.submitted;
    }

    contactData(data: any) {
        this.contact = data.contact;
        this.timeZone = data.timeZone;
    }

    refreshRelatedContactComponent(students: Array<Student>) {
        this.students = students;
        this.trigger = !this.trigger;
    }

}
