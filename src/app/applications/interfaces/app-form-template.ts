import { FormMetaData } from './forms/form-metadata';
import { AppRootFieldSetId } from './types';
import { Button } from './forms/button';
import { ObjectField, ValueFieldMetaData } from './forms/field';
import { WidgetType, FieldType } from './forms/types';
import { RootFieldSetMetaData } from './forms/fieldset';

export interface AppFormMetaDataSetup {
    faithBased: {
        isRequired: boolean;
        options: {
            catholic: {
                parish: { isEnabled: boolean };
                sacraments: { isEnabled: boolean };
                otherCatholicSchools: { isEnabled: boolean };
            };
        };
    };
}

export interface AppFormTemplate {
    name: string;
    type: FieldType;
    buttons?: Button[];
    properties?: { [key: string]: ObjectField<ValueFieldMetaData> }; // key/values of Fields; 
    widget: WidgetType | { 'id': WidgetType };
    fieldsets?: Array<RootFieldSetMetaData<AppRootFieldSetId>>;
    $schema: string;
    templateMetaData: FormMetaData<AppFormMetaDataSetup>;
    readonly?: boolean;
}
