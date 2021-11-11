import { FormProperty } from "ngx-schema-form";
import { AppConstants } from "./constants";

/**
 * custom Application Form Bindings
 */
const customAppFormBindings = {
    "/studentForm/c_campus": [
        {
            selectionChange: (event, formProperty: FormProperty) => {
                const campusDependencies = formProperty.root.schema.definitions?.campusDependencies;
                if (!event && !formProperty.value) return;
                const ylSeekEnrolmentYearLevel = formProperty.parent.getProperty(AppConstants.schoolIntakeYearProperty);
                if (ylSeekEnrolmentYearLevel) {
                    const validValues = getValidValues(event, campusDependencies, AppConstants.schoolIntakeYearProperty);
                    includeOnlyValid(validValues, ylSeekEnrolmentYearLevel);
                }
                const ylCurrentSchoolYear = formProperty.parent.getProperty(AppConstants.currentSchoolYearProperty);
                if (ylCurrentSchoolYear) {
                    const validValues = getValidValues(event, campusDependencies, AppConstants.currentSchoolYearProperty);
                    includeOnlyValid(validValues, ylCurrentSchoolYear);
                }
            }
        }
    ],
    '/payment/li_payLaterOptions': [
        {
            input: (event, formProperty: FormProperty) => {
                formProperty.parent.getProperty('paymentStatusPanel/li_payLaterOptions').setValue(event.target.value, false);
            },
        }
    ],
};

function getValidValues(campusId: number, schema: any, propertyName: string) {
    const allValid = [];
    schema?.oneOf?.forEach(possibilities => {
        const properties = possibilities.properties;
        const validValues = properties?.[propertyName]?.enum;
        if (properties?.c_campus?.enum?.includes(campusId) && validValues) {
            allValid.push(...validValues);
        }
    });
    return allValid;
}

function includeOnlyValid(validValues: any[], prop: FormProperty) {
    prop.schema.oneOf?.forEach(option => {
        option.includeInList = validValues.includes(option.enum?.[0]);
        if (!option.includeInList && option.enum?.[0] === prop.value) {
            prop.setValue(null, false);
        }
    });
}

export default customAppFormBindings;
