import { Injectable, } from '@angular/core';
import * as _ from 'lodash';
import { FilterValue } from '../components/filter-constellation/interfaces/filter-value';


@Injectable({
    providedIn: 'root',
})
export class StateService {
    public static demographicCmpStartingYear = 'demographic_cmp_starting_year';
    public static demographicCmpYearLevels = 'demographic_cmp_year_levels';
    public static demographicCmpOtherYearLevel = 'demographic_cmp_other_year_level';

    public static funnelMetricsCmpStartingYear = 'funnel_metrics_cmp_starting_year';
    public static funnelMetricsCmpYearLevels = 'funnel_metrics_cmp_year_levels';
    public static funnelMetricsCmpOtherYearLevel = 'funnel_metrics_cmp_other_year_level';

    public static conversionRatiosCmpStartingYear = 'conversion_ratios_cmp_starting_year';

    public static eventStatusCmpSelected = 'event_status_cmp_selected';

    public static activityCmpIntakeYear = 'activity_cmp_intake_year';
    public static activityCmpYearLevels = 'activity_cmp_year_levels';
    public static activityCmpOtherYearLevel = 'activity_cmp_other_year_level';

    public static analyticsSchoolCmpStartingYear = 'analytics_school_cmp_intake_year';
    public static analyticsSchoolCmpYearLevels = 'analytics_school_cmp_year_levels';
    public static analyticsSchoolCmpOtherYearLevel = 'analytics_school_cmp_other_year_level';

    public static analyticsEventsCmpEventYear = 'analytics_events_cmp_event_year';
    public static analyticsEventsCmpEventType = 'analytics_events_cmp_type';
    public static analyticsEventsCmpPTYear = 'analytics_events_cmp_pt_year';

    public static analyticsEnquiriesStudentsCmpYear = 'analytics_enquiries_students_cmp_year';
    public static analyticsEnquiriesStudentsCmpStartingYear = 'analytics_enquiries_students_cmp_starting_year';
    public static analyticsEnquiriesPospectusesCmpYear = 'analytics_enquiries_prospectuses_cmp_year';
    public static analyticsEnquiriesStudentsStageStartingYear = 'analytics_enquiries_students_stage_starting_year';

    public static geographicCmpStartingYear = 'geographic_cmp_intake_year';
    public static geographicCmpYearLevels = 'geographic_cmp_year_levels';
    public static geographicCmpOtherYearLevel = 'geographic_cmp_other_year_level';

    public static eventsCmpYear = 'events_cmp_year';
    public static eventsCmpHidePastEvents = 'events_cmp_hide_past_events';

    public static personalToursCmpYear = 'personal_tours_cmp_year';
    public static personalToursCmpHidePastEvents = 'personal_tours_cmp_hide_past_events';

    public static studentsCmpStartingYear = 'students_cmp_starting_year';
    public static studentsCmpYearLevels = 'students_cmp_year_levels';
    public static studentsCmpStages = 'students_cmp_stages';
    public static studentsCmpStatuses = 'students_cmp_statuses';
    public static studentsCmpIsExported = 'students_cmp_is_exported';
    public static studentsCmpFlagged = 'students_cmp_flagged';
    public static studentsCmpFilterRecord = 'students_cmp_filter_record';
    public static studentsCmpAdvanced = 'students_cmp_advanced';

    public static studentsCmpParentLastName = 'students_cmp_parent_last_name';
    public static studentsCmpParentAddress = 'students_cmp_parent_address';
    public static studentsCmpParentMobile = 'students_cmp_parent_mobile';
    public static studentsCmpLastName = 'students_cmp_last_name';
    public static studentsCmpFinancialAid = 'students_cmp_financial_aid';
    public static studentsCmpGenders = 'students_cmp_genders';
    public static studentsCmpAlumnies = 'students_cmp_alumnies';
    public static studentsCmpSiblings = 'students_cmp_siblings';
    public static studentsCmpReligions = 'students_cmp_religions';
    public static studentsCmpOtherInterests = 'students_cmp_other_interests';
    public static studentsCmpSpecialNeeds = 'students_cmp_special_needs';
    public static studentsCmpEnquiryDates = 'students_cmp_enquiry_dates';


    public static studentsPageFilter = 'students_page_filter';
    private filterStatesForPages: Map<string, Array<FilterValue>>;


    private filterStates: Map<string, string | number | boolean>;

    constructor() {
        this.resetFilter();
    }

    public getFilterStates(pageName: string, defaultValue: Array<FilterValue>): Array<FilterValue> {
        const value = this.filterStatesForPages.get(pageName);
        return (value) ? value : defaultValue;
    }

    public setFilterStates(pageName: string, filterValues: Array<FilterValue>) {
        this.filterStatesForPages.set(pageName, filterValues);
    }

    public getFilterAsString(criteriaName: string, defaultValue: string): string {
        const value = this.filterStates.get(criteriaName) as string;
        return (value) ? value : defaultValue;
    }
    public getFilterAsNumber(criteriaName: string, defaultValue: number): number {
        const value = this.filterStates.get(criteriaName) as number;
        return (!isNaN(value) && value !== null) ? value : defaultValue;
    }
    public getFilterAsArray(criteriaName: string): Array<string> {
        const str = this.filterStates.get(criteriaName) as string;
        return (str && !_.isEmpty(str)) ? _.split(str, ',') : [];
    }
    public getFilterAsBoolean(criteriaName: string, defaultValue: boolean): boolean {
        const value = this.filterStates.get(criteriaName) as boolean;
        return (value !== undefined) ? value : defaultValue;
    }

    public setFilterAsString(criteriaName: string, value: string) {
        this.filterStates.set(criteriaName, value);
    }
    public setFilterAsNumber(criteriaName: string, value: number) {
        this.filterStates.set(criteriaName, value);
    }
    public setFilterAsArray(criteriaName: string, value: Array<string>) {
        this.filterStates.set(criteriaName, _.join(value, ','));
    }
    public setFilterAsBoolean(criteriaName: string, value: boolean) {
        this.filterStates.set(criteriaName, value);
    }

    public resetFilter() {
        this.filterStates = new Map<string, string | number>();
        this.filterStatesForPages = new Map<string, Array<FilterValue>>();
    }

}
