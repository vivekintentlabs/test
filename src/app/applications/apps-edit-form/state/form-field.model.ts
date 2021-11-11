import { ValueFieldMetaData } from 'app/applications/interfaces/forms/field';

export interface FormField extends ValueFieldMetaData {
  _path: string;
}
