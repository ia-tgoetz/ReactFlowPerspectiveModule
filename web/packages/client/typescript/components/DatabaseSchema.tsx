import * as React from 'react';
import { ComponentProps } from '@inductiveautomation/perspective-client';
import { observer } from 'mobx-react';
// @ts-ignore
import ReactFlow, { Background, Controls, Node, Edge, Handle, Position, useNodesState, useEdgesState } from 'reactflow';
// @ts-ignore
import 'reactflow/dist/style.css';

export interface DatabaseSchemaProps {
    tables: Array<{ id: string, name: string, columns: string[] }>;
    relationships: Array<{ source: string, sourceColumn: string, target: string, targetColumn: string, type: string }>;
}

// 1. CREATE A CUSTOM NODE TO HOLD OUR CONNECTION HANDLES
const TableNode = ({ data }: any) => {
    return (
        <div style={{ border: '1px solid #555', borderRadius: '5px', background: '#fff', width: '250px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            {/* Table Header */}
            <div style={{ padding: '10px', background: '#f4f4f4', borderBottom: '1px solid #ccc', fontWeight: 'bold', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
                {data.name}
            </div>
            {/* Table Columns */}
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.columns?.map((col: string) => (
                    <div key={col} style={{ position: 'relative', fontSize: '12px', color: '#333' }}>
                        {/* Target Port (Left side) */}
                        <Handle type="target" position={Position.Left} id={col} style={{ left: '-14px', top: '50%' }} />
                        
                        <span>🔑 {col}</span>
                        
                        {/* Source Port (Right side) */}
                        <Handle type="source" position={Position.Right} id={col} style={{ right: '-14px', top: '50%' }} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// Register the custom node type outside the component so it doesn't re-render infinitely
const nodeTypes = { tableNode: TableNode };

export const DatabaseSchema = observer((props: ComponentProps<DatabaseSchemaProps>) => {
    
    const { tables: rawTables, relationships: rawRels } = props.props;

    // Local State to allow dragging!
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // 2. WATCH IGNITION PROPS AND UPDATE LOCAL STATE
    React.useEffect(() => {
        const cleanTables = rawTables ? JSON.parse(JSON.stringify(rawTables)) : [];
        const cleanRels = rawRels ? JSON.parse(JSON.stringify(rawRels)) : [];

        const mappedNodes: Node[] = cleanTables.map((table: any, index: number) => ({
            id: String(table.id),
            type: 'tableNode', // <-- Tell React Flow to use our Custom Node!
            data: { name: table.name, columns: table.columns || [] },
            position: { x: (index % 3) * 350, y: Math.floor(index / 3) * 300 }
        }));

        const mappedEdges: Edge[] = cleanRels.map((rel: any, index: number) => ({
            id: `edge-${index}`,
            source: String(rel.source),
            target: String(rel.target),
            sourceHandle: String(rel.sourceColumn), // <-- Tell React Flow WHICH column to connect FROM
            targetHandle: String(rel.targetColumn), // <-- Tell React Flow WHICH column to connect TO
            animated: rel.type === 'one-to-many',
            label: rel.type,
            style: { stroke: '#007BFF', strokeWidth: 2 }
        }));

        setNodes(mappedNodes);
        setEdges(mappedEdges);
    }, [rawTables, rawRels, setNodes, setEdges]); // Only rebuild if Ignition's data actually changes

    return (
        <div {...props.emit()} style={{ width: '100%', height: '100%', minHeight: '400px', background: '#eaeaea', pointerEvents: 'auto' }}>
            <ReactFlow 
                nodes={nodes} 
                edges={edges} 
                nodeTypes={nodeTypes} 
                onNodesChange={onNodesChange} // <-- This allows you to drag them!
                onEdgesChange={onEdgesChange} 
                fitView
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
});