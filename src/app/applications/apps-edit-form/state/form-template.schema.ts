import { schema } from 'normalizr';

export const fieldSchema = new schema.Entity('fields', undefined, {
    idAttribute: (_value, parent, key) => {
        const parentPath = parent._path || '';
        if (parent.type === 'array') {
            return `${parentPath}/*`;
        }
        return `${parentPath}/${key}`;
    },
    processStrategy: (value, parent, key) => {
        const parentPath = parent._path || '';
        let _path = `${parentPath}/${key}`;
        let properties;
        if (parent.type === 'array') {
            _path = `${parentPath}/*`;
        }
        if (value.type === 'object') {
            properties = { ...value.properties, _path };
        }
        return { ...value, _path, properties };
    }
});

fieldSchema.define({
    properties: new schema.Values(fieldSchema),
    items: fieldSchema
});

export const formSchema = new schema.Entity(
    'forms',
    {
        properties: new schema.Values(fieldSchema),
        items: fieldSchema
    },
    {
        idAttribute: (value, _parent, _key) => {
            return value.name;
        }
    }
);
