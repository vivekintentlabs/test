import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { emailValidator } from 'app/validators/email.validator';
import { HttpService } from 'app/services/http.service';
import { Constants } from 'app/common/constants';
import { ModalAction } from 'app/common/enums';

@Component({
    selector: 'app-send-test-email-popup',
    templateUrl: 'send-test-email.component.html'
})
export class SendTestEmailComponent implements OnInit {

    sendTestEmailForm: FormGroup = null;

    constructor(
        private fb: FormBuilder,
        private httpService: HttpService,
        private activeModal: NgbActiveModal
    ) { }

    ngOnInit() {
        return this.httpService.getAuth('users/get-email-current-user').then((email: string) => {
            this.createForm(email);
        }).catch(err => console.log(err));
    }

    private createForm(email: string) {
        this.sendTestEmailForm = this.fb.group({
            email: [
                email,
                Validators.compose([
                    Validators.required,
                    emailValidator,
                    Validators.maxLength(Constants.emailMaxLength)
                ])
            ],
        });
        this.sendTestEmailForm.markAsDirty();
    }

    sendTestEmail() {
        this.activeModal.close({ action: ModalAction.Done, email: this.sendTestEmailForm.controls.email.value });
    }

    onCancel() {
        this.activeModal.close({ action: ModalAction.Cancel });
    }
}
