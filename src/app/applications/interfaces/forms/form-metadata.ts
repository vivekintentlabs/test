import { status, FormType, CountryId } from './types';

export interface FormMetaData<T> {
    version: number; // integer number defines the published version
    masterVersion: number; // integer number defines the master version
    status: status;
    formType: FormType;
    countryId?: CountryId;
    setupOptions: T;
}
