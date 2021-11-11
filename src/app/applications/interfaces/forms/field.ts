import { FieldType, WidgetType } from './types';
import { Button } from './button';
import { ChildFieldSet } from './fieldset';

/**
 * Represents the minimal properties all fields should have.
 */
export interface Field {
    type: FieldType;
    widget?: WidgetType | {
        id: WidgetType;
        htmlClass?: string;
        htmlClassForOptions?: string;
    };
}

/**
 * Represents a field that contains a value.
 * It serves as a base class for FormTemplateValueField and FormValueField
 */
export interface ValueField<T extends ValueField<T>> extends Field {
    properties?: { [key: string]: T }; // key/values of Fields;
    buttons?: Button[];
    fieldsets?: ChildFieldSet[];
    title?: string;
    placeholder?: string;
    description?: string;
    default?: any; // fields that have a default value
    minItems?: number;
    maxItems?: number;
    required?: string[]; 
}
/**
 * Represents a the added metadata for a field in the form template.
 */
export interface ValueFieldMetaData extends ValueField<ValueFieldMetaData> {
    templateMetaData?: {
        isVisible: boolean;
        isVisibleModifiable: boolean;
        isRequired: boolean;
        isRequiredModifiable: boolean;
        description: string; // description of the field that is shown in form setup screen in ET.
        isDefaultModifiable: boolean;
        /**
         * Child fields are not individually editable, at least not the visibility
         */
        isAtomic?: boolean;
        isMinItemsModifiable?: boolean;
        isMaxItemsModifiable?: boolean;
    };
    options?: Array<{ id: number, value: string }>; // fields that have a (multi)select of options. will not be saved in firestore
}

/**
 * Represents a field that contains a value in a Form.
 */
export interface ValueFieldSchema extends ValueField<ValueFieldSchema> {
    readOnly?: boolean;
    oneOf?: Array<{ description: string, enum: string[] }>; // fields that have a (multi)select of options. will not be saved in firestore
}

/**
 * Represents an object field for a Form, this field can contain other fields in its properties field.
 * The subtype of the allowed fields for the properties field can be specified as a template parameter.
 */
export interface ObjectField<T extends Field> extends Field {
    type: 'object';
    widget: 'object';
    properties: { [key: string]: T };
    fieldsets: ChildFieldSet[];
}

/**
 * Represents an object field for a Form
 * It contains the required array field, which should list fields which are required.
 */
export interface ObjectFieldSchema<T extends Field> extends ObjectField<T> {
    required?: string[];
}


