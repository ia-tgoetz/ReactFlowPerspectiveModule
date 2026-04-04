// 1. THIS IS THE CRUCIAL CHANGE: import * as React
import * as React from 'react';
import { ComponentProps } from '@inductiveautomation/perspective-client';
// @ts-ignore
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow';
// @ts-ignore
import 'reactflow/dist/style.css';

export interface DatabaseSchemaProps {
    tables: Array<{ id: string, name: string, columns: string[] }>;
    relationships: Array<{ source: string, sourceColumn: string, target: string, targetColumn: string, type: string }>;
}

export function DatabaseSchema(props: ComponentProps<DatabaseSchemaProps>) {
    const { tables, relationships } = props.props;

    // 2. We use React.useMemo now instead of just useMemo
    const nodes: Node[] = React.useMemo(() => {
        if (!tables) return [];
        return tables.map((table, index) => ({
            id: table.id,
            data: { 
                label: (
                    <div style={{ padding: '10px', textAlign: 'left' }}>
                        <strong>{table.name}</strong>
                        <hr style={{ margin: '5px 0' }}/>
                        <div style={{ fontSize: '10px' }}>
                            {table.columns?.map(c => <div key={c}>🔑 {c}</div>)}
                        </div>
                    </div>
                ) 
            },
            position: { x: (index % 3) * 250, y: Math.floor(index / 3) * 150 },
            style: { border: '1px solid #777', borderRadius: '5px', background: '#fff', minWidth: '150px' }
        }));
    }, [tables]);

    const edges: Edge[] = React.useMemo(() => {
        if (!relationships) return [];
        return relationships.map((rel, index) => ({
            id: `edge-${index}`,
            source: rel.source,
            target: rel.target,
            animated: rel.type === 'one-to-many',
            label: rel.type,
            style: { stroke: '#007BFF', strokeWidth: 2 }
        }));
    }, [relationships]);

    return (
        <div {...props.emit()} style={{ width: '100%', height: '100%', minHeight: '400px', background: '#f4f4f4' }}>
            <ReactFlow nodes={nodes} edges={edges} fitView>
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}