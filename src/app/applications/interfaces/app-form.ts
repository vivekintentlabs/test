import { AppRootFieldSetId } from './types';
import { FieldType, WidgetType } from './forms/types';
import { Button } from './forms/button';
import { ValueFieldSchema, ObjectFieldSchema } from './forms/field';
import { RootFieldSetSchemaMetaData } from './forms/fieldset';

export interface AppForm {
    type: FieldType;
    buttons?: Button[];
    properties?: { [key: string]: ObjectFieldSchema<ValueFieldSchema> };
    widget: WidgetType | { 'id': WidgetType };
    fieldsets?: Array<RootFieldSetSchemaMetaData<AppRootFieldSetId>>;
    $schema: string;
}
