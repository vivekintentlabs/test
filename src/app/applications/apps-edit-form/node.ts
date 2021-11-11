export interface Node {
    id: string;
    expandable: boolean;
    name: string;
}

export interface VisibilityModifiable {
    visible: boolean;
    visibilityModifiable: boolean;
    path: string;
}

export interface LeafNode extends Node, VisibilityModifiable {
    expandable: false;
}

export interface ExpandableNode extends Node {
    expandable: true;
    path: string;
    fieldSetId?: string;
    type: string;
    children: FieldNode[];
}

export type FieldNode = LeafNode | ExpandableNode;

export type FlatFieldNode = (LeafNode | Omit<ExpandableNode, 'children'>) & { level: number };
