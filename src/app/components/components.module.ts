import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, NG_VALIDATORS } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxDefaultOptions, MatCheckboxModule, MAT_CHECKBOX_DEFAULT_OPTIONS } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { ngfModule } from 'angular-file'
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { TranslateModule } from '@ngx-translate/core';
import { AgmCoreModule } from '@agm/core';
import { Angular2PromiseButtonModule } from 'angular2-promise-buttons';
import { SharedModule } from '../shared.module';

import { ComponentsRoutes } from './components.routing';

import { AddContactModalComponent } from './add-contact-modal/add-contact-modal.component';
import { ShowMessageComponent } from './show-message/show-message.component';
import { EditContactComponent } from './edit-contact/edit-contact.component';
import { EditStudentComponent } from './edit-student/edit-student.component';
import { SelectContactModalComponent } from './select-contact-modal/select-contact-modal.component';
import { SelectStudentModalComponent } from './select-student-modal/select-student-modal.component';
import { SubTourListComponent } from './sub-tour-list/sub-tour-list.component';

import { PointViewComponent } from './point-view/point-view.component';
import { StatisticPanelComponent } from './statistic-panel/statistic-panel.component';
import { PieChartComponent } from './pie-chart/pie-chart.component';
import { PieChartTableComponent } from './pie-chart-table/pie-chart-table.component';
import { PieChartColComponent } from './pie-chart-col/pie-chart-col.component';
import { LineChartComponent } from './line-chart/line-chart.component';
import { BarChartComponent } from './bar-chart/bar-chart.component';
import { BarChartGroupedComponent } from './bar-chart-grouped/bar-chart-grouped.component';
import { BarChartColComponent } from './bar-chart-col/bar-chart-col.component';
import { BarChartStackedComponent } from './bar-chart-stacked/bar-chart-stacked.component';
import { BarChartStackedHorizontalComponent } from './bar-chart-stacked-horizontal/bar-chart-stacked-horizontal.component';
import { FunnelChartComponent } from './funnel-chart/funnel-chart.component';
import { FunnelMetricsChartComponent } from './funnel-metrics-chart/funnel-metrics-chart.component';
import { LineZingChartComponent } from './line-zing-chart/line-zing-chart.component';
import { GroupedTablePieChartComponent } from './grouped-table-pie-chart/grouped-table-pie-chart.component';

import { PersonalTourWidgetComponent } from './personal-tour-widget/personal-tour-widget.component';
import { ProspectusesWidgetComponent } from './prospectuses-widget/prospectuses-widget.component';

import { TableComponent } from './table/table.component';
import { FeedbackComponent } from './feedback/feedback.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { SchoolSwitcherComponent } from './school-switcher/school-switcher.component';
import { CampusSwitcherComponent } from './campus-switcher/campus-switcher.component';
import { GoogleMapComponent } from './map/map.component';
import { environment } from 'environments/environment';
import { RelatedContactsComponent } from './related-contacts/related-contacts.component';
import { RelatedContactsForNewStudentComponent } from './related-contacts-for-new-student/related-contacts-for-new-student.component';
import { RelatedStudentsComponent } from './related-students/related-students.component';
import { EditStudentModalComponent } from './edit-student-modal/edit-student-modal.component';
import { AddCurrentSchoolDialogComponent } from './add-current-school-dialog/add-current-school-dialog';
import { AddListItemDialogComponent } from './add-list-item-dialog/add-list-item-dialog';
import { AddOtherDialogComponent } from './other-mat-select/add-other-dialog';
import { PersonalTourEmailComponent } from './event-email/personal-tour.component';
import { EventEmailComponent } from './event-email/event-email.component';
import { EditEmailComponent } from './edit-email/edit-email.component';
import { SchoolLogoComponent } from './school-logo/school-logo.component';
import { EmailSignatureComponent } from './email-signature/email-signature.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { SelectUserDialogComponent } from './select-user-dialog/select-user-dialog.component';
import { AddressPipe } from '../common/pipes/address.pipe';

import { FilterConstellationComponent } from './filter-constellation/filter-constellation.component';
import { BaseFilterComponent } from './filter-constellation/filters/base-filter/base-filter.component';
import { DropDownComponent } from './filter-constellation/filters/drop-down/drop-down.component';
import { MoreOptionsComponent } from './filter-constellation/more-options/more-options.component';
import { TextBoxComponent } from './filter-constellation/filters/text-box/text-box.component';
import { DateRangePickerComponent } from './filter-constellation/filters/date-range-picker/date-range-picker.component';
import { FilterSwitchComponent } from './filter-constellation/filter-switch/filter-switch.component';
import { CheckBoxComponent } from './filter-constellation/filters/check-box/check-box.component';
import { YearMonthPickerComponent } from './filter-constellation/filters/year-month-picker/year-month-picker.component';
import { SendTestEmailComponent } from './send-test-email/send-test-email.component';
import { EmailChipsComponent } from './email-chips/email-chips.component';
import { CheckboxGroupComponent } from './checkbox-group/checkbox-group.component';
import { RadioGroupComponent } from './radio-group/radio-group.component';
import { OtherListItemComponent } from './other-mat-select/other-list-item.component';
import { OtherCurrentSchoolComponent } from './other-mat-select/other-current-school.component';
import { SelectSearchComponent } from './select-search/select-search.component';
import { WidgetComponent } from './widget/widget.component';
import { WidgetFilterComponent } from './widget-filter/widget-filter.component';

import { MergeContactComponent } from './merge-enquiry/merge-contact.component';
import { MergeStudentComponent } from './merge-enquiry/merge-student.component';
import { ReviewStudentsComponent } from './review-students/review-students.component';
import { MergeListItemComponent } from './merge-item/merge-list-item.component';
import { MergeCurrentSchoolComponent } from './merge-item/merge-current-school.component';
import { MergeItemComponent } from './merge-item/merge.component';

import { EditEmailTemplateComponent } from './email-template/edit-email-template/edit-email-template.component';
import { GeneralEmailTemplateComponent } from './email-template/general.component';
import { ProspectusEmailTemplateComponent } from './email-template/prospectus.component';
import { SetupFormHeaderFooterComponent } from './form-header-footer/setup-form-header-footer/setup-form-header-footer.component';
import { DisplayFormHeaderFooterComponent } from './form-header-footer/display-form-header-footer/display-form-header-footer.component';
import { StripeIntegrationComponent } from './stripe-integration/stripe-integration';
import { StripeIntegrationModalComponent } from './stripe-integration/stripe-integration-modal/stripe-integration-modal';

import { emailValidator } from 'app/validators/email.validator';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SpinnerModule } from './spinner/spinner.module';
import { MatTabsModule } from '@angular/material/tabs';
import { ZingchartAngularModule } from 'zingchart-angular';
import { ChartButtonGroupComponent } from './chart-button-group/chart-button-group.component';
import { ChartActionSectionComponent } from './chart-action-section/chart-action-section.component';
import { ChartwrapperComponent } from 'app/components/chart-wrapper/chart-wrapper.component';
import { ViewDetailsFooterComponent } from './view-details-footer/view-details-footer.component';

import { ExportDialog } from './export-dialog/export-dialog.component';
import { DownloadDialog } from './download-dialog/download-dialog.component';
import { CopyPassword } from './copy-password/copy-password.component';
import { PieZingChartComponent } from 'app/components/pie-zing-chart/pie-zing-chart.component';
import { ChartLegendComponent } from 'app/components/chart-legend/chart-legend.component';
import { ColumnChartComponent } from './column-chart/column-chart.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ComponentsRoutes),
        AgmCoreModule.forRoot({
            apiKey: environment.googleMapApiKey
        }),
        Angular2PromiseButtonModule.forRoot({
            spinnerTpl: '<span class="spinner-border spinner-border-sm ml-1" role="status" aria-hidden="true"></span>',
            handleCurrentBtnOnly: true,
        }),
        FormsModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatInputModule,
        MatDatepickerModule,
        MatAutocompleteModule,
        MatTooltipModule,
        MatDialogModule,
        MatProgressBarModule,
        MatCheckboxModule,
        MatRadioModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatDividerModule,
        MatButtonModule,
        ngfModule,
        NgxDaterangepickerMd,
        SharedModule,
        TranslateModule,
        MatChipsModule,
        MatIconModule,
        MatProgressSpinnerModule,
        NgxMatSelectSearchModule,
        SpinnerModule,
        MatTabsModule,
        ZingchartAngularModule
    ],
    declarations: [
        AddContactModalComponent,
        ShowMessageComponent,
        EditContactComponent,
        EditStudentComponent,
        SelectContactModalComponent,
        SelectStudentModalComponent,
        PointViewComponent,
        StatisticPanelComponent,
        PieChartComponent,
        PieChartTableComponent,
        PieChartColComponent,
        LineChartComponent,
        TableComponent,
        FeedbackComponent,
        UserProfileComponent,
        SchoolSwitcherComponent,
        BarChartComponent,
        PersonalTourWidgetComponent,
        ProspectusesWidgetComponent,
        CampusSwitcherComponent,
        GoogleMapComponent,
        BarChartGroupedComponent,
        BarChartColComponent,
        RelatedContactsComponent,
        RelatedContactsForNewStudentComponent,
        RelatedStudentsComponent,
        EditStudentModalComponent,
        AddListItemDialogComponent,
        AddOtherDialogComponent,
        AddCurrentSchoolDialogComponent,
        BarChartStackedComponent,
        BarChartStackedHorizontalComponent,
        EditEmailComponent,
        PersonalTourEmailComponent,
        EventEmailComponent,
        SchoolLogoComponent,
        EmailSignatureComponent,
        NotificationsComponent,
        SelectUserDialogComponent,
        AddressPipe,
        DropDownComponent,
        FilterConstellationComponent,
        BaseFilterComponent,
        MoreOptionsComponent,
        TextBoxComponent,
        DateRangePickerComponent,
        FilterSwitchComponent,
        CheckBoxComponent,
        YearMonthPickerComponent,
        FunnelChartComponent,
        FunnelMetricsChartComponent,
        LineZingChartComponent,
        SendTestEmailComponent,
        GroupedTablePieChartComponent,
        EmailChipsComponent,
        CheckboxGroupComponent,
        RadioGroupComponent,
        OtherListItemComponent,
        OtherCurrentSchoolComponent,
        SubTourListComponent,
        SelectSearchComponent,
        WidgetComponent,
        WidgetFilterComponent,
        MergeContactComponent,
        MergeStudentComponent,
        ReviewStudentsComponent,
        EditEmailTemplateComponent,
        ProspectusEmailTemplateComponent,
        GeneralEmailTemplateComponent,
        MergeListItemComponent,
        MergeCurrentSchoolComponent,
        MergeItemComponent,
        SetupFormHeaderFooterComponent,
        DisplayFormHeaderFooterComponent,
        StripeIntegrationComponent,
        StripeIntegrationModalComponent,
        ChartButtonGroupComponent,
        ChartActionSectionComponent,
        ChartwrapperComponent,
        ViewDetailsFooterComponent,
        ExportDialog,
        DownloadDialog,
        CopyPassword,
        PieZingChartComponent,
        ChartLegendComponent,
        ColumnChartComponent
    ],
    exports: [
        SpinnerModule,
        Angular2PromiseButtonModule,
        AddContactModalComponent,
        ShowMessageComponent,
        EditContactComponent,
        EditStudentComponent,
        SelectContactModalComponent,
        SelectStudentModalComponent,
        PointViewComponent,
        StatisticPanelComponent,
        PieChartComponent,
        PieChartTableComponent,
        PieChartColComponent,
        LineChartComponent,
        TableComponent,
        FeedbackComponent,
        UserProfileComponent,
        SchoolSwitcherComponent,
        BarChartComponent,
        PersonalTourWidgetComponent,
        ProspectusesWidgetComponent,
        CampusSwitcherComponent,
        GoogleMapComponent,
        BarChartGroupedComponent,
        BarChartColComponent,
        RelatedContactsComponent,
        RelatedContactsForNewStudentComponent,
        RelatedStudentsComponent,
        EditStudentModalComponent,
        BarChartStackedComponent,
        BarChartStackedHorizontalComponent,
        EditEmailComponent,
        PersonalTourEmailComponent,
        EventEmailComponent,
        SchoolLogoComponent,
        EmailSignatureComponent,
        NotificationsComponent,
        AddressPipe,
        DropDownComponent,
        FilterConstellationComponent,
        MoreOptionsComponent,
        TextBoxComponent,
        DateRangePickerComponent,
        FilterSwitchComponent,
        CheckBoxComponent,
        YearMonthPickerComponent,
        FunnelChartComponent,
        FunnelMetricsChartComponent,
        LineZingChartComponent,
        SendTestEmailComponent,
        GroupedTablePieChartComponent,
        EmailChipsComponent,
        CheckboxGroupComponent,
        RadioGroupComponent,
        OtherListItemComponent,
        OtherCurrentSchoolComponent,
        SubTourListComponent,
        SelectSearchComponent,
        WidgetComponent,
        WidgetFilterComponent,
        ProspectusEmailTemplateComponent,
        GeneralEmailTemplateComponent,
        MergeListItemComponent,
        MergeCurrentSchoolComponent,
        MergeItemComponent,
        SetupFormHeaderFooterComponent,
        DisplayFormHeaderFooterComponent,
        StripeIntegrationComponent,
        StripeIntegrationModalComponent,
        ChartButtonGroupComponent,
        ChartActionSectionComponent,
        ChartwrapperComponent,
        ViewDetailsFooterComponent,
        ExportDialog,
        DownloadDialog,
        CopyPassword,
        PieZingChartComponent,
        ChartLegendComponent,
        ColumnChartComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [
        { provide: NG_VALIDATORS, useExisting: emailValidator, multi: true },
        { provide: MAT_CHECKBOX_DEFAULT_OPTIONS, useValue: { color: 'primary' } as MatCheckboxDefaultOptions},
    ]
})

export class ComponentsModule { }
