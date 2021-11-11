import { ISchema } from "ngx-schema-form";

export enum Type {
    DisplayOnly = 1,
    ShortAnswer = 2,
    Paragraph = 3,
    Date = 4,
    DropdownSingleChoice = 5,
    RadioButtonsSingleChoice = 6,
    MultipleChoiceMultipleMenu = 7,
    CheckboxesMmultipleChoice = 8,
    Upload = 8,
}

export interface CustomFieldSchema {
    id: Type;
    name: string;
    fieldSchema: ISchema;
}

export class Custom {
    public static readonly customFieldStr = 'custom-field-';

    public static readonly customFields: CustomFieldSchema[] = [
        { 
           id: Type.DisplayOnly, name: 'Display Only',
           fieldSchema: {
                type: 'string',
                title: '',
                description: '',
                widget: {
                    id: 'info',
                    htmlClass: 'col-12 mt-4'
                },
                templateMetaData: {
                    isVisible: true,
                    isVisibleModifiable: true,
                    isRequired: false,
                    isRequiredModifiable: false,
                    isDefaultModifiable: false,
                }
            }
        },
        { 
            id: Type.ShortAnswer, name: 'Short answer',
            fieldSchema: {
                type: 'string',
                title: '',
                description: '',
                widget: {
                    id: 'string',
                    htmlClass: 'col-sm-4'
                },
                default: '',
                templateMetaData: {
                    isVisible: true,
                    isVisibleModifiable: true,
                    isRequired: false,
                    isRequiredModifiable: true,
                    isDefaultModifiable: true,
                }
            }
        },
        { 
            id: Type.Paragraph, name: 'Paragraph',
            fieldSchema: {
                type: 'string',
                title: '',
                description: '',
                widget: {
                    id: 'textarea',
                    htmlClass: 'col-12 mb-3 mt-4'
                },
                rows: 5,
                default: '',
                templateMetaData: {
                    isVisible: true,
                    isVisibleModifiable: true,
                    isRequired: false,
                    isRequiredModifiable: true,
                    isDefaultModifiable: true,
                }
            }
        },
        {
            id: Type.Date, name: 'Date',
            fieldSchema: {
                type: 'string',
                title: '',
                description: '',
                widget: 'date',
                format: 'date',
                templateMetaData: {
                    isVisible: true,
                    isVisibleModifiable: true,
                    isRequired: false,
                    isRequiredModifiable: true,
                    isDefaultModifiable: false,
                }
            }
        },
        {
            id: Type.DropdownSingleChoice, name: 'Dropdown (single choice)',
            fieldSchema: {
                type: 'string',
                title: '',
                description: '',
                widget: {
                    id: 'select',
                    htmlClass: 'col-sm-4'
                },
                default: '',
                oneOf: [],
                templateMetaData: {
                    isVisible: true,
                    isVisibleModifiable: true,
                    isRequired: false,
                    isRequiredModifiable: true,
                    isDefaultModifiable: true,
                }
            }
        },
        {
            id: Type.RadioButtonsSingleChoice, name: 'Radio buttons (single choice)',
            fieldSchema: {
                type: 'string',
                title: '',
                description: '',
                widget: {
                    htmlClass: 'col-sm-4',
                    id: 'radio',
                },
                default: '',
                oneOf: [],
                templateMetaData: {
                    isVisible: true,
                    isVisibleModifiable: true,
                    isRequired: false,
                    isRequiredModifiable: true,
                    isDefaultModifiable: true,
                }
            }
        },
        {
            id: Type.MultipleChoiceMultipleMenu, name: 'Dropdown (multiple choice)',
            fieldSchema: {
                type: 'array',
                title: '',
                description: '',
                widget: {
                    htmlClass: 'col-sm-4',
                    id: 'select',
                    isSearchable: true,
                    isExtendable: true,
                },
                minItems: 0,
                items: {
                    type: 'string',
                    widget: "string",
                    oneOf: []
                },
                templateMetaData: {
                    isVisible: true,
                    isVisibleModifiable: true,
                    isRequired: false,
                    isRequiredModifiable: true,
                    isDefaultModifiable: true,
                    isMinItemsModifiable: true
                }
            }
        },
        {
            id: Type.CheckboxesMmultipleChoice, name: 'Checkboxes (multiple choice)',
            fieldSchema: {
                type: 'array',
                title: '',
                description: '',
                widget: {
                    htmlClass: 'col-12',
                    id: 'checkbox'
                },
                minItems: 0,
                items: {
                    type: 'string',
                    widget: 'string',
                    oneOf: []
                },
                templateMetaData: {
                    isVisible: true,
                    isVisibleModifiable: true,
                    isRequired: false,
                    isRequiredModifiable: true,
                    isDefaultModifiable: true,
                    isMinItemsModifiable: true
                }
            }
        },
        // Note: will be implement in ET-4090
        // {
        //     id: Type.Upload, name: 'Upload',
        //     fieldSchema: {
        //         type: 'object',
        //         title: '',
        //         description: '',
        //         widget: {
        //             htmlClass: 'col-12',
        //             id: 'files-section'
        //         },
        //         properties: {
        //             documents: {
        //                 type: 'array',
        //                 widget: {
        //                     htmlClass: 'col-12 mt-4',
        //                     id: 'files-array'
        //                 },
        //                 minItems: 1,
        //                 items: {
        //                     $ref: "#/definitions/documentItems"
        //                 },
        //                 templateMetaData: {
        //                     isVisible: true,
        //                     isVisibleModifiable: false,
        //                     isRequired: false,
        //                     isRequiredModifiable: false,
        //                     isDefaultModifiable: true,
        //                     isMinItemsModifiable: true
        //                 }
        //             }
        //         },
        //         fieldsets: [
        //             {
        //                 id: 'documents',
        //                 title: '',
        //                 description: '',
        //                 name: '',
        //                 fields: [
        //                     'documents'
        //                 ]
        //             }
        //         ],
        //         templateMetaData: {
        //             isAtomic: true,
        //             isVisible: true,
        //             isVisibleModifiable: true,
        //             isRequired: false,
        //             isRequiredModifiable: true,
        //             isDefaultModifiable: false
        //         }
        //     }
        // }
    ];
}
