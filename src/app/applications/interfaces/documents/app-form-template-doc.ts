import { AppFormTemplate } from '../app-form-template';
import { Document } from './document';

export interface AppFormTemplateDoc extends Document {
    formTemplate: AppFormTemplate;
}
