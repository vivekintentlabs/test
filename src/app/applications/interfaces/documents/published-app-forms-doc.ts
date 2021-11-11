import { AppForm } from '../app-form';
import { AppFormTemplate } from '../app-form-template';

export interface PublishedAppFormDoc {
    appFormTemplate: AppFormTemplate; // the published form
    appForm: AppForm; // the blueprint for the form: when a new application is started, this Form is taken
    // as long as this is the latest published version
}
