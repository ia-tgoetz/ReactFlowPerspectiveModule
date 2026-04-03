import * as React from 'react';
import { ComponentProps } from '@inductiveautomation/perspective-client';

// 1. Define the shape of our data based on databaseschema.props.json
export interface TableDef {
    id: string;
    name: string;
    columns: string[];
}

export interface RelationshipDef {
    source: string;
    sourceColumn: string;
    target: string;
    targetColumn: string;
    type: string;
}

// 2. Define the main properties interface
export interface DatabaseSchemaProps {
    tables: TableDef[];
    relationships: RelationshipDef[];
}

// 3. Create the React Component
export function DatabaseSchema(props: ComponentProps<DatabaseSchemaProps>) {
    // We only pull 'tables' from the props to avoid "unused variable" errors for 'relationships'
    const { tables } = props.props;

    const containerStyle: React.CSSProperties = {
        padding: '10px',
        backgroundColor: '#f4f4f4',
        border: '1px solid #ccc',
        width: '100%',
        height: '100%',
        overflow: 'auto'
    };

    return (
        <div style={containerStyle} {...props.emit()}>
            <h2>SQL Historian Schema</h2>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {/* Ensure tables exists before mapping */}
                {tables && tables.map((table: TableDef) => (
                    <div key={table.id} style={{ border: '1px solid black', padding: '10px', background: 'white', minWidth: '150px' }}>
                        <strong>{table.name}</strong>
                        <hr />
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            {table.columns.map((col: string, idx: number) => (
                                <li key={idx}>{col}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}