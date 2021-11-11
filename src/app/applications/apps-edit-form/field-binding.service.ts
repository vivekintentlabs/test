import { Binding, ISchema } from 'ngx-schema-form';
import * as _ from 'lodash';

interface FieldBindings {
    [path: string]: Binding[]
};

export class FieldBindingService {
    generateFieldBindings(property: ISchema, bindings: Binding[], propertyPath: string = '') {
        const fieldBindings: FieldBindings = {};
        switch (property.type) {
            case 'object':
                Object.assign(fieldBindings, this.generateObjectFieldBindings(property, bindings, propertyPath));
                break;
            case 'array':
                Object.assign(fieldBindings, this.generateArrayFieldBindings(property, bindings, propertyPath));
                break;
        }
        fieldBindings[propertyPath] = bindings;
        return fieldBindings;
    }

    generateObjectFieldBindings(objectProperty: ISchema, bindings: Binding[], propertyPath: string = '') {
        const fieldBindings: FieldBindings = {};
        if (!objectProperty.properties) {
            throw new Error(`Property [${propertyPath}] is not a valid object type. Missing 'properties' property.`);
        }
        _.forIn(objectProperty.properties, (value, key) => {
            const childPath = `${propertyPath}/${key}`;
            Object.assign(fieldBindings, this.generateFieldBindings(value, bindings, childPath))
        });
        return fieldBindings;
    }

    generateArrayFieldBindings(arrayProperty: ISchema, bindings: Binding[], propertyPath: string = '') {
        if (!arrayProperty.items) {
            throw new Error(`Property [${propertyPath}] is not a valid array type. Missing 'items' property.`);
        }
        return this.generateFieldBindings(arrayProperty.items, bindings, `${propertyPath}/*`);
    }
}
