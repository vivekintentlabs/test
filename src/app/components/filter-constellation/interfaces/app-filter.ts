export interface AppFilter {
    id: string;
    name: string;
    type: number;
    display: boolean;
    mandatory: boolean;
    options: DropDownValue[];
    multiple: boolean;
    section?: string;

    selected: string[]; // selected items
    dateRange: { startDate: string, endDate: string }; // daterange
    textValues: string[]; // textbox
    value: any;
}

export interface DropDownValue {
    id: string;
    value: string;
}
