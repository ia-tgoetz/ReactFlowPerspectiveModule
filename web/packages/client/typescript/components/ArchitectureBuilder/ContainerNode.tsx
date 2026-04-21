import React from 'react';
// @ts-ignore
import { NodeProps, NodeResizer } from 'reactflow'; 

export interface ContainerNodeData {
    label: string;
    style?: any; 
    onGearClick?: (id: string, event: React.MouseEvent) => void;
    onResizeEnd?: (id: string, x: number, y: number, width: number, height: number) => void; 
}

export const ContainerNode = ({ id, data, selected }: NodeProps<ContainerNodeData>) => {
    return (
        <>
            <NodeResizer 
                color="var(--callToAction)" 
                isVisible={selected} 
                minWidth={150} 
                minHeight={150} 
                onResizeEnd={(e, params) => {
                    if (data.onResizeEnd) data.onResizeEnd(id, params.x, params.y, params.width, params.height);
                }}
            />
            <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: data.style?.backgroundColor || data.style?.fill || 'rgba(128, 128, 128, 0.2)',
                border: selected ? '2px solid var(--callToAction)' : '2px dashed var(--neutral-50)',
                borderRadius: '8px',
                position: 'relative'
            }}>
                <div
                    style={{
                        position: 'absolute', top: 0, left: 0,
                        backgroundColor: 'var(--neutral-30)', padding: '4px 8px',
                        borderTopLeftRadius: '6px', borderBottomRightRadius: '8px',
                        fontSize: '12px', fontWeight: 'bold', color: 'var(--neutral-90)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center'
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onGearClick) data.onGearClick(id, e);
                    }}
                >
                    ⚙️ {data.label}
                </div>
            </div>
        </>
    );
};