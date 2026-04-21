import React from 'react';
// @ts-ignore
import { NodeProps, NodeResizer } from 'reactflow'; 

export interface ContainerNodeData {
    label: string;
    style?: any; 
    labelStyle?: any;
    onGearClick?: (id: string, event: React.MouseEvent) => void;
    onResizeEnd?: (id: string, x: number, y: number, width: number, height: number) => void; 
}

export const ContainerNode = ({ id, data, selected }: NodeProps<ContainerNodeData>) => {
    
    const finalLabelBg = data.labelStyle?.backgroundColor || 'var(--neutral-30)';
    const finalLabelColor = data.labelStyle?.color || 'var(--neutral-90)';
    const finalGearColor = data.labelStyle?.fill || finalLabelColor; 

    const combinedStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: data.style?.fill || 'rgba(128, 128, 128, 0.2)', 
        border: '2px dashed var(--neutral-50)', 
        borderRadius: '8px',
        position: 'relative',
        ...(data.style || {}),
        
        outline: selected ? '2px solid var(--callToAction)' : 'none',
        outlineOffset: '2px'
    };

    return (
        <>
            <style>
                {`
                .arch-node-gear { transform-origin: 50% 50%; transition: transform 0.75s ease-in-out; }
                .arch-node-gear:hover { transform: rotate(360deg); }
                .arch-node-gear:active { transform: translateX(-100%) rotate(-360deg); }
                `}
            </style>

            <NodeResizer 
                color="var(--callToAction)" 
                isVisible={selected} 
                minWidth={150} 
                minHeight={150} 
                onResizeEnd={(e, params) => {
                    if (data.onResizeEnd) data.onResizeEnd(id, params.x, params.y, params.width, params.height);
                }}
            />
            <div style={combinedStyle}>
                <div
                    style={{
                        position: 'absolute', top: 0, left: 0,
                        maxWidth: '100%', boxSizing: 'border-box', 
                        backgroundColor: finalLabelBg, padding: '4px 8px',
                        borderTopLeftRadius: '7px', 
                        borderTopRightRadius: '7px', // <-- FIXED
                        borderBottomRightRadius: '8px',
                        fontSize: '12px', fontWeight: 'bold', color: finalLabelColor,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        overflow: 'hidden',
                        ...(data.labelStyle || {}) 
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onGearClick) data.onGearClick(id, e);
                    }}
                    title={data.label} // <-- ADDED
                >
                    <div className="arch-node-gear" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill={finalGearColor}>
                            <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/>
                        </svg>
                    </div>
                    {/* <-- FIXED --> */}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                        {data.label}
                    </span>
                </div>
            </div>
        </>
    );
};