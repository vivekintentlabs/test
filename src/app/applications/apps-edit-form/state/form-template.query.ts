import { Injectable } from '@angular/core';
import { combineQueries, Query } from '@datorama/akita';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ISchema } from 'ngx-schema-form';
import { denormalize } from 'normalizr';
import * as _ from 'lodash';

import { AppFormTemplate } from '../../interfaces/app-form-template';
import { FormTemplateStore, FormTemplateState } from './form-template.store';
import { FormFieldsQuery } from './form-fields.query';
import { FormField } from './form-field.model';
import { fieldSchema } from './form-template.schema';

@Injectable()
export class FormTemplateQuery extends Query<FormTemplateState> {

  constructor(protected store: FormTemplateStore, private fieldsQuery: FormFieldsQuery) {
    super(store);
  }

  selectLoading() {
    return combineQueries([
      super.selectLoading(),
      this.fieldsQuery.selectLoading(),
    ]).pipe(
      map(([isFormLoading, areFieldsLoading]) => {
        return isFormLoading || areFieldsLoading;
      })
    );
  }

  selectFormTemplateSchema(): Observable<AppFormTemplate> {
    return this.selectFormSchema().pipe(
      map(schema => {
        this.cleanUp(schema, false);
        return schema;
      })
    );
  }

  selectSchemaFormSchema(): Observable<ISchema> {
    return this.selectFormSchema(({ templateMetaData }) => templateMetaData?.isVisible !== false).pipe(
      map(schema => {
        this.cleanUp(schema);
        return schema;
      })
    );
  }

  /**
   * Undos the extra data added for the data store
   * @param form Form to clean up
   * @param isSchemaForm Whether we should make compatible for ngx-schema-form
   */
  cleanUp(form: FormTemplateState, isSchemaForm = true) {
    delete form.loading;
    this.cleanUpField(form as unknown as FormField, isSchemaForm);
  }

  cleanUpField(field: FormField, isSchemaForm = true) {
    if (!field) { return; }
    delete field._path;
    switch (field.type) {
      case 'object':
        this.cleanUpObjectField(field, isSchemaForm);
        break;
      case 'array':
        this.cleanUpField(field['items'], isSchemaForm);
        break;
    }
  }

  cleanUpObjectField(field: FormField, isSchemaForm = true) {
    delete field.properties._path;
    _.forIn(field.properties, (child: FormField, key) => {
      if (child) {
        this.cleanUpField(child, isSchemaForm);
        if (isSchemaForm) {
          if (child.templateMetaData?.isRequired) {
            field['required'] = _.union(field['required'], [key]);
          } else {
            _.remove(field['required'], fieldId => fieldId === key);
          }
        }
      } else {
        delete field.properties[key];
      }
    });
    if (isSchemaForm) {
      field.fieldsets = _.cloneDeep(field.fieldsets);
      _.forEach(field.fieldsets, fieldset => _.remove(fieldset.fields, fieldId => !field.properties.hasOwnProperty(fieldId)));
      _.remove(field.fieldsets, fieldset => !fieldset.fields.length);
      _.remove(field['required'], (fieldId: string) => !field.properties.hasOwnProperty(fieldId));
    }
  }

  protected selectFormSchema(filterBy?) {
    return combineQueries([
      this.select(),
      this.fieldsQuery.selectAll({ filterBy, asObject: true })
    ]).pipe(
      filter(([form]) => !form.loading),
      map(([form, fields]) => {
        return denormalize(form, fieldSchema, { fields });
      })
    );
  }

}
