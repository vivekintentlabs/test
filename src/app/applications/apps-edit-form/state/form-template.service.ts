import { Injectable, OnDestroy } from '@angular/core';
import { EntityStore, Store, UpdateStateCallback } from '@datorama/akita';

import { normalize } from 'normalizr';
import { v4 as uuidv4 } from 'uuid';
import * as _ from 'lodash';

import { ApplicationsService } from 'app/applications/applications.service';
import { AppFormTemplateDoc } from 'app/applications/interfaces/documents/app-form-template-doc';
import { ChildFieldSet } from 'app/applications/interfaces/forms/fieldset';
import { FormField } from './form-field.model';
import { FormFieldsState, FormFieldsStore } from './form-fields.store';
import { FormFieldsQuery } from './form-fields.query';
import { createInitialState, FormTemplateStore } from './form-template.store';
import { FormTemplateQuery } from './form-template.query';
import { formSchema } from './form-template.schema';
import { ValueFieldMetaData } from '../../interfaces/forms/field';
import { Custom } from '../custom';
import { ExpandableNode, LeafNode } from '../node';

@Injectable()
export class FormTemplateService implements OnDestroy {
  private sfFieldsStore: FormFieldsStore =
    new EntityStore<FormFieldsState, FormField>({}, { name: 'schema-form-fields', idKey: '_path', deepFreezeFn: obj => obj });
  private sfFieldsQuery: FormFieldsQuery = new FormFieldsQuery(this.sfFieldsStore);
  private sfQuery: FormTemplateQuery;
  private sfStore: FormTemplateStore;

  constructor(
    private formTemplateStore: FormTemplateStore,
    private formTemplateQuery: FormTemplateQuery,
    private formFieldsStore: FormFieldsStore,
    private appsService: ApplicationsService
  ) {
    this.sfStore = new Store(createInitialState(), { name: 'schema-form-template', deepFreezeFn: obj => obj });
    this.sfQuery = new FormTemplateQuery(this.sfStore, this.sfFieldsQuery);
  }

  ngOnDestroy() {
    this.sfFieldsStore.destroy();
    this.sfStore.destroy();
  }

  get(documentId: string) {
    Promise.all([
      this.appsService.getFormTemplateById(documentId, true),
      this.appsService.getFormTemplateById(documentId, false),
    ]).then(([docWithListOptions, docWithout]: AppFormTemplateDoc[]) => {
      const normalizedTemplate = normalize(docWithout.formTemplate, formSchema);
      this.formFieldsStore.set(normalizedTemplate.entities.fields);
      this.formTemplateStore.update(Object.values(normalizedTemplate.entities.forms)[0]);
      this.formTemplateStore.setLoading(false);

      const normalizedSfSchema = normalize(docWithListOptions.formTemplate, formSchema);
      this.sfFieldsStore.set(normalizedSfSchema.entities.fields);
      this.sfStore.update(Object.values(normalizedSfSchema.entities.forms)[0]);
      this.sfStore.setLoading(false);
    });
  }

  update(id: string, formField: Partial<FormField>) {
    this.formFieldsStore.update(id, this.getUpdateFieldFn(formField));
    this.sfFieldsStore.update(id, this.getUpdateFieldFn(formField));
  }

  updateCustomField(id: string, formField: Partial<FormField>) {
    this.modifyArrayField(formField, id);
    // sfFieldsStore.replace() needs to be executed first to render the page correctly where sfFieldsStore contains items on the left on the page.
    // Note: ngx-schema-form will give error if update() is instead of replace() used
    // because in update() if previous type='string' and current type='array' property is set to "default": "", but default": "" should be removed to handle all kinds of types.
    this.sfFieldsStore.replace(id, formField);
    // After sfFieldsStore is executed, formFieldsStore.replace() needs to be executed where formFieldsStore contains items on the right on the page
    this.formFieldsStore.replace(id, formField);
  }

  insertCustomField(node: ExpandableNode, formField: Partial<FormField>) {
    const customId = Custom.customFieldStr + uuidv4();

    const objectId = node.type === 'array' ? `${node.path}/*` : node.path;
    const entityId = `${objectId}/${customId}`;
    formField._path = entityId;
    const fieldEntity = _.cloneDeep(this.sfFieldsQuery.getEntity(objectId));
    if (node.type === 'array') {
      fieldEntity.fieldsets[0].fields.push(customId);
    } else {
      const index = fieldEntity.fieldsets.findIndex(obj => obj.id === node.fieldSetId);
      fieldEntity.fieldsets[index].fields.push(customId);
    }
    fieldEntity.properties[customId] = entityId as unknown as ValueFieldMetaData;
    this.modifyArrayField(formField, entityId);
    this.formFieldsStore.upsert(entityId, () => formField);
    this.sfFieldsStore.upsert(entityId, () => formField);
    this.sfFieldsStore.update(objectId, () => fieldEntity);
    this.formFieldsStore.update(objectId, () => fieldEntity);
  }

  private modifyArrayField(formField: Partial<FormField>, entityId: string) {
    const formFieldItemsPath = `${entityId}/*`;
    if (formField.type === 'array') {
      const formFieldItems = formField['items'];
      formField['items'] = formFieldItemsPath;
      formFieldItems._path = formFieldItemsPath;
      this.formFieldsStore.upsert(formFieldItemsPath, () => formFieldItems);
      this.sfFieldsStore.upsert(formFieldItemsPath, () => formFieldItems);
    } else {
      this.sfFieldsStore.remove(formFieldItemsPath);
      this.formFieldsStore.remove(formFieldItemsPath);
    }
  }

  updateVisibility(id: string, isVisible: boolean) {
    this.formFieldsStore.update(id, this.getUpdateTemplateMetaDataFn({ isVisible }));
    this.sfFieldsStore.update(id, this.getUpdateTemplateMetaDataFn({ isVisible }));
  }

  delete(node: LeafNode) {
    const arrPath: string[] = node.path.split("/");
    const fieldId = arrPath.pop();
    const objectId = arrPath.join("/");

    const fieldEntity = _.cloneDeep(this.sfFieldsQuery.getEntity(objectId));
    fieldEntity.fieldsets.forEach((i) => {
      _.remove(i.fields, fd => fd === fieldId);
    });
    _.remove(fieldEntity.required, str => str === fieldId);
    delete fieldEntity.properties[fieldId];

    this.sfFieldsStore.update(objectId, () => fieldEntity);
    this.sfFieldsStore.remove(node.path);
    this.formFieldsStore.update(objectId, () => fieldEntity);
    this.formFieldsStore.remove(node.path);
  }

  selectSchemaFormSchema() {
    return this.sfQuery.selectSchemaFormSchema();
  }

  selectFormTemplateSchema() {
    return this.formTemplateQuery.selectFormTemplateSchema();
  }

  protected getUpdateTemplateMetaDataFn(updatedTemplatedMetaData: object): UpdateStateCallback<FormField> {
    return (entity: FormField) => {
      const templateMetaData = {
        ...entity.templateMetaData,
        ...updatedTemplatedMetaData
      };
      return { templateMetaData };
    };
  }

  protected getUpdateFieldFn(updatedField: Partial<FormField>): UpdateStateCallback<FormField> {
    return (entity: FormField) => {
      const updateFieldset = this.getUpdateFieldsetFn(updatedField.fieldsets);
      return {
        ...updateFieldset(entity),
        title: updatedField.title,
        description: updatedField.description,
        default: updatedField.default,
        templateMetaData: updatedField.templateMetaData,
        minItems: updatedField.minItems,
        maxItems: updatedField.maxItems,
      };
    };
  }

  protected getUpdateFieldsetFn(updatedFieldsets: Array<Partial<ChildFieldSet>>): UpdateStateCallback<FormField> {
    return (entity: FormField) => {
      let fieldsets;
      let indexOfUpdated = 0;
      const sameLength = entity.fieldsets?.length === updatedFieldsets?.length;
      entity.fieldsets?.forEach(fieldset => {
        fieldsets = fieldsets || [];
        const updatedFieldset = updatedFieldsets[indexOfUpdated];
        let matchingFieldset = {};
        if (sameLength || fieldset.id === updatedFieldset?.id) {
          matchingFieldset = {
            title: updatedFieldset.title,
            description: updatedFieldset.description
          };
          indexOfUpdated++;
        }
        fieldsets.push({
          ...fieldset,
          ...matchingFieldset,
        });
      });
      return { fieldsets };
    };
  }

}
