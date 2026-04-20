import React from 'react';
// @ts-ignore
import { Handle, Position, NodeProps } from 'reactflow';

export interface ArchitectureNodeData {
    label: string;
    svg: string;
    tooltip?: string;
    style?: any;
    configs?: any;
    paletteId: string;
    supportedConnections?: string[];
    hideHandles?: any;
    globalHideHandles?: any;
    onGearClick?: (id: string, event: React.MouseEvent) => void; 
}

export const ArchitectureNode = ({ id, data, selected }: NodeProps<ArchitectureNodeData>) => {
    
    const combinedStyle: React.CSSProperties = {
        position: 'relative', 
        width: '120px', height: '120px',
        backgroundColor: 'var(--neutral-10)', 
        border: selected ? '2px solid var(--callToAction)' : '2px solid var(--neutral-50)',
        boxShadow: selected ? '0 0 8px var(--callToAction)' : 'none',
        borderRadius: '8px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '10px',
        color: 'var(--neutral-90)',
        ...(data.style || {}) 
    };

    // 1. Safely evaluate both booleans
    const localHide = data.hideHandles === true || String(data.hideHandles).toLowerCase() === 'true';
    const globalHide = data.globalHideHandles === true || String(data.globalHideHandles).toLowerCase() === 'true';

    // 2. THE FIX: If local is explicitly true, hide it. Otherwise, fallback to the global state.
    const isHidden = localHide ? true : globalHide;

    const handleOpacity = isHidden ? 0 : 1;
    const handlePointerEvents = isHidden ? 'none' : 'auto';

    const handlePositions = [20, 40, 60, 80];
    const handleStyle = { 
        width: '8px', height: '8px', 
        background: 'var(--neutral-60)', border: 'none',
        opacity: handleOpacity,
        pointerEvents: handlePointerEvents as any
    };

    return (
        <div style={combinedStyle} title={data.tooltip || data.label}>
            <style>
                {`
                .arch-node-gear {
                    transform-origin: 50% 50%;
                    transition: transform 0.75s ease-in-out;
                }
                .arch-node-gear:hover {
                    transform: rotate(360deg);
                }
                .arch-node-gear:active {
                    transform: translateX(-100%) rotate(-360deg);
                }
                `}
            </style>

            <div 
                className="arch-node-gear"
                style={{ position: 'absolute', top: '5px', left: '5px', cursor: 'pointer', padding: '2px', display: 'flex' }}
                onClick={(e) => {
                    e.stopPropagation(); 
                    if (data.onGearClick) data.onGearClick(id, e);
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="var(--neutral-100)">
                    <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/>
                </svg>
            </div>

            {handlePositions.map(p => <Handle key={`t${p}`} type="source" position={Position.Top} id={`t${p}`} style={{ ...handleStyle, left: `${p}%` }} />)}
            {handlePositions.map(p => <Handle key={`b${p}`} type="source" position={Position.Bottom} id={`b${p}`} style={{ ...handleStyle, left: `${p}%` }} />)}
            {handlePositions.map(p => <Handle key={`l${p}`} type="source" position={Position.Left} id={`l${p}`} style={{ ...handleStyle, top: `${p}%` }} />)}
            {handlePositions.map(p => <Handle key={`r${p}`} type="source" position={Position.Right} id={`r${p}`} style={{ ...handleStyle, top: `${p}%` }} />)}

            <div style={{ width: '40px', height: '40px', marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: data.svg }} />
            <div style={{ fontSize: '12px', textAlign: 'center', fontWeight: 'bold' }}>{data.label}</div>
        </div>
    );
};