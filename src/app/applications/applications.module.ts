import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LayoutModule } from '@angular/cdk/layout';
import { MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { ComponentsModule } from '../components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ngfModule } from 'angular-file';
import { RecaptchaModule } from 'ng-recaptcha';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { TranslateModule } from '@ngx-translate/core';
import { NgxStripeModule } from 'ngx-stripe';
import { SchemaFormModule, SchemaValidatorFactory, WidgetRegistry } from 'ngx-schema-form';

import { MaterialModule } from '../app.module';
import { SharedModule } from '../shared.module';
import { AdminModule } from '../admin/admin.module';

import { ApplicationsRoutes } from './applications.routing';

import { OrdinalPipe } from '../common/pipes/ordinal';

// Components
import { AppsPromopageComponent } from './apps-promopage/apps-promopage.component';
import { AppsRequestFormComponent } from './apps-request-form/apps-request-form.component';
import { AppsFormComponent } from './apps-form/apps-form.component';
import { AppsReadonlyFormComponent } from './apps-readonly-form/apps-readonly-form.component';
import { FormEditorComponent } from './apps-edit-form/form-editor.component';
import { FieldEditorComponent } from './apps-edit-form/field-editor/field-editor.component';
import { FieldEditorObjectComponent } from './apps-edit-form/field-editor/field-editor-object.component';
import { FieldEditorDialog } from './apps-edit-form/field-editor/field-editor-dialog.component';
import { FieldListComponent } from './apps-edit-form/field-list/field-list.component';
import { AppsListFormsComponent } from './apps-list-forms/apps-list-forms.component';
import { AppsListItemsComponent } from './apps-list-items/apps-list-items.component';
import { AppsSetupComponent } from './apps-setup/apps-setup.component';
import { AppsFeeDiscountComponent } from './apps-fee-discount/apps-fee-discount.component';
import { AppsListComponent } from './apps-list/apps-list.component';
import { SubmitSucceededComponent } from './submit-succeeded/submit-succeeded.component';
import { AppsEditFillableFormComponent } from './apps-edit-fillableform/apps-edit-fillableform.component';
import { AppsPreviewFillableFormComponent } from './apps-preview-fillableform/apps-preview-fillableform.component';
import { AppsFillableFormSendEmailComponent } from './apps-edit-fillableform/apps-fillableform-send-email/apps-fillableform-send-email.component';
import { AppsInfoPanelComponent } from './apps-info-panel/apps-info-panel.component';
import { AppsProgressStatusComponent } from './apps-info-panel/apps-progress-status/apps-progress-status.component';
import { ApplicationFinalizedDialog } from './apps-info-panel/apps-finalized-dialog/apps-finalized-dialog.component';
import { AppsFormSubmitModalComponent } from './apps-form/apps-form-submit-modal/apps-form-submit-modal.component';
import { AppsCustomFieldDialog } from './apps-edit-form/field-editor/field-custom-dialog.component';
import { FieldEditorDefaultValueComponent } from './apps-edit-form/field-editor/field-editor-default-value.component';
import { FieldEditorChoiceLimitComponent } from './apps-edit-form/field-editor/field-editor-choice-limit.component';

// Widgets
import { StepperWidget } from './matwidgets/stepper/stepper-widget';
import { ObjectWidget } from './matwidgets/object/object-widget';
import { MatArrayWidget } from './matwidgets/array/array-widget';
import { EtButtonWidget } from './matwidgets/button/button-widget';
import { MatStringWidget } from './matwidgets/string/string-widget';
import { MatRadioWidget } from './matwidgets/radio/radio-widget';
import { MatSelectWidget } from './matwidgets/select/select-widget';
import { MatCheckboxWidget } from './matwidgets/checkbox/checkbox-widget';
import { MatSpecialSelectWidget } from './matwidgets/special-select/special-select-widget';
import { DateWidget } from './matwidgets/date/date-widget';
import { StripeWidget } from './matwidgets/payment/stripe/stripe-widget';
import { MatFilesArrayWidget } from './matwidgets/files-array/files-array-widget';
import { MatFilesSectionWidget } from './matwidgets/files-section/files-section.widget';
import { MatPaymentStatusWidget } from './matwidgets/payment-status/payment-status.widget';
import { EtWidgetRegistry } from './matwidgets/matwidgetregistry';
import { MatIntegerWidget } from './matwidgets/integer/integer-widget';
import { MatTextAreaWidget } from './matwidgets/textarea/textarea-widget';
import { MatRangeWidget } from './matwidgets/range/range-widget';
import { InfoWidget } from './matwidgets/info/info-widget';
import { MatChipsWidget } from './matwidgets/chips/chips-widget';
import { MatYearWidget } from './matwidgets/year/year-widget';
import { MatSignatureWidget } from './matwidgets/signature/signature-widget';
import { MatSignatureCaptureWidget } from './matwidgets/signature-capture/signature-capture-widget';
import { MatHiddenWidget } from './matwidgets/hidden/hidden-widget';
import { ReadonlyWidget } from './matwidgets/readonly/readonly-widget';
import { AddressWidget } from './matwidgets/address/address-widget';
import { SpouseWidget } from './matwidgets/spouse/spouse-widget';
import { IsFormPropertyRequiredPipe, IsFormPropertyRequiredImpurePipe } from '../common/pipes/isRequiredField';
import { EditFileComponent } from './matwidgets/files-array/edit-file';
import { AmountWidget } from './matwidgets/amount/amount-widget';
import { CustomZSchemaValidatorFactory } from './matwidgets/custom-zschema-validator-factory';
import { StepperDirective } from './stepper.directive';

import { AppsNewApplicationDialog } from './apps-new-application-dialog/apps-new-application-dialog.component';

@NgModule({
    declarations: [
        AppsPromopageComponent,
        AppsRequestFormComponent,
        AppsFormComponent,
        AppsReadonlyFormComponent,
        FormEditorComponent,
        AppsListFormsComponent,
        AppsListItemsComponent,
        AppsSetupComponent,
        AppsFeeDiscountComponent,
        AppsListComponent,
        SubmitSucceededComponent,
        AppsEditFillableFormComponent,
        AppsPreviewFillableFormComponent,
        AppsFillableFormSendEmailComponent,
        AppsInfoPanelComponent,
        AppsProgressStatusComponent,
        ApplicationFinalizedDialog,
        AppsFormSubmitModalComponent,
        FieldEditorComponent,
        FieldEditorObjectComponent,
        FieldEditorDialog,
        FieldListComponent,
        StepperWidget,
        ReadonlyWidget,
        ObjectWidget,
        MatArrayWidget,
        MatStringWidget,
        MatSelectWidget,
        MatYearWidget,
        MatRadioWidget,
        MatCheckboxWidget,
        MatSpecialSelectWidget,
        MatIntegerWidget,
        MatTextAreaWidget,
        DateWidget,
        StripeWidget,
        InfoWidget,
        MatChipsWidget,
        MatRangeWidget,
        EtButtonWidget,
        MatFilesArrayWidget,
        MatFilesSectionWidget,
        MatPaymentStatusWidget,
        MatSignatureWidget,
        MatSignatureCaptureWidget,
        MatHiddenWidget,
        AddressWidget,
        OrdinalPipe,
        IsFormPropertyRequiredPipe,
        IsFormPropertyRequiredImpurePipe,
        EditFileComponent,
        SpouseWidget,
        AppsNewApplicationDialog,
        AmountWidget,
        StepperDirective,
        AppsCustomFieldDialog,
        FieldEditorDefaultValueComponent,
        FieldEditorChoiceLimitComponent
    ],
    imports: [
        ComponentsModule,
        CommonModule,
        AdminModule,
        RouterModule.forChild(ApplicationsRoutes),
        FormsModule,
        LayoutModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatTableModule,
        MatTooltipModule,
        MatPaginatorModule,
        MatTreeModule,
        MaterialModule,
        SharedModule,
        SchemaFormModule.forRoot(),
        ngfModule,
        RecaptchaModule,
        NgxMatSelectSearchModule,
        NgxStripeModule.forRoot(),
        TranslateModule
    ],
    exports: [
        AppsPromopageComponent,
        AppsRequestFormComponent,
        AppsFormComponent,
        AppsReadonlyFormComponent,
        FormEditorComponent,
        AppsListFormsComponent,
        AppsListItemsComponent,
        AppsSetupComponent,
        AppsFeeDiscountComponent,
        AppsListComponent,
        SubmitSucceededComponent,
        AppsEditFillableFormComponent,
        AppsPreviewFillableFormComponent,
        AppsFillableFormSendEmailComponent,
        AppsInfoPanelComponent,
        AppsProgressStatusComponent,
        ApplicationFinalizedDialog,
        AppsNewApplicationDialog,
        AppsFormSubmitModalComponent,
        AppsCustomFieldDialog
    ],
    providers: [
        { provide: WidgetRegistry, useClass: EtWidgetRegistry },
        { provide: SchemaValidatorFactory, useClass: CustomZSchemaValidatorFactory },
    ],
})

export class ApplicationsModule { }
