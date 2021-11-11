import { Component, OnInit, OnDestroy, NgZone, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';

import { BaseForm } from 'app/base-form';

import { Utils } from '../../common/utils';
import { Constants } from '../../common/constants';
import { FormType } from '../../common/enums';
import { adminToolbar, basicToolbar, initTinyMCE } from 'app/common/tinymce-helper';

import { UserInfo } from '../../entities/userInfo';
import { Translation } from '../../entities/translation';
import { School } from 'app/entities/school';
import { Webform } from '../../entities/webform';
import { HttpService } from '../../services/http.service';
import { SetupFormHeaderFooterComponent } from 'app/components/form-header-footer/setup-form-header-footer/setup-form-header-footer.component';

import * as _ from 'lodash';
import * as tinymce from 'tinymce';

declare var $: any;


@Component({
    selector: 'app-signups-form',
    templateUrl: 'signup-forms.component.html'
})

export class SignupFormsComponent extends BaseForm implements OnInit, OnDestroy {
    userInfo: UserInfo = null;
    signupForms: Webform[] = null;
    headerRow: string[] = ['Name', 'Display', 'Submissions', 'Actions'];
    conducts: Translation[];
    conducTitle = '';
    conductText = '';
    text = '';
    school: School;

    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    nameMaxLength = Constants.nameMaxLength;
    @ViewChild('SetupFormHeaderFooterComponent') setupFormHeaderFooterComponent: SetupFormHeaderFooterComponent;

    constructor(
        private fb: FormBuilder,
        private httpService: HttpService,
        private router: Router,
        private zone: NgZone
    ) {
        super();
    }

    public ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        return this.httpService.getAuth('webform').then((webforms: Webform[]) => {
            this.signupForms = webforms;
            this.getConduct();
        }).catch(err => {
            console.log(err);
        });
    }

    public getConduct() {
        this.httpService.getAuth('webform/get-conduct').then((conducts: Translation[]) => {
            const displayConduct = Constants.webFormFields.displayConduct;
            this.conducts = conducts;
            this.school = _.first(conducts).school;
            this.conducTitle = Utils.getTranslation(conducts, Constants.translationPrefix.fd, displayConduct, Translation.SUBCATEGORY_GENERAL, Translation.CATEGORY_WEBFORM);
            this.conductText = Utils.getTranslation(conducts, Constants.translationPrefix.fl, displayConduct, Translation.SUBCATEGORY_GENERAL, Translation.CATEGORY_WEBFORM);
            this.createForm();
        }).catch(err => console.log(err));
    }

    previewSignupFrom(signupForm: Webform) {
        switch (signupForm.formType) {
            case FormType.prospectus_request:
                window.open(`/webforms/prospectus-request/${signupForm.uniqId}?preview=true`, '_blank');
                break;
            case FormType.event_registration:
                window.open(`/webforms/event-registration/${signupForm.uniqId}?preview=true`, '_blank');
                break;
            case FormType.general:
                window.open(`/webforms/general/${signupForm.uniqId}?preview=true`, '_blank');
                break;
            default:
                break;
        }
    }

    editSignupFrom(id: number) {
        this.router.navigate(['/admin/edit-signup-form', { id }]);
    }

    delete(id: number) {
        Utils.delete('webform/delete/', id, this.httpService).then(() => {
            this.router.navigate(['dashboard/sendback']).then(() => {
                this.router.navigate(['/admin/signup-forms']);
            });
        }).catch(err => {
            console.log(err);
        });
    }

    initTinyMCE() {
        const self = this;
        const toolbar = self.userInfo.isSysAdmin() ?  adminToolbar : basicToolbar;
        const config = {
            selector: '#sendProspectus',
            height: '150',
            toolbar,
            setup: (editor) => {
                editor.addButton('insertFields', {
                    type: 'listbox',
                    text: '<Insert Fields>',
                    icon: false,
                    onselect(e) {
                        editor.insertContent(this.value());
                    },
                    values: [
                        { text: 'School Name', value: '&nbsp;< SCHOOL NAME >' }
                    ]
                });
                editor.addButton('preview', {
                    text: 'Preview',
                    icon: false,
                    onclick() {
                        self.previewConduct();
                    }
                });
                editor.addButton('help1', {
                    icon: 'help',
                    onclick() {
                        self.helpConduct();
                    }
                });
                editor.on('change keyup input', () => {
                    this.zone.run(() => {
                        this.formGroup.controls.text.setValue(editor.getContent());
                        this.formGroup.controls.text.markAsDirty();
                        this.changed += 1;
                        this.submitted = false;
                    });
                });
            }
        };
        initTinyMCE(config);
    }

    private createForm() {
        this.formGroup = this.fb.group({
            title: [this.conducTitle, Validators.compose([
                Validators.required,
                Validators.minLength(this.requiredTextFieldMinLength),
                Validators.maxLength(this.nameMaxLength)
            ])],
            text: [this.conductText]
        });
        this.listenToFormChanges();
        tinymce.remove();
        setTimeout(() => {
            this.initTinyMCE();
        }, 1);
    }

    onSubmit() {
        this.submit();
    }

    protected doSubmit(): Promise<void> {
        const data: Object = _.cloneDeep(this.formGroup.value);
        return this.httpService.postAuth('webform/update-conduct', data).then(() => {
            this.formGroup.markAsPristine();
            Utils.showSuccessNotification();
            return Promise.resolve();
        });
    }

    onCancel() {
        super.onCancel();
        this.createForm();
    }

    public previewConduct() {
        this.transformText();
        $('#previewConductModal').modal('show');
    }

    public helpConduct() {
        $('#helpConductModal').modal('show');
    }

    public transformText() {
        const text = this.formGroup.controls.text.value;
        const transformedText = Utils.replaceTag(text, '&lt; SCHOOL NAME &gt;', this.school ? this.school.name : '');
        this.text = transformedText;
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        Utils.destroyTinyMCE('#sendProspectus');
        Utils.disposeModal('#helpConductModal');
        Utils.disposeModal('#previewConductModal');
        // to do dispose tinymce
    }

    canDeactivate(): Promise<boolean> {
        return super.canDeactivate()
            .then((res) => {
                if (res) {
                    return this.setupFormHeaderFooterComponent.canDeactivate();
                } else {
                    return res;
                }
            });
    }
}
