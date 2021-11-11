export interface FieldSet<T extends string> {
    id?: string;
    title?: string;
    description?: string;
    fields: Array<T>; // It is hard to make a list of labels that are allowed. for now use simple strings.
}

export interface ChildFieldSet extends FieldSet<string> {
}

/**
 * the root field set meant to be used in the form template. It is special since we can check more:
 * - the id of all field sets should be one of the allowed field set ids.
 * - every root field set has some additional settings that ET needs to control filling out the form correctly (etMetaData).
 */
export interface RootFieldSetMetaData<T extends string> extends FieldSet<T> {
    templateMetaData: {
        setupSettings: { isVisible: boolean }, // Settings when an admin prepares the form 
        prerequisiteFieldSets: Array<T>, // Fieldset where this fieldset is dependent upon
        schoolEditingSettings: { isVisible: boolean }, // Settings for when a school editor checks/corrects out the form
        contactEditingSettings: { isVisible: boolean }, // Settings for when a contact fills out the form
    };
}

/**
 * the stripped root field for displaying in the form. TODO: For now we keep the prerequisite field, alothough if possible we might move it out to
 * a different structur
 */
export interface RootFieldSetSchemaMetaData<T extends string> extends FieldSet<T> {
    etMetaData: {
        prerequisiteFieldSets: Array<T>, // Fieldset where this fieldset is dependent upon
    };
}


