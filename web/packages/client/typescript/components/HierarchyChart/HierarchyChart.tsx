import * as React from 'react';
import { ComponentProps } from '@inductiveautomation/perspective-client';
import { observer } from 'mobx-react';
import * as dagre from 'dagre';
// @ts-ignore
import ReactFlow, { Background, Controls, Handle, Position, useNodesState, useEdgesState, MarkerType, Node, Edge, Connection, ConnectionLineType } from 'reactflow';
// @ts-ignore
import 'reactflow/dist/style.css';

// --- HELPERS ---
const extractDeep = (obj: any): any => {
    if (obj === null || obj === undefined) return undefined;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj) || typeof obj.map === 'function') {
        return obj.map((item: any) => extractDeep(item));
    }
    const plain: any = {};
    for (const key in obj) {
        plain[key] = extractDeep(obj[key]);
    }
    return plain;
};

const getIgnitionStyle = (styleObj: any) => {
    const plain = extractDeep(styleObj);
    if (!plain) return {};
    const { classes, ...cssProps } = plain;
    return cssProps;
};

const getVariantColor = (variant: string) => {
    switch(variant) {
        case 'complete': return 'var(--success)';
        case 'in_progress': return 'var(--warning)';
        case 'error': return 'var(--error)';
        case 'pending': 
        default: 
            return 'var(--container)'; 
    }
};

const mapConnectionLineType = (type: string) => {
    switch (type) {
        case 'straight': return ConnectionLineType.Straight;
        case 'step': return ConnectionLineType.Step;
        case 'smoothstep': return ConnectionLineType.SmoothStep;
        case 'bezier':
        case 'default':
        default:
            return ConnectionLineType.Bezier;
    }
};

// --- CUSTOM NODE ---
const HierarchyNode = ({ data }: any) => {
    const customStyles = getIgnitionStyle(data.style);
    
    const baseStyles = {
        padding: '10px 20px', 
        border: '1px solid var(--border)', 
        borderRadius: '5px', 
        backgroundColor: getVariantColor(data.variant), 
        color: 'var(--neutral-90)',
        textAlign: 'center' as const,
        minWidth: '150px',
        ...customStyles 
    };

    const handleStyle = { background: 'var(--neutral-60)', width: '8px', height: '8px' };

    return (
        <div style={baseStyles}>
            <Handle type="target" position={Position.Top} id="top-target" style={{...handleStyle, zIndex: 1}} />
            <Handle type="source" position={Position.Top} id="top-source" style={{...handleStyle, zIndex: 2}} />
            
            <Handle type="target" position={Position.Bottom} id="bottom-target" style={{...handleStyle, zIndex: 1}} />
            <Handle type="source" position={Position.Bottom} id="bottom-source" style={{...handleStyle, zIndex: 2}} />
            
            <Handle type="target" position={Position.Left} id="left-target" style={{...handleStyle, zIndex: 1}} />
            <Handle type="source" position={Position.Left} id="left-source" style={{...handleStyle, zIndex: 2}} />
            
            <Handle type="target" position={Position.Right} id="right-target" style={{...handleStyle, zIndex: 1}} />
            <Handle type="source" position={Position.Right} id="right-source" style={{...handleStyle, zIndex: 2}} />
            
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{data.label}</div>
            <div style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase' }}>{data.variant}</div>
        </div>
    );
};

const nodeTypes = { hierarchyNode: HierarchyNode };

// --- MAIN COMPONENT ---
export interface HierarchyChartProps {
    style?: any; 
    nodes: any[];
    layoutDirection: 'TB' | 'LR';
    lineType: 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier'; 
}

export const HierarchyChart = observer((props: ComponentProps<HierarchyChartProps>) => {
    
    const { nodes: propNodes, layoutDirection, lineType } = props.props;

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const activeConnectionLineType = React.useMemo(() => mapConnectionLineType(lineType), [lineType]);

    // 1. Build Visuals
    React.useEffect(() => {
        const safeNodes = extractDeep(propNodes) || [];
        const mappedEdges: any[] = [];

        safeNodes.forEach((node: any) => {
            if (Array.isArray(node.parents)) {
                node.parents.forEach((parentObj: any) => {
                    const sourceNode = safeNodes.find((n: any) => n.id === parentObj.id);
                    if (!sourceNode) return; 

                    let sourceHandle = layoutDirection === 'TB' ? 'bottom-source' : 'right-source';
                    if (parentObj.sourceHandle && parentObj.sourceHandle !== 'auto') {
                        sourceHandle = parentObj.sourceHandle.includes('-') ? parentObj.sourceHandle : `${parentObj.sourceHandle}-source`;
                    }

                    let targetHandle = layoutDirection === 'TB' ? 'top-target' : 'left-target';
                    if (parentObj.targetHandle && parentObj.targetHandle !== 'auto') {
                        targetHandle = parentObj.targetHandle.includes('-') ? parentObj.targetHandle : `${parentObj.targetHandle}-target`;
                    }

                    mappedEdges.push({
                        // ⭐ FIX #1: Guaranteed unique Edge IDs so React Flow lets you select/delete duplicates!
                        id: `e-${parentObj.id}(${sourceHandle})-${node.id}(${targetHandle})`,
                        source: parentObj.id,
                        target: node.id,
                        sourceHandle: sourceHandle,
                        targetHandle: targetHandle,
                        type: lineType === 'bezier' ? 'default' : lineType,
                        animated: node.variant === 'in_progress'
                    });
                });
            }
        });

        const dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setDefaultEdgeLabel(() => ({}));
        dagreGraph.setGraph({ rankdir: layoutDirection });

        safeNodes.forEach((node: any) => dagreGraph.setNode(node.id, { width: 200, height: 80 }));
        mappedEdges.forEach((edge: any) => dagreGraph.setEdge(edge.source, edge.target));

        dagre.layout(dagreGraph);

        const mappedNodes = safeNodes.map((node: any) => {
            const autoPos = dagreGraph.node(node.id);
            const hasManualPosition = node.position && typeof node.position.x === 'number';

            return {
                id: node.id,
                type: 'hierarchyNode',
                data: { label: node.name, variant: node.variant, style: node.style },
                position: hasManualPosition ? node.position : { x: autoPos.x - 100, y: autoPos.y - 40 } 
            };
        });

        setNodes(mappedNodes);
        
        setEdges((currentEdges: any[]) => {
            return mappedEdges.map(newEdge => {
                const existing = currentEdges.find(e => e.id === newEdge.id);
                return existing ? { ...newEdge, selected: existing.selected } : newEdge;
            });
        });
    }, [propNodes, layoutDirection, lineType, setNodes, setEdges]);

    const onNodeDragStop = React.useCallback((event: React.MouseEvent, node: Node) => {
        const safeNodes = extractDeep(props.props.nodes) || [];
        const nodeIndex = safeNodes.findIndex((n: any) => String(n.id) === node.id);
        if (nodeIndex !== -1 && props.store?.props) {
            props.store.props.write(`nodes[${nodeIndex}].position`, { x: Math.round(node.position.x), y: Math.round(node.position.y) });
        }
    }, [props.props.nodes, props.store]);

    // ⭐ FIX #2: ALL Mutation Functions now use "Atomic Writes" to prevent Ignition Race Conditions

    const onConnect = React.useCallback((params: Connection) => {
        if (params.source === params.target) return; 
        const safeNodes = extractDeep(props.props.nodes) || [];
        
        const nextNodes = safeNodes.map((node: any) => {
            if (String(node.id) === params.target) {
                const currentParents = Array.isArray(node.parents) ? [...node.parents] : [];
                return {
                    ...node,
                    parents: [...currentParents, {
                        id: params.source,
                        sourceHandle: params.sourceHandle || 'auto',
                        targetHandle: params.targetHandle || 'auto'
                    }]
                };
            }
            return node;
        });

        if (props.store?.props) props.store.props.write('nodes', nextNodes); // ATOMIC WRITE
    }, [props.props.nodes, props.store]);

    const onEdgeUpdate = React.useCallback((oldEdge: Edge, newConnection: Connection) => {
        if (newConnection.source === newConnection.target) return;
        const safeNodes = extractDeep(props.props.nodes) || [];
        
        const nextNodes = safeNodes.map((node: any) => {
            let nextParents = Array.isArray(node.parents) ? [...node.parents] : [];
            let changed = false;

            // Remove old connection
            if (String(node.id) === oldEdge.target) {
                nextParents = nextParents.filter((p: any) => p.id !== oldEdge.source);
                changed = true;
            }

            // Add new connection
            if (String(node.id) === newConnection.target) {
                nextParents.push({
                    id: newConnection.source,
                    sourceHandle: newConnection.sourceHandle || 'auto',
                    targetHandle: newConnection.targetHandle || 'auto'
                });
                changed = true;
            }

            return changed ? { ...node, parents: nextParents } : node;
        });

        if (props.store?.props) props.store.props.write('nodes', nextNodes); // ATOMIC WRITE
    }, [props.props.nodes, props.store]);

    const onEdgesDelete = React.useCallback((edgesToDelete: Edge[]) => {
        const safeNodes = extractDeep(props.props.nodes) || [];
        let hasChanges = false;
        
        const nextNodes = safeNodes.map((node: any) => {
            // Find any deleted edges that point to this specific node
            const edgesTargetingThisNode = edgesToDelete.filter(e => e.target === String(node.id));
            
            if (edgesTargetingThisNode.length > 0 && Array.isArray(node.parents)) {
                hasChanges = true;
                const sourcesToRemove = edgesTargetingThisNode.map(e => e.source);
                return {
                    ...node,
                    // Filter them out of the parents array
                    parents: node.parents.filter((p: any) => !sourcesToRemove.includes(p.id))
                };
            }
            return node;
        });

        // Push the entire, perfectly cleaned array to Ignition in one single command
        if (hasChanges && props.store?.props) {
            props.store.props.write('nodes', nextNodes); // ATOMIC WRITE
        }
    }, [props.props.nodes, props.store]);


    // Apply dynamic styling for selected edges
    const displayEdges = edges.map((edge: any) => ({
        ...edge,
        style: {
            stroke: edge.selected ? 'var(--callToAction)' : '#888',
            strokeWidth: edge.selected ? 3 : 2
        },
        markerEnd: { 
            type: MarkerType.ArrowClosed, 
            width: 20, 
            height: 20, 
            color: edge.selected ? 'var(--callToAction)' : '#888' 
        }
    }));

    return (
        <div {...props.emit()} style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={displayEdges} 
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStop={onNodeDragStop} 
                onConnect={onConnect} 
                onEdgeUpdate={onEdgeUpdate} 
                onEdgesDelete={onEdgesDelete} 
                connectionLineType={activeConnectionLineType}
                fitView
                nodesDraggable={true} 
                nodesConnectable={true} 
            >
                <Background color="var(--neutral-40)" gap={16} />
                <Controls />
            </ReactFlow>
        </div>
    );
});