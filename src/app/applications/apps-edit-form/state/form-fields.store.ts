import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';

import { FormField } from './form-field.model';

export interface FormFieldsState extends EntityState<FormField, string> {}

@Injectable()
@StoreConfig({ name: 'form-fields', idKey: '_path' })
export class FormFieldsStore extends EntityStore<FormFieldsState, FormField> {

  constructor() {
    super();
  }

}

