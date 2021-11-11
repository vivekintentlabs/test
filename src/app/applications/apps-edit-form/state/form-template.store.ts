import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

import { AppFormTemplate } from 'app/applications/interfaces/app-form-template';

export interface FormTemplateState extends AppFormTemplate {
  loading?: boolean;
}

export function createInitialState(): FormTemplateState {
  return {
    name: 'Blank form',
    type: 'object',
    properties: {},
    widget: 'object',
    templateMetaData: {} as any,
    $schema: 'http://json-schema.org/draft-04/hyper-schema#',
    loading: true
  };
}

@Injectable()
@StoreConfig({ name: 'form-template' })
export class FormTemplateStore extends Store<FormTemplateState> {

  constructor() {
    super(createInitialState());
  }

}
