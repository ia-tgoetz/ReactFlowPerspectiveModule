import * as React from 'react';
import { ComponentProps } from '@inductiveautomation/perspective-client';
import { observer } from 'mobx-react';
// @ts-ignore
import ReactFlow, { Background, Controls, Node, Edge, Handle, Position, useNodesState, useEdgesState, addEdge, Connection, ConnectionMode, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css'; 
import './DatabaseSchema.css'; 

export interface DatabaseSchemaProps {
    style?: any; 
    tables: Array<{ id: string, name: string, columns: string[], headerStyle?: any, rowStyle?: any, position?: { x: number, y: number } }>;
    relationships: Array<{ source: string, sourceColumn: string, target: string, targetColumn: string, type: string, lineType?: string, lineColor?: string, lineWidth?: number, style?: any }>;
}

const isPrimaryKey = (colName: string) => {
    const lower = colName.toLowerCase();
    return lower === 'id' || lower.endsWith('id');
};

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
                    <div 
                        key={col} 
                        className="db-schema-row"
                        onClick={() => data.onRowClick && data.onRowClick(col)}
                        style={{ cursor: 'pointer' }} 
                    >
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

    const plainTables = extractDeep(props.props.tables) || [];
    const plainRels = extractDeep(props.props.relationships) || [];

    const tablesStr = JSON.stringify(plainTables);
    const relsStr = JSON.stringify(plainRels);

    React.useEffect(() => {
        const mappedNodes: Node[] = plainTables.map((table: any, index: number) => {
            const finalHeaderStyle = getStyle(table.headerStyle);
            const finalRowStyle = getStyle(table.rowStyle);
            const posX = table.position?.x !== undefined ? table.position.x : (index % 3) * 350;
            const posY = table.position?.y !== undefined ? table.position.y : Math.floor(index / 3) * 300;

            return {
                id: String(table.id),
                type: 'tableNode',
                data: { 
                    name: table.name, 
                    columns: table.columns || [], 
                    headerStyle: Object.keys(finalHeaderStyle).length > 0 ? finalHeaderStyle : undefined, 
                    rowStyle: Object.keys(finalRowStyle).length > 0 ? finalRowStyle : undefined,
                    onRowClick: (columnName: string) => {
                        if (props.componentEvents) {
                            props.componentEvents.fireComponentEvent('onRowClick', { tableId: table.id, column: columnName });
                        }
                    }
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

            let markerStart, markerEnd;
            let isAnimated = false;

            switch (rel.type) {
                case 'one-to-many': markerEnd = { type: MarkerType.ArrowClosed, color: edgeColor }; isAnimated = true; break;
                case 'many-to-one': markerStart = { type: MarkerType.ArrowClosed, color: edgeColor }; isAnimated = true; break;
                case 'one-to-one': markerStart = { type: MarkerType.ArrowClosed, color: edgeColor }; markerEnd = { type: MarkerType.ArrowClosed, color: edgeColor }; isAnimated = false; break;
                case 'none': default: isAnimated = false; break;
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
        
    }, [tablesStr, relsStr, setNodes, setEdges, props]); 

    React.useEffect(() => {
        setEdges((currentEdges) => {
            let hasChanges = false;
            const newEdges = currentEdges.map((edge) => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                
                if (sourceNode && targetNode && edge.data) {
                    const sourceX = sourceNode.position.x;
                    const targetX = targetNode.position.x;
                    const sourceY = sourceNode.position.y;
                    const targetY = targetNode.position.y;
                    const isVerticallyAligned = Math.abs(sourceX - targetX) < 150;
                    const sourceIsLeft = sourceX < targetX;
                    const sourceIsAbove = sourceY < targetY;
                    let newSourceHandle, newTargetHandle;

                    if (isVerticallyAligned) {
                        newSourceHandle = edge.data.sourceCol ? `${edge.data.sourceCol}-right-source` : (sourceIsAbove ? 'table-bottom-source' : 'table-top-source');
                        newTargetHandle = edge.data.targetCol ? `${edge.data.targetCol}-right-target` : (sourceIsAbove ? 'table-top-target' : 'table-bottom-target');
                    } else {
                        newSourceHandle = edge.data.sourceCol ? (sourceIsLeft ? `${edge.data.sourceCol}-right-source` : `${edge.data.sourceCol}-left-source`) : (sourceIsAbove ? 'table-bottom-source' : 'table-top-source');
                        newTargetHandle = edge.data.targetCol ? (sourceIsLeft ? `${edge.data.targetCol}-left-target` : `${edge.data.targetCol}-right-target`) : (sourceIsAbove ? 'table-top-target' : 'table-bottom-target');
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
        const newEdge = { 
            ...params, 
            data: { sourceCol: parseHandle(params.sourceHandle), targetCol: parseHandle(params.targetHandle), lineType: 'default' },
            type: 'default', 
            animated: true, 
            className: 'db-schema-edge'
        };
        setEdges((eds) => addEdge(newEdge, eds));
    }, [setEdges]);

    const onNodeDragStop = React.useCallback((event: React.MouseEvent, node: Node) => {
        const safeTables = extractDeep(props.props.tables) || [];
        const tableIndex = safeTables.findIndex((t: any) => String(t.id) === node.id);
        if (tableIndex !== -1 && props.store?.props) {
            props.store.props.write(`tables[${tableIndex}].position`, { x: Math.round(node.position.x), y: Math.round(node.position.y) });
        }
    }, [props.props.tables, props.store]);

    return (
        <div {...props.emit({ classes: ['db-schema-root'] })}>
            <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeDragStop={onNodeDragStop} connectionMode={ConnectionMode.Loose} fitView>
                <Background /><Controls />
            </ReactFlow>
        </div>
    );
});