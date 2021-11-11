import { Pipe, PipeTransform } from '@angular/core';
import { FormProperty } from 'ngx-schema-form';

// get main logic from https://github.com/daniele-pecora/ngx-schema-form-widgets-material/blob/master/projects/ngx-schema-form-widgets-material/src/lib/widgets/_pipe/IsRequiredField.ts

/**
 * Global function to check if a field is required and marks it with an asterisk (&#42;).<br/>
 * The <code>FormProperty.schema.widget</code> may provide <br/>
 * a custom character or string to flag the property as required<br/>
 * by setting the property <code>schema.widget.requiredMark</code><br/>
 * .<br/>
 * This simply checks if the field name is included in the parents <code>required</code> array property.<br/>
 * <code>
 * {
 *  "required":["state","district","local","community"]
 * }
 * </code>
 * Is als checks if parent has set <code>oneOf</code> where the property is contained as <code>required</code>.
 * e.g:<br/>
 * <code>
 * "oneOf": [
 *    {
 *       "required": [
 *           "state"
 *        ]
 *    },
 *    {
 *       "required": [
 *             "district"
 *        ]
 *   },
 *   {
 *      "required": [
 *           "local"
 *       ]
 *   },
 *   {
 *       "required": [
 *          "community"
 *       ]
 *   }
 * ]
 * </code>
 * @param {FormProperty} val
 * @returns {boolean} <code>true</code> if the the fields is required.<br/>
 * <code>false</code> otherwise.<br/>
 */
export function isRequiredField(val: FormProperty) {
    if (val.parent && val.parent.schema) {
        const propertyName = val.path.split('/').slice(-1)[0];
        if (val.parent.schema.required
            && -1 !== (val.parent.schema.required || []).indexOf(propertyName)) {
            return true;
        }
        if (val.parent.schema.oneOf) {
            for (const el of val.parent.schema.oneOf) {
                if (-1 !== (el.required || []).indexOf(propertyName)) {
                    return true;
                }
            }
        }
        // next conditions added by Inkubasia
        if (val.parent.schema.anyOf) {
            for (const el of val.parent.schema.anyOf) {
                if (-1 !== (el.required || []).indexOf(propertyName)) {
                    return true;
                }
            }
        }
        if (val.parent.schema.allOf) {
            for (const el of val.parent.schema.allOf) {
                const conditions = el.anyOf || el.oneOf;
                if (conditions) {
                    for (const i of conditions) {
                        if (-1 !== (i.required || []).indexOf(propertyName)) {
                            return true;
                        }
                    }
                }
            }
        }
        if (val.parent.parent.schema.anyOf) {
            for (const el of val.parent.parent.schema.anyOf) {
                for (const key of Object.keys(el.properties)) {
                    if (-1 !== (el.properties[key].required || []).indexOf(propertyName)) {
                        return true;
                    }
                }
            }
        }
        if (val.parent.schema.dependencies) {
            for (const key of Object.keys(val.parent.schema.dependencies)) {
                if (-1 !== (val.parent.schema.dependencies[key].required || []).indexOf(propertyName)) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Angular Pipe to be used in templates :<br/>
 * <pre>
 * &lt;p-checkbox
 *     label="{{ schema.hasOwnProperty('title') ? schema.title : formProperty.path }} {{formProperty|isRequired}}"
 *     value="check-this"
 *     &gt;&lt;/p-checkbox&gt;
 * </pre>
 * @see isRequiredField
 */
@Pipe({
    name: 'isRequired'
})
export class IsFormPropertyRequiredPipe implements PipeTransform {
    transform(value: FormProperty): boolean {
        return isRequiredField(value);
    }
}

/**
 * Pipe for dynamic field
 */
@Pipe({
    name: 'isRequiredImpure',
    pure: false
})
export class IsFormPropertyRequiredImpurePipe implements PipeTransform {
    transform(value: FormProperty): boolean {
        return isRequiredField(value);
    }
}
