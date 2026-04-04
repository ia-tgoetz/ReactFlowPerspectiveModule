import * as React from 'react';
import { ComponentProps } from '@inductiveautomation/perspective-client';
import { observer } from 'mobx-react';
// @ts-ignore
import ReactFlow, { Background, Controls, Node, Edge, Handle, Position, useNodesState, useEdgesState, addEdge, Connection, ConnectionMode } from 'reactflow';
// @ts-ignore
import 'reactflow/dist/style.css';

export interface DatabaseSchemaProps {
    tables: Array<{ id: string, name: string, columns: string[], headerStyle?: any, rowStyle?: any }>;
    relationships: Array<{ source: string, sourceColumn: string, target: string, targetColumn: string, type: string, lineType?: string, lineColor?: string, lineWidth?: number, style?: any }>;
    headerStyle?: any;
    rowStyle?: any;
}

const isPrimaryKey = (colName: string) => {
    const lower = colName.toLowerCase();
    return lower === 'id' || lower.endsWith('id');
};

// STRIPS "CLASSES" OUT SO REACT DOESN'T COMPLAIN
const sanitizeStyle = (styleObj: any) => {
    if (!styleObj) return {};
    const { classes, ...cssProps } = styleObj;
    return cssProps;
};

const TableNode = ({ data }: any) => {
    return (
        <div style={data.rowStyle}>
            <Handle type="target" position={Position.Top} id="table-top-target" style={{ width: '10px', height: '10px', background: '#555', top: '-5px' }} />
            <Handle type="source" position={Position.Top} id="table-top-source" style={{ width: '10px', height: '10px', background: '#555', top: '-5px' }} />
            
            <Handle type="target" position={Position.Bottom} id="table-bottom-target" style={{ width: '10px', height: '10px', background: '#555', bottom: '-5px' }} />
            <Handle type="source" position={Position.Bottom} id="table-bottom-source" style={{ width: '10px', height: '10px', background: '#555', bottom: '-5px' }} />

            <div style={data.headerStyle}>
                {data.name}
            </div>
            
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.columns?.map((col: string) => (
                    <div key={col} style={{ position: 'relative', fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                        <Handle type="target" position={Position.Left} id={`${col}-left-target`} style={{ left: '-14px', width: '8px', height: '8px' }} />
                        <Handle type="source" position={Position.Left} id={`${col}-left-source`} style={{ left: '-14px', width: '8px', height: '8px' }} />
                        
                        <span style={{ marginLeft: '10px' }}>
                            {isPrimaryKey(col) ? '🔑 ' : '📄 '} {col}
                        </span>
                        
                        <Handle type="target" position={Position.Right} id={`${col}-right-target`} style={{ right: '-14px', width: '8px', height: '8px' }} />
                        <Handle type="source" position={Position.Right} id={`${col}-right-source`} style={{ right: '-14px', width: '8px', height: '8px' }} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const nodeTypes = { tableNode: TableNode };

const BASE_HEADER_STYLE = { padding: '10px', borderBottom: '1px solid #ccc', fontWeight: 'bold', backgroundColor: '#333333', color: '#ffffff', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' };
const BASE_ROW_STYLE = { position: 'relative', border: '1px solid #555', borderRadius: '5px', backgroundColor: '#ffffff', color: '#333333', width: '250px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' };

export const DatabaseSchema = observer((props: ComponentProps<DatabaseSchemaProps>) => {
    
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const tablesString = JSON.stringify(props.props.tables || []);
    const relsString = JSON.stringify(props.props.relationships || []);
    const rootHeaderStyleStr = JSON.stringify(props.props.headerStyle || {});
    const rootRowStyleStr = JSON.stringify(props.props.rowStyle || {});

    React.useEffect(() => {
        let cleanTables = [];
        let cleanRels = [];
        let globalHeaderStyle = {};
        let globalRowStyle = {};
        
        try {
            cleanTables = JSON.parse(tablesString);
            cleanRels = JSON.parse(relsString);
            globalHeaderStyle = sanitizeStyle(JSON.parse(rootHeaderStyleStr));
            globalRowStyle = sanitizeStyle(JSON.parse(rootRowStyleStr));
        } catch(e) {}

        const mappedNodes: Node[] = cleanTables.map((table: any, index: number) => {
            const finalHeaderStyle = { ...BASE_HEADER_STYLE, ...globalHeaderStyle, ...sanitizeStyle(table.headerStyle) };
            const finalRowStyle = { ...BASE_ROW_STYLE, ...globalRowStyle, ...sanitizeStyle(table.rowStyle) };

            return {
                id: String(table.id),
                type: 'tableNode',
                data: { 
                    name: table.name, 
                    columns: table.columns || [], 
                    headerStyle: finalHeaderStyle, 
                    rowStyle: finalRowStyle 
                },
                position: { x: (index % 3) * 350, y: Math.floor(index / 3) * 300 }
            };
        });

        const mappedEdges: Edge[] = cleanRels.map((rel: any, index: number) => {
            const hasSourceCol = !!rel.sourceColumn;
            const hasTargetCol = !!rel.targetColumn;

            const finalEdgeStyle = {
                stroke: rel.lineColor || '#007BFF',
                strokeWidth: rel.lineWidth || 2,
                ...sanitizeStyle(rel.style) 
            };

            return {
                id: `edge-${index}`,
                source: String(rel.source),
                target: String(rel.target),
                data: { sourceCol: rel.sourceColumn, targetCol: rel.targetColumn, lineType: rel.lineType || 'default' }, 
                sourceHandle: hasSourceCol ? `${rel.sourceColumn}-right-source` : 'table-bottom-source',
                targetHandle: hasTargetCol ? `${rel.targetColumn}-left-target` : 'table-top-target',
                type: rel.lineType || 'default', 
                animated: rel.type === 'one-to-many',
                label: rel.type,
                style: finalEdgeStyle
            };
        });

        setNodes(mappedNodes);
        setEdges(mappedEdges);
    }, [tablesString, relsString, rootHeaderStyleStr, rootRowStyleStr, setNodes, setEdges]);

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
            style: { stroke: '#28a745', strokeWidth: 2 } 
        };
        setEdges((eds) => addEdge(newEdge, eds));
    }, [setEdges]);

    return (
        <div {...props.emit()} style={{ width: '100%', height: '100%', minHeight: '400px', background: '#eaeaea', pointerEvents: 'auto' }}>
            <ReactFlow 
                nodes={nodes} 
                edges={edges} 
                nodeTypes={nodeTypes} 
                onNodesChange={onNodesChange} 
                onEdgesChange={onEdgesChange} 
                onConnect={onConnect}
                connectionMode={ConnectionMode.Loose}
                fitView
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
});