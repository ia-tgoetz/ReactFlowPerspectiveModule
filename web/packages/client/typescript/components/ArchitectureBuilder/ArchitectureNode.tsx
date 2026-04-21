import React from 'react';
// @ts-ignore
import { Handle, Position, NodeProps } from 'reactflow';

export interface ArchitectureNodeData {
    label: string;
    svg: string;
    tooltip?: string;
    configs?: any;
    style?: any;
    labelStyle?: any; // <-- Added labelStyle to the interface
    paletteId: string;
    hideHandles?: boolean;
    globalHideHandles?: boolean;
    onGearClick?: (id: string, event: React.MouseEvent) => void;
}

export const ArchitectureNode = ({ id, data, selected }: NodeProps<ArchitectureNodeData>) => {
    const showHandles = !data.globalHideHandles && !data.hideHandles;

    // <-- Extract from the dedicated labelStyle object!
    const finalLabelBg = data.labelStyle?.backgroundColor || 'var(--neutral-30)';
    const finalLabelColor = data.labelStyle?.color || 'var(--neutral-90)';
    const finalGearColor = data.labelStyle?.fill || finalLabelColor; // Using 'fill' for the gear color

    const combinedStyle: React.CSSProperties = {
        padding: '40px 10px 10px 10px', 
        borderRadius: '8px',
        backgroundColor: 'var(--neutral-10)',
        border: selected ? '2px solid var(--callToAction)' : '1px solid var(--neutral-50)',
        color: 'var(--neutral-90)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '120px', 
        minHeight: '120px',
        boxShadow: selected ? '0 0 0 2px rgba(0, 123, 255, 0.25)' : '0 2px 4px rgba(0,0,0,0.1)',
        position: 'relative',
        ...(data.style || {}) // Safe to spread because it's completely separate from the label!
    };

    return (
        <div style={combinedStyle} title={data.tooltip}>
            <style>
                {`
                .arch-node-gear { transform-origin: 50% 50%; transition: transform 0.75s ease-in-out; }
                .arch-node-gear:hover { transform: rotate(360deg); }
                .arch-node-gear:active { transform: translateX(-100%) rotate(-360deg); }
                `}
            </style>

            {showHandles && <Handle type="source" position={Position.Top} id="top" style={{ background: 'var(--neutral-50)' }} />}

            <div
                style={{
                    position: 'absolute', top: 0, left: 0,
                    backgroundColor: finalLabelBg, padding: '4px 8px',
                    borderTopLeftRadius: '6px', borderBottomRightRadius: '8px',
                    fontSize: '12px', fontWeight: 'bold', color: finalLabelColor,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    ...(data.labelStyle || {}) // Spread any extra properties (like borders/shadows) onto the tab
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (data.onGearClick) data.onGearClick(id, e);
                }}
            >
                <div className="arch-node-gear" style={{ display: 'flex', alignItems: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill={finalGearColor}>
                        <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/>
                    </svg>
                </div>
                <span>{data.label}</span>
            </div>

            {data.svg && <div style={{ width: '60px', height: '60px' }} dangerouslySetInnerHTML={{ __html: data.svg }} />}

            {showHandles && (
                <>
                    <Handle type="source" position={Position.Right} id="right" style={{ background: 'var(--neutral-50)' }} />
                    <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: 'var(--neutral-50)' }} />
                    <Handle type="source" position={Position.Left} id="left" style={{ background: 'var(--neutral-50)' }} />
                </>
            )}
        </div>
    );
};