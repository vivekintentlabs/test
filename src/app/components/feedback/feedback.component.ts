import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from 'environments/environment';

import { Utils, Colors } from '../../common/utils';
import { HttpService } from '../../services/http.service';

declare var $: any;


@Component({
    selector: 'app-feedback-cmp',
    templateUrl: 'feedback.component.html'
})

export class FeedbackComponent implements OnInit, OnDestroy {
    feedbackForm: FormGroup;
    loaded = false;
    public brand = environment.brand;

    constructor(
        private httpService: HttpService,
        private fb: FormBuilder) {
    }

    ngOnInit() {
        this.createFeedbackForm();
        this.loaded = false;
    }

    private createFeedbackForm() {
        this.feedbackForm = this.fb.group({
            html: [null, Validators.required],
        });
    }

    sendFeedback() {
        this.httpService.postAuth('users/feedback', { html: this.feedbackForm.value.html.replace(/\r?\n/g, '<br />') }).then((res) => {
            $('#feedbackModal').modal('hide');
            Utils.showNotification('Feedback message has been sent, thanks.', Colors.success);
            this.feedbackForm.reset();
        });
    }

    onCancel() {
        this.feedbackForm.reset();
        $('#feedbackModal').modal('hide');
    }

    ngOnDestroy()
    {
        Utils.disposeModal('#feedbackModal');
    }

}
