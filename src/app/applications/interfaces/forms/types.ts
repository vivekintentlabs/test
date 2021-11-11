export type FieldType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';

export type WidgetType = 'array' | 'button' | 'checkbox' | 'file' | 'integer' | 'object' | 'radio' | 'range' | 'select' | 'string' | 'textarea' |
    'readonlyText' | 'stepper' | 'readonly' | 'hidden' | 'files-section' | 'files-array'; // readonyText is a widget that displays Text but does not return a value

export type status = 'draft' | 'published'; // | 'expired' <- add later

export type FormType = 'application';

export type CountryId = 'AUS' | 'NZL' | 'USA';
