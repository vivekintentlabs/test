import { Injectable } from '@angular/core';
import { combineQueries, QueryEntity } from '@datorama/akita';
import { map } from 'rxjs/operators';
import { denormalize } from 'normalizr';

import { FormField } from './form-field.model';
import { FormFieldsStore, FormFieldsState } from './form-fields.store';
import { fieldSchema } from './form-template.schema';

@Injectable()
export class FormFieldsQuery extends QueryEntity<FormFieldsState, FormField> {

  constructor(protected store: FormFieldsStore) {
    super(store);
  }

  selectField(id: string) {
    return combineQueries([
      this.selectEntity(id),
      this.selectAll({ asObject: true })
    ]).pipe(
      map(([rootField, fields]) => {
        return denormalize(rootField, fieldSchema, { fields });
      })
    );
  }

}
