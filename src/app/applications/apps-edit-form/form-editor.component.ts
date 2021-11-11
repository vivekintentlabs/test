import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawerMode } from '@angular/material/sidenav/drawer';
import { EntityDirtyCheckPlugin } from '@datorama/akita';
import { FormProperty, Binding, SchemaValidatorFactory, ISchema } from 'ngx-schema-form';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Utils, Colors } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { ModalAction, PageLeaveReason } from 'app/common/enums';
import { ApplicationsService } from 'app/applications/applications.service';
import { AppFormTemplate } from 'app/applications/interfaces/app-form-template';
import { StepperUIStateService } from 'app/applications/matwidgets/stepper/stepper-ui-state.service';
import { CanComponentDeactivate } from 'app/services/can-deactivate-guard.service';
import { FormField } from './state/form-field.model';
import { FormFieldsStore } from './state/form-fields.store';
import { FormFieldsQuery } from './state/form-fields.query';
import { FormTemplateStore } from './state/form-template.store';
import { FormTemplateQuery } from './state/form-template.query';
import { FormTemplateService } from './state/form-template.service';
import { FieldEditorDialog } from './field-editor/field-editor-dialog.component';
import { FieldBindingService } from './field-binding.service';
import { SchemaNoValidationFactory } from './schema-no-validation-factory';
import { PaymentService } from '../matwidgets/payment/state/payment.service';
import { PaymentQuery } from '../matwidgets/payment/state/payment.query';
import { AppsCustomFieldDialog } from './field-editor/field-custom-dialog.component';
import { Custom } from './custom';
import { ExpandableNode, LeafNode } from './node';

import * as _ from 'lodash';

@Component({
    selector: 'sf-form-editor',
    templateUrl: 'form-editor.component.html',
    styleUrls: ['form-editor.component.scss'],
    providers: [
        FieldBindingService,
        FormFieldsStore,
        FormFieldsQuery,
        FormTemplateStore,
        FormTemplateQuery,
        FormTemplateService,
        StepperUIStateService,
        PaymentService,
        PaymentQuery,
        { provide: SchemaValidatorFactory, useClass: SchemaNoValidationFactory },
        { provide: 'showAdminUse', useValue: true }
    ]
})
export class FormEditorComponent implements OnInit, OnDestroy, CanComponentDeactivate {
    readonly formNameMinLength = Constants.requiredTextFieldMinLength;
    readonly formNameMaxLength = 60;
    formSchema$: Observable<ISchema>;
    formTemplate$: Observable<AppFormTemplate>;
    documentId: string;
    formGroup: FormGroup = this.fb.group({
        name: [
            '',
            Validators.compose([
                Validators.required,
                Validators.minLength(this.formNameMinLength),
                Validators.maxLength(this.formNameMaxLength)
            ])
        ]
    });
    fieldBindings: { [path: string]: Binding[] };
    promiseForBtn;
    shouldAutosizeDrawer = false;
    drawerMode$: Observable<MatDrawerMode>;
    isDebugMode = false;
    isSysAdmin = false;
    sampleModel = {
        parentGuardiansForm: {
            parentGuardians: [
                {
                    firstName: 'Sample',
                    lastName: 'Sample',
                    isASchoolAlumni: true,
                    samePostalAddress: false
                }
            ]
        },
        studentForm: {
            hasSpecialNeeds: true,
            hasAppliedOtherSchools: true,
            hasSiblings: true,
            hasOtherRelatives: true,
            isCitizen: false,
            otherInfoCourtOrders: true,
            otherInfoFunding: true,
            siblings: [
                {
                    siblingsName: 'sample'
                }
            ],
            otherRelatives: [
                {
                    relativesName: 'sample'
                }
            ]
        },
        signature: {
            signatures: [
                {
                    isAbleToSign: true
                }
            ]
        }
    };
    private collection: EntityDirtyCheckPlugin;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private appsService: ApplicationsService,
        private fieldBindingService: FieldBindingService,
        private formTemplateService: FormTemplateService,
        private formFieldsQuery: FormFieldsQuery,
        private observer: BreakpointObserver,
        public dialog: MatDialog,
        private paymentService: PaymentService,
        private modalService: NgbModal,
        private platformLocation: PlatformLocation,
    ) { }

    ngOnInit() {
        this.documentId = this.route.params['value'].formId;
        this.collection = new EntityDirtyCheckPlugin(this.formFieldsQuery).setHead();
        this.formTemplateService.get(this.documentId);
        this.formSchema$ = this.formTemplateService.selectSchemaFormSchema().pipe(
            tap((formSchema) => {
                this.fieldBindings = this.fieldBindingService.generateFieldBindings(
                    formSchema,
                    [{ click: this.onFieldClick.bind(this) }]
                );
            })
        );
        this.formTemplate$ = this.formTemplateService.selectFormTemplateSchema();
        this.drawerMode$ = this.observer.observe([Breakpoints.Large, Breakpoints.XLarge]).pipe(
            map(state => {
                return state.matches ? 'side' : 'over';
            })
        );
        this.isSysAdmin = Utils.getUserInfoFromToken().isSysAdmin();
        this.paymentService.setGeneralPaymentInfo(this.documentId);
    }

    ngOnDestroy() {
        this.collection.destroy();
    }

    onPublish(formTemplate) {
        return this.promiseForBtn = this.saveForm(formTemplate)
            .then(() => this.appsService.publishFormTemplate(this.documentId, formTemplate))
            .then(() => {
                Utils.showNotification('Form successfully published.', Colors.success);
                this.promiseForBtn = null;
            }).catch(_err => this.promiseForBtn = null);
    }

    onSubmit(formTemplate) {
        return this.promiseForBtn = this.saveForm(formTemplate)
            .then(() => {
                Utils.showNotification('Form successfully saved.', Colors.success);
                this.promiseForBtn = null;
                return true;
            }).catch(_err => {
                this.promiseForBtn = null;
                return false;
            });
    }

    onCancel() {
        this.router.navigate(['/applications/forms']);
    }

    onFieldClick(event, formProperty: FormProperty) {
        event.stopPropagation(); // stop after first property
        if (!formProperty.schema['templateMetaData']) { return; }
        if (formProperty.path.indexOf(Custom.customFieldStr) !== -1) {
            this.upsertCustomField({ node: null, formProperty });
        } else {
            const dialogRef = this.dialog.open(FieldEditorDialog, {
                width: '500px',
                data: { formProperty, isDebug: this.isDebugMode }
            });
    
            dialogRef.afterClosed().subscribe((data: Partial<FormField>) => {
                if (!data) {
                    return;
                }
                this.formTemplateService.update(formProperty.path, data);
                // Do the below to make it more responsive, but it will be overwritten by the observable soon
                // exclude widget property because it causes new field to be created (bug)
                const { widget, ...newSchema } = data;
                Object.assign(formProperty.schema, newSchema);
            });
        }
    }

    changeFieldVisibility({ fieldPath, isVisible }: { fieldPath: string, isVisible: boolean }) {
        this.formTemplateService.updateVisibility(fieldPath, isVisible);
    }

    upsertCustomField({ node, formProperty }: { node?: ExpandableNode | null, formProperty?: FormProperty }) {
        const fieldCustomDialogRef = this.modalService.open(AppsCustomFieldDialog, Constants.ngbModalMd);
        fieldCustomDialogRef.componentInstance.fieldSchema = formProperty ? _.cloneDeep(formProperty.schema) : null;
        fieldCustomDialogRef.result.then((result: { action: ModalAction, fieldSchema: ISchema }) => {
            switch (result.action) {
                case ModalAction.Create:
                    this.formTemplateService.insertCustomField(node, result.fieldSchema as Partial<FormField>);
                    break;
                case ModalAction.Update:
                    this.formTemplateService.updateCustomField(formProperty.path, result.fieldSchema as Partial<FormField>);
                    break;
                default:
                    break;
            }
        }).catch((err) => fieldCustomDialogRef.dismiss(err));
        this.platformLocation.onPopState(() => {
            fieldCustomDialogRef.close({ action: ModalAction.LeavePage });
        });
    }

    deleteCustomField({ node }: { node: LeafNode }) {
        this.formTemplateService.delete(node);
    }

    resizeDrawer() {
        // Keeping autosize on can cause layout thrashing as noted in the documentation
        // https://material.angular.io/components/sidenav/api#MatDrawerContainer
        // Instead turn autosize on for a short while, then turn it off
        // See: https://stackoverflow.com/a/61588925/2088345
        this.shouldAutosizeDrawer = true;
        setTimeout(() => this.shouldAutosizeDrawer = false, 1);
    }

    @HostListener('window:beforeunload')
    isPristine = () => !this.collection.someDirty() && this.formGroup.pristine

    markAsPristine() {
        this.collection.setHead();
        this.formGroup.markAsPristine();
    }

    canDeactivate(): Promise<boolean> {
        const shouldSaveAndExit = false;
        const isValidData = true;
        const isDirty = !this.isPristine();
        return Utils.canDeactivate(+isDirty, shouldSaveAndExit, isValidData)
            .then(choice => {
                switch (choice) {
                    case PageLeaveReason.save:
                        return this.formTemplate$.pipe(take(1)).toPromise()
                            .then(formTemplate => {
                                // not needed when clicking the normal button since it
                                // passes in the modified formTemplate bound to input
                                formTemplate.name = this.formGroup.get('name').value;
                                return this.onSubmit(formTemplate);
                            });
                    case PageLeaveReason.goBack:
                        return false;
                    case PageLeaveReason.doNotSave:
                        return true;
                }
            });
    }

    private saveForm(formTemplate) {
        return this.appsService.saveFormTemplate(this.documentId, formTemplate)
            .then(res => {
                this.markAsPristine();
                return res;
            });
    }

}
