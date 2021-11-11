import { SchemaValidatorFactory } from 'ngx-schema-form';
import * as validators from '../validators';

import { T } from 'app/common/t';

import * as ZSchema from 'z-schema';
import * as _ from 'lodash';

/**
 * Used working samples from:
 * https://github.com/daniele-pecora/ngx-schema-form-widgets-material/blob/master/projects/ngx-schema-form-widgets-material/src/lib/custom-zschema-validator-factory.ts
 * https://github.com/daniele-pecora/ngx-schema-form-widgets-material/blob/master/projects/ngx-schema-form-widgets-material/src/lib/fix-optional-empty-fields-z-schema-validator-factory.ts
 */
export class CustomZSchemaValidatorFactory extends SchemaValidatorFactory {

    protected zschema;

    constructor() {
        super();
        this.zschema = new ZSchema({
            breakOnFirstError: false, // fixes validation for array with definitions($ref)
            customValidator: this.customValidatorFn
        });
    }

    /**
     * Field that are not required but have any validation rules set (eg. minLength, pattern etc...)
     * must be marked as optional with property <code>widget.__optional:true</code>
     * since there is actually no other way to set multi types at schema level
     * e.g<br/>
     * <code>{ "name" : { "type" : ["string", "null"]}}</code>
     * <br/>
     * For <code>oneOf</code> options the will be set an <code>null</code>-value option.
     * e.g<br/>
     * <code>{ "name" : { "oneOf" : [{"description", "Label", "enum", [null]},...]}}</code>
     *
     * This prevents getting any error messages when validation empty optional fields
     * @param schema
     */
    updateOptionalFieldValidation(schema: any) {
        const required = schema.required || [];
        const properties = schema.properties || [];
        if (properties) {
            for (const propertyKey in properties) {
                if (-1 === required.indexOf(propertyKey)) {
                    const propertyValue = properties[propertyKey];
                    propertyValue.widget = propertyValue.widget || {};
                    propertyValue.widget.__optional = propertyValue.hasOwnProperty('isRequiredWhenVisible') ? !propertyValue.isRequiredWhenVisible : true;
                    propertyValue.widget.__info_property_optional = `
                        The property '__optional' and this have been set automatically.
                        See https://github.com/makinacorpus/ngx-schema-form/issues/175
                    `;
                }
            }
        }
    }

    createValidatorFn(schema: any) {
        this.updateOptionalFieldValidation(schema);
        return (value): { [key: string]: boolean } => {

            if (schema.widget.__optional) {
                if (!value) {
                    const newSchema = JSON.parse(JSON.stringify(schema)); // create clone
                    newSchema.type = Array.isArray(newSchema.type) ? newSchema.type : [newSchema.type, 'null'];
                    if (newSchema.oneOf) {
                        // Add null value option for oneOf
                        newSchema.oneOf.unshift({
                            description: `
                              Hidden null value option - The property '__optional' and this have been set automatically.
                              See https://github.com/makinacorpus/ngx-schema-form/issues/175
                          `,
                            enum: [null]
                        });
                    }
                    this.zschema.validate(null, newSchema);
                } else {
                    this.zschema.validate(value, schema);
                }
            } else {
                let currentValue;
                if (['string', 'textarea'].includes(schema.type)) {
                    currentValue = value || null;
                } else if (schema.type === 'array' && !value.length) {
                    currentValue = null;
                } else {
                    currentValue = value;
                }
                this.zschema.validate(currentValue, schema);
            }

            const err = this.zschema.getLastErrors();
            this.denormalizeRequiredPropertyPaths(err);
            return err || null;
        };
    }

    getSchema(schema: any, ref: string) {
        // check definitions are valid
        const isValid = this.zschema.compileSchema(schema);
        if (isValid) {
            return this.getDefinition(schema, ref);
        } else {
            throw this.zschema.getLastError();
        }
    }

    protected denormalizeRequiredPropertyPaths(err: any[]) {
        if (err && err.length) {
            err = err.map(error => {
                if (error.path === '#/' && error.code === 'OBJECT_MISSING_REQUIRED_PROPERTY') {
                    error.path = `${error.path}${error.params[0]}`;
                }
                return error;
            });
        }
    }

    private getDefinition(schema: any, ref: string) {
        let foundSchema = schema;
        ref.split('/').slice(1).forEach(ptr => {
            if (ptr) {
                foundSchema = foundSchema[ptr];
            }
        });
        return foundSchema;
    }

    /**
     * Z-Schema is using a cache for all already validated schema <br/>
     * where only the key is a reference but the value of the schema is a deep clone.<br/>
     * So any change made in schema after bootstrap will not be recognized by z-schema validation,<br/>
     * because the changes don't make it into the cloned copy of the schema.<br/>
     * @see https://github.com/zaggino/z-schema/blob/master/src/SchemaCache.js#exports.getSchemaByReference
     */
    public reset(): void {
        /**
         * Reset the cache
         */
        this.zschema['referenceCache'] = [];
    }

    public static validationSignatures(report, schema, value) {
        if (!_.isEmpty(value.signatures)) {
            const ableToSignSum = _.countBy(value.signatures, 'isAbleToSign');
            if (schema.properties.additionalInformation && ableToSignSum['true'] === 1 && !value.additionalInformation) {
                report.addCustomError("OBJECT_MISSING_REQUIRED_PROPERTY", "Missing required property: Additional Information", ["additionalInformation"], null, schema.description);
            }
            if (ableToSignSum['false'] === value.signatures.length) {
                report.addCustomError("NOT_VALID_SIGNATURE", T.msgAtLeastOneSignature, [], null, schema.description);
            }
        }
    }

    public static validateContactType(report, schema, value) {
        if (!_.isEmpty(value.parentGuardians)) {
            const errorMsg: string = validators.getErrMsgContactType(value.parentGuardians, schema.properties.parentGuardians.items.properties.li_contactType.oneOf);

            if (errorMsg) {
                report.addCustomError("MISSING_PRIMARY_CONTACT", errorMsg, [], null, schema.description);
            }
        }
    }

    customValidatorFn(report, schema, json) {
        if (Array.isArray(schema.customValidationFields)) {
            schema.customValidationFields.forEach((fieldId: string) => {
                switch (fieldId) {
                    case 'signatures':
                        CustomZSchemaValidatorFactory.validationSignatures(report, schema, json);
                        break;
                    case 'li_contactType':
                        CustomZSchemaValidatorFactory.validateContactType(report, schema, json);
                        break;
                    case 'li_feeResponsibility':
                        CustomZSchemaValidatorFactory.validateFeeResponsibility(report, schema, json, fieldId);
                        break;
                    default:
                        return;
                }
            });
        }
    }

    public static validateFeeResponsibility(report, schema, value, fieldId: string) {
        if (!_.isEmpty(value.parentGuardians)) {
            const errorMsg: string = validators.getErrMsgFeeResponsibility(value.parentGuardians, schema.properties.parentGuardians.items.required, fieldId);
            if (errorMsg) {
                report.addCustomError("INVALID_CONTACT_FEE_RESPONSIBILITY", errorMsg, [fieldId], null, schema.description);
            }
        }
    }

}
