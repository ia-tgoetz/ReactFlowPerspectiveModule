import * as dagre from 'dagre';
import { Node, Edge, MarkerType } from 'reactflow';

export interface IgnitionHierarchyNode {
    id: string;
    name: string;
    variant: string; 
    parentId: string | null;
    style?: any;
    edgeOrientation?: 'auto' | 'TB' | 'LR'; //  Added to interface
}

export const getLayoutedElements = (
    ignitionNodes: IgnitionHierarchyNode[], 
    direction: 'TB' | 'LR' = 'TB',
    lineType: string = 'smoothstep'
) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    const nodeWidth = 200;
    const nodeHeight = 80;
    dagreGraph.setGraph({ rankdir: direction });

    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    ignitionNodes.forEach((node) => {
        flowNodes.push({
            id: node.id,
            type: 'hierarchyNode',
            data: { 
                label: node.name, 
                variant: node.variant,
                style: node.style,
                edgeOrientation: node.edgeOrientation || 'auto' //  Pass to React node
            },
            position: { x: 0, y: 0 } 
        });
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });

        if (node.parentId) {
            flowEdges.push({
                id: `e-${node.parentId}-${node.id}`,
                source: node.parentId,
                target: node.id,
                type: lineType === 'bezier' ? 'default' : lineType, 
                animated: node.variant === 'in_progress',
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#888',
                },
                style: { stroke: '#888', strokeWidth: 2 }
            });
            dagreGraph.setEdge(node.parentId, node.id);
        }
    });

    dagre.layout(dagreGraph);

    flowNodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
    });

    return { layoutedNodes: flowNodes, layoutedEdges: flowEdges };
};