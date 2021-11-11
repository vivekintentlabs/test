import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { Utils } from 'app/common/utils';
import * as _ from 'lodash';

import { AppFormTemplate } from '../../interfaces/app-form-template';
import { ValueFieldMetaData } from '../../interfaces/forms/field';
import { Custom } from '../custom';
import { ExpandableNode, VisibilityModifiable, LeafNode, FieldNode, FlatFieldNode } from '../node';

const UNNAMED_FIELD = 'No Label';

@Component({
    selector: 'sf-field-list',
    templateUrl: 'field-list.component.html'
})
export class FieldListComponent implements OnChanges {
    @Input() formTemplate: AppFormTemplate;
    @Output() fieldVisibilityChange = new EventEmitter<{ fieldPath: string, isVisible: boolean }>();
    @Output() addCustomField = new EventEmitter<{ node: ExpandableNode }>();
    @Output() deleteCustomField = new EventEmitter<{ node: LeafNode }>();
    @Output() expansionChange = new EventEmitter<FlatFieldNode>();
    treeControl = new FlatTreeControl<FlatFieldNode>(node => node.level, node => node.expandable);
    treeFlattener = new MatTreeFlattener(this._toFlat, node => node.level, node => node.expandable, this._getChildren);
    dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    protected _expandedIds: string[] = [];
    customFieldStr = Custom.customFieldStr;

    ngOnChanges() {
        if (this.formTemplate) {
            this.dataSource.data = this._toNodes(this.formTemplate);
        }
        // Maintain expanded nodes between changes
        this.treeControl.dataNodes.forEach(node => {
            if (this._expandedIds.includes(node.id)) {
                this.treeControl.expand(node);
            }
        });
    }

    hasChild = (_index: number, node: FlatFieldNode) => node.expandable;

    toggleVisibility(node: VisibilityModifiable) {
        if (node.visibilityModifiable) {
            node.visible = !node.visible;
            this.fieldVisibilityChange.emit({ fieldPath: node.path, isVisible: node.visible });
        }
    }

    addCustom(node: ExpandableNode) {
        this.addCustomField.emit({ node });
    }

    deleteCustom(node: LeafNode) {
        return Utils.deletedQuestion().then(result => {
            if (result?.value) {
                this.deleteCustomField.emit({ node });
            }
        });
    }

    onExpansionChange(node: FlatFieldNode) {
        this._saveExpansionState(node);
        this.expansionChange.emit(node);
    }

    getTooltip(node: VisibilityModifiable): string {
        if (!node.visibilityModifiable) {
            return;
        }
        if (node.visible) {
            return 'Remove from form';
        } else {
            return 'Include on form';
        }
    }

    getDisabledTooltip(node: LeafNode): string {
        if (!node.visibilityModifiable && node.visible) {
            return 'This field can not be removed';
        }
    }

    protected _saveExpansionState(node: FlatFieldNode) {
        // if removing this node id returns nothing, then it means we need to add it
        if (!_.remove(this._expandedIds, value => value === node.id).length && node.id) {
            this._expandedIds.push(node.id);
        }
    }

    protected _toFlat(fieldNode: FieldNode, level: number): FlatFieldNode {
        return {
            ...fieldNode,
            level
        };
    }

    protected _getChildren(field: FieldNode) {
        if (field.expandable) {
            return field.children;
        }
    }

    protected _toNodes(form): FieldNode[] {
        const fieldNodes = this._transformField(form, '');
        this.addCustomNode(fieldNodes);
        return fieldNodes;
    }

    protected _transformField(field: ValueFieldMetaData, path: string): FieldNode[] {
        if (field.widget === 'hidden' || (typeof field.widget === 'object' && field.widget?.id === 'hidden')) {
            return [];
        }
        if (field.templateMetaData?.isAtomic) {
            return [this._getLeafNode(field, path)];
        }
        switch (field.type) {
            case 'object':
                return this._transformObject(field, path);
            case 'array':
                return [this._transformArray(field, path)];
            default:
                return [this._getLeafNode(field, path)];
        }
    }

    protected _transformObject(objectField: ValueFieldMetaData, path: string): FieldNode[] {
        const fieldsById = objectField.properties;
        const fieldSets = objectField.fieldsets;
        const nodes: FieldNode[] = [];

        if (!fieldsById) { throw new Error(`[${path}] missing required property [properties].`); }

        if (_.isEmpty(fieldSets)) {
            _.forIn(fieldsById, (field, fieldId) => {
                nodes.push(...this._transformField(field, `${path}/${fieldId}`));
            });
            return this._wrapObjectNodes(nodes, objectField, path);
        }

        // Groups nodes by field sets and preserve field ordering
        for (let i = 0; i < fieldSets.length; i++) {
            const fieldSet = fieldSets[i];
            const fieldSetId = fieldSet.id || i.toString();
            const name = fieldSet.title || objectField.title || objectField.templateMetaData?.description
                || fieldSet.description || objectField.description || UNNAMED_FIELD;
            const node: ExpandableNode = {
                // Not a true field path, so calling it id is more appropriate
                // Just using the field set id is not very unique (sometimes collides with field id)
                id: `${path}/fieldset-${fieldSetId}`,
                expandable: true,
                name,
                children: [],
                path,
                fieldSetId,
                type: 'object'
            };

            fieldSet.fields.forEach(fieldId => {
                node.children.push(...this._transformField(fieldsById[fieldId], `${path}/${fieldId}`));
            });

            if (fieldSets.length === 1) {
                // Keep object flat if there is only 1 field set
                if (node.children.length) {
                    nodes.push(...node.children);
                } else {
                    // Since node has no children, treat field as a leaf node
                    // Return early because this node should not be re-wrapped
                    return [this._getLeafNode(objectField, path, fieldSet.title)];
                }
            } else if (node.children.length === 1) {
                const onlyChild = node.children[0];
                if (onlyChild.name === UNNAMED_FIELD && fieldSet.title) {
                    onlyChild.name = fieldSet.title;
                }
                nodes.push(onlyChild);
            } else {
                nodes.push(node);
            }
        }
        return this._wrapObjectNodes(nodes, objectField, path);
    }

    protected _wrapObjectNodes(nodes: FieldNode[], objectField: ValueFieldMetaData, path: string) {
        if (objectField.templateMetaData?.isVisibleModifiable) {
            const name = objectField.title || objectField.templateMetaData?.description
                || objectField.description || UNNAMED_FIELD;
            const node: ExpandableNode & VisibilityModifiable = {
                id: path,
                expandable: true,
                name,
                children: nodes,
                visible: objectField.templateMetaData.isVisible,
                visibilityModifiable: objectField.templateMetaData.isVisibleModifiable,
                path,
                fieldSetId: objectField.fieldsets[0].id,
                type: 'object'
            };
            return [node];
        }
        return nodes;
    }

    protected _transformArray(arrayField: ValueFieldMetaData & { items?: ValueFieldMetaData }, path: string): FieldNode {
        const innerField = arrayField.items;
        if (!innerField) { throw new Error(`[${path}] missing required property [items].`); }
        if (innerField.type === 'object') {
            const name = innerField.title || innerField.templateMetaData?.description || arrayField.title
                || arrayField.templateMetaData?.description || arrayField.description || UNNAMED_FIELD;
            const node: ExpandableNode & VisibilityModifiable = {
                id: path,
                expandable: true,
                name,
                children: this._transformField(innerField, `${path}/*`),
                visible: arrayField.templateMetaData?.isVisible,
                visibilityModifiable: arrayField.templateMetaData?.isVisibleModifiable,
                path,
                type: 'array'
            };
            return node;
        } else {
            return this._getLeafNode(arrayField, path, innerField.title);
        }
    }

    /**
     * Creates a mat tree leaf node from a schema form field.
     * @param field Data for leaf node
     * @param path `ngx-schema-form` style path to the field
     * @param fallbackName Name to use if the `field` does not have a `title`
     */
    protected _getLeafNode(field: ValueFieldMetaData, path: string, fallbackName?: string): LeafNode {
        return {
            id: path,
            expandable: false,
            name: field.title || fallbackName || field.templateMetaData?.description || field.description || UNNAMED_FIELD,
            visible: field.templateMetaData?.isVisible,
            visibilityModifiable: field.templateMetaData?.isVisibleModifiable,
            path
        };
    }

    /**
     * Insert to each expandable leaf node "Add custom field".
     * @param fieldNodes
     */
    addCustomNode(fieldNodes: FieldNode[]) {
        _.forEach(fieldNodes, (fieldNode: FieldNode) => {
            if (fieldNode.expandable && !_.isEmpty(fieldNode.children)) {
                if (fieldNode.children.some(e => !e.expandable && !e?.['isCustom'])) {
                    fieldNode.children.push({
                        id: fieldNode.path,
                        expandable: false,
                        name: 'Custom',
                        path: fieldNode.path,
                        fieldSetId: fieldNode.fieldSetId,
                        type: fieldNode.type,
                        isCustom: true
                    } as unknown as FieldNode);
                }
                this.addCustomNode(fieldNode.children);
            }
        });
    }
}
