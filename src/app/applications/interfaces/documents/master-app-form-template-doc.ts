import { AppFormTemplate } from '../app-form-template';
import { Document } from './document';

export interface MasterAppFormTemplateDoc extends Document {
    formTemplate: AppFormTemplate;
}
