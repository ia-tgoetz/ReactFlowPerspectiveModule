import * as React from 'react';
import { ComponentProps } from '@inductiveautomation/perspective-client';
import { observer } from 'mobx-react';
// @ts-ignore
import ReactFlow, { Background, Controls, Node, Edge, Handle, Position, useNodesState, useEdgesState, addEdge, Connection, ConnectionMode, MarkerType } from 'reactflow';
// @ts-ignore
import 'reactflow/dist/style.css';

import './DatabaseSchema.css'; 

export interface DatabaseSchemaProps {
    tables: Array<{ id: string, name: string, columns: string[], headerStyle?: any, rowStyle?: any, position?: { x: number, y: number } }>;
    relationships: Array<{ source: string, sourceColumn: string, target: string, targetColumn: string, type: string, lineType?: string, lineColor?: string, lineWidth?: number, style?: any }>;
}

const isPrimaryKey = (colName: string) => {
    const lower = colName.toLowerCase();
    return lower === 'id' || lower.endsWith('id');
};

// 1. THE BULLETPROOF IGNITION EXTRACTOR
const extractDeep = (obj: any): any => {
    if (obj === null || obj === undefined) return undefined;
    
    // Immediately return basic types (strings, numbers, booleans) so they don't crash!
    if (typeof obj !== 'object') return obj;
    
    // Safely check for Arrays (or MobX observable arrays that act like arrays)
    if (Array.isArray(obj) || typeof obj.map === 'function') {
        return obj.map((item: any) => extractDeep(item));
    }
    
    // Extract actual Objects by looping their keys
    const plain: any = {};
    for (const key in obj) {
        plain[key] = extractDeep(obj[key]);
    }
    return plain;
};

// 2. THE STYLE SANITIZER
const getStyle = (styleObj: any) => {
    const plain = extractDeep(styleObj);
    if (!plain) return {};
    const { classes, ...cssProps } = plain;
    return cssProps;
};

const TableNode = ({ data }: any) => {
    return (
        <div className="db-schema-node" style={data.rowStyle}>
            
            <Handle type="target" position={Position.Top} id="table-top-target" style={{ width: '10px', height: '10px', background: '#555', top: '-5px', zIndex: -1 }} />
            <Handle type="source" position={Position.Top} id="table-top-source" style={{ width: '10px', height: '10px', background: '#555', top: '-5px', zIndex: 1 }} />
            
            <Handle type="target" position={Position.Bottom} id="table-bottom-target" style={{ width: '10px', height: '10px', background: '#555', bottom: '-5px', zIndex: -1 }} />
            <Handle type="source" position={Position.Bottom} id="table-bottom-source" style={{ width: '10px', height: '10px', background: '#555', bottom: '-5px', zIndex: 1 }} />

            <div className="db-schema-header" style={data.headerStyle}>
                {data.name}
            </div>
            
            <div className="db-schema-body">
                {data.columns?.map((col: string) => (
                    <div key={col} className="db-schema-row">
                        <Handle type="target" position={Position.Left} id={`${col}-left-target`} style={{ left: '-14px', width: '8px', height: '8px', zIndex: -1 }} />
                        <Handle type="source" position={Position.Left} id={`${col}-left-source`} style={{ left: '-14px', width: '8px', height: '8px', zIndex: 1 }} />
                        
                        <span style={{ marginLeft: '10px' }}>
                            {isPrimaryKey(col) ? '🔑 ' : '📄 '} {col}
                        </span>
                        
                        <Handle type="target" position={Position.Right} id={`${col}-right-target`} style={{ right: '-14px', width: '8px', height: '8px', zIndex: -1 }} />
                        <Handle type="source" position={Position.Right} id={`${col}-right-source`} style={{ right: '-14px', width: '8px', height: '8px', zIndex: 1 }} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const nodeTypes = { tableNode: TableNode };

export const DatabaseSchema = observer((props: ComponentProps<DatabaseSchemaProps>) => {
    
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // 3. EXTRACT EVERYTHING using the deep loop
    const plainTables = extractDeep(props.props.tables) || [];
    const plainRels = extractDeep(props.props.relationships) || [];

    // Force stringification so React guarantees a re-render when data changes
    const tablesStr = JSON.stringify(plainTables);
    const relsStr = JSON.stringify(plainRels);

    React.useEffect(() => {
        const mappedNodes: Node[] = plainTables.map((table: any, index: number) => {
            const finalHeaderStyle = getStyle(table.headerStyle);
            const finalRowStyle = getStyle(table.rowStyle);

            // Read from the property if it exists, otherwise auto-grid
            const posX = table.position?.x !== undefined ? table.position.x : (index % 3) * 350;
            const posY = table.position?.y !== undefined ? table.position.y : Math.floor(index / 3) * 300;

            return {
                id: String(table.id),
                type: 'tableNode',
                data: { 
                    name: table.name, 
                    columns: table.columns || [], 
                    headerStyle: Object.keys(finalHeaderStyle).length > 0 ? finalHeaderStyle : undefined, 
                    rowStyle: Object.keys(finalRowStyle).length > 0 ? finalRowStyle : undefined
                },
                position: { x: posX, y: posY }
            };
        });

        const mappedEdges: Edge[] = plainRels.map((rel: any, index: number) => {
            const hasSourceCol = !!rel.sourceColumn;
            const hasTargetCol = !!rel.targetColumn;

            const edgeColor = rel.lineColor || 'var(--callToAction)';
            const inlineEdgeStyle: any = { ...getStyle(rel.style), stroke: edgeColor };
            if (rel.lineWidth) inlineEdgeStyle.strokeWidth = rel.lineWidth;

            let markerStart;
            let markerEnd;
            let isAnimated = false;

            switch (rel.type) {
                case 'one-to-many':
                    markerEnd = { type: MarkerType.ArrowClosed, color: edgeColor };
                    isAnimated = true;
                    break;
                case 'many-to-one':
                    markerStart = { type: MarkerType.ArrowClosed, color: edgeColor };
                    isAnimated = true;
                    break;
                case 'one-to-one':
                    markerStart = { type: MarkerType.ArrowClosed, color: edgeColor };
                    markerEnd = { type: MarkerType.ArrowClosed, color: edgeColor };
                    isAnimated = false;
                    break;
                case 'none':
                default:
                    isAnimated = false;
                    break;
            }

            return {
                id: `edge-${index}`,
                source: String(rel.source),
                target: String(rel.target),
                className: 'db-schema-edge',
                data: { sourceCol: rel.sourceColumn, targetCol: rel.targetColumn, lineType: rel.lineType || 'default' }, 
                sourceHandle: hasSourceCol ? `${rel.sourceColumn}-right-source` : 'table-bottom-source',
                targetHandle: hasTargetCol ? `${rel.targetColumn}-left-target` : 'table-top-target',
                type: rel.lineType || 'default', 
                animated: isAnimated,
                markerStart: markerStart,
                markerEnd: markerEnd,
                style: Object.keys(inlineEdgeStyle).length > 0 ? inlineEdgeStyle : undefined
            };
        });

        setNodes(mappedNodes);
        setEdges(mappedEdges);
        
    }, [tablesStr, relsStr, setNodes, setEdges]); 

    React.useEffect(() => {
        setEdges((currentEdges) => {
            let hasChanges = false;
            const newEdges = currentEdges.map((edge) => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                
                if (sourceNode && targetNode && edge.data) {
                    const sourceIsLeft = sourceNode.position.x < targetNode.position.x;
                    const sourceIsAbove = sourceNode.position.y < targetNode.position.y;
                    
                    let newSourceHandle, newTargetHandle;

                    if (edge.data.sourceCol) {
                        newSourceHandle = sourceIsLeft ? `${edge.data.sourceCol}-right-source` : `${edge.data.sourceCol}-left-source`;
                    } else {
                        newSourceHandle = sourceIsAbove ? 'table-bottom-source' : 'table-top-source';
                    }

                    if (edge.data.targetCol) {
                        newTargetHandle = sourceIsLeft ? `${edge.data.targetCol}-left-target` : `${edge.data.targetCol}-right-target`;
                    } else {
                        newTargetHandle = sourceIsAbove ? 'table-top-target' : 'table-bottom-target';
                    }
                    
                    if (edge.sourceHandle !== newSourceHandle || edge.targetHandle !== newTargetHandle) {
                        hasChanges = true;
                        return { ...edge, sourceHandle: newSourceHandle, targetHandle: newTargetHandle };
                    }
                }
                return edge;
            });
            return hasChanges ? newEdges : currentEdges; 
        });
    }, [nodes, setEdges]);

    const onConnect = React.useCallback((params: Edge | Connection) => {
        const parseHandle = (handleId?: string | null) => {
            if (!handleId || handleId.startsWith('table-')) return '';
            return handleId.replace(/-left-source$|-right-source$|-left-target$|-right-target$/, '');
        };

        const baseSource = parseHandle(params.sourceHandle);
        const baseTarget = parseHandle(params.targetHandle);
        
        const newEdge = { 
            ...params, 
            data: { sourceCol: baseSource, targetCol: baseTarget, lineType: 'default' },
            type: 'default', 
            animated: true, 
            className: 'db-schema-edge'
        };
        setEdges((eds) => addEdge(newEdge, eds));
    }, [setEdges]);

// 4. THE WRITE-BACK EVENT
    const onNodeDragStop = React.useCallback((event: React.MouseEvent, node: Node) => {
        // 1. Find the index safely
        const safeTables = extractDeep(props.props.tables) || [];
        const tableIndex = safeTables.findIndex((t: any) => String(t.id) === node.id);
        
        if (tableIndex !== -1) {
            const newX = Math.round(node.position.x);
            const newY = Math.round(node.position.y);
            
            // 2. THE FIX: Tell the Perspective Gateway to update the property tree!
            if (props.store && props.store.props) {
                // This writes exactly to the specific table's position object in the Designer
                props.store.props.write(`tables[${tableIndex}].position`, { x: newX, y: newY });
            } else {
                // Fallback (Local memory only)
                const targetTable = props.props.tables[tableIndex];
                if (targetTable.position) {
                    targetTable.position!.x = newX;
                    targetTable.position!.y = newY;
                }
            }
        }
    }, [props.props.tables, props.store]); // <-- Added props.store to dependencies

    
    return (
        <div {...props.emit()} className="db-schema-root">
            <ReactFlow 
                nodes={nodes} 
                edges={edges} 
                nodeTypes={nodeTypes} 
                onNodesChange={onNodesChange} 
                onEdgesChange={onEdgesChange} 
                onConnect={onConnect}
                onNodeDragStop={onNodeDragStop}
                connectionMode={ConnectionMode.Loose}
                fitView
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
});