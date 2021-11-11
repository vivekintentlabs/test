import { Injectable } from '@angular/core';
import { ISchema, ZSchemaValidatorFactory } from 'ngx-schema-form';

@Injectable()
export class SchemaNoValidationFactory extends ZSchemaValidatorFactory {
    createValidatorFn(_schema: ISchema) {
        return (_value): { [key: string]: boolean } => {
            return null;
        };
    }
}
