import { FormProperty, ObjectProperty } from 'ngx-schema-form';
import * as validators from './validators';

import { T } from 'app/common/t';

import * as _ from 'lodash';

/**
 * custom Application Form Validators
 */
const customAppFormValidators = {
    '/parentGuardiansForm/parentGuardians': (values: any, formProperty, formPropertyGroup) => {
        const errors: object[] = [];
        errors.push(...validateFeeResponsibility(values, formProperty));
        errors.push(...validateContactType(values, formProperty));

        return errors.length ? errors : null;
    },
    '/signature/signatures': (values: any, formProperty, formPropertyGroup) => {
        const fieldName = 'isAbleToSign';
        let errorMsg: string;
        if (!_.isEmpty(values)) {
            const ableToSignSum = _.countBy(values, fieldName);
            errorMsg = ableToSignSum['false'] === values.length ? T.msgAtLeastOneSignature : null;
        }
        setCustomErrorInArrayItemFields(values, formProperty, fieldName, errorMsg);
        return errorMsg ? [generateCustomError(errorMsg, formProperty.path, values)] : [];
    },
    '/signature/additionalInformation': (value: any, formProperty: FormProperty, formPropertyGroup: ObjectProperty) => {
        const errorMsg = (!value && formProperty.parent.schema.required
            && -1 !== (formProperty.parent.schema.required || []).indexOf('additionalInformation')) ? 'Additional Information is required' : null;
        const err = errorMsg ? generateCustomError(errorMsg, formProperty.path, value, 'OBJECT_MISSING_REQUIRED_PROPERTY') : null;
        if (errorMsg) {
            return err;
        }
        return null;
    },
};

/**
 * Validation for array of contacts - feeResponsibility
 * @param values
 * @param formProperty
 * @param formPropertyGroup
 * @param errors
 * @param baseError
 */
function validateFeeResponsibility(values, formProperty): object[] {
    const fieldName = 'li_feeResponsibility';
    const errorMsg: string = validators.getErrMsgFeeResponsibility(values, formProperty.schema.items.required, fieldName);

    setCustomErrorInArrayItemFields(values, formProperty, fieldName, errorMsg);
    return errorMsg ? [generateCustomError(errorMsg, formProperty.path, fieldName)] : [];
}

/**
 * Validation for array of contacts - contactType(at least one Primary)
 * @param values
 * @param formProperty
 */
function validateContactType(values, formProperty): object[] {
    const fieldName = 'li_contactType';
    const errorMsg: string = validators.getErrMsgContactType(values, formProperty.schema.items.properties.li_contactType.oneOf);
    
    setCustomErrorInArrayItemFields(values, formProperty, fieldName, errorMsg);

    return errorMsg ? [generateCustomError(errorMsg, formProperty.path, fieldName)] : [];
}

function setCustomErrorInArrayItemFields(values, formProperty, fieldName: string, errorMsg: string) {
    _.forEach(values, (_item, index) => {
        const fieldPath = `${index}/${fieldName}`;
        const field: FormProperty = formProperty.getProperty(fieldPath);
        if (field) {
            const defaultErrors = _.filter(field._errors, err => err.code !== 'CUSTOM_VALIDATOR');
            field._errors = errorMsg ?
                [...defaultErrors, generateCustomError(errorMsg, formProperty.path, values)]
                : (defaultErrors.length ? defaultErrors : null);
            field.errorsChanges.next(field._errors);
        }
    });
}

function generateCustomError(message: string, path: string, fieldName: string, code: string = 'CUSTOM_VALIDATOR') {
    return {
        code,
        path: `#${path}`,
        message,
        params: [fieldName],
    };
}

export default customAppFormValidators;
