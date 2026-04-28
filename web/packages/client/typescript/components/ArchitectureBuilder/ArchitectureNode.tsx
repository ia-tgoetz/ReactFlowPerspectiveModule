import React from 'react';
// @ts-ignore
import { Handle, Position, NodeProps } from 'reactflow';

export interface ArchitectureNodeData {
    label: string;
    b64Image: string;
    text?: string;
    tooltip?: string;
    configs?: any;
    style?: any;
    labelStyle?: any;
    textStyle?: any;
    paletteId: string;
    inactive?: boolean;
    hideHandles?: boolean;
    globalHideHandles?: boolean;
    handleCount?: number;
    onGearClick?: (id: string, event: React.MouseEvent) => void;
    onTextChange?: (id: string, text: string) => void;
}

const TEXT_PALETTE_IDS = new Set(['Note', 'Label']);

const toImgSrc = (value: string): string | null => {
    if (!value) return null;
    if (value.startsWith('data:')) return value;
    if (/^\s*</.test(value)) return `data:image/svg+xml,${encodeURIComponent(value)}`;
    return null;
};

const NodeImage = ({ src }: { src: string }) => {
    const imgSrc = toImgSrc(src);
    if (!imgSrc) return null;
    return <img src={imgSrc} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
};

export const ArchitectureNode = ({ id, data, selected }: NodeProps<ArchitectureNodeData>) => {
    const showHandles = !data.globalHideHandles && !data.hideHandles;
    const isTextNode = TEXT_PALETTE_IDS.has(data.paletteId);

    const [localText, setLocalText] = React.useState(data.text || '');
    React.useEffect(() => { setLocalText(data.text || ''); }, [data.text]);

    const finalLabelBg = data.labelStyle?.backgroundColor || 'var(--neutral-30)';
    const finalLabelColor = data.labelStyle?.color || 'var(--neutral-90)';
    const finalGearColor = data.labelStyle?.fill || finalLabelColor; 

    const { backgroundColor: imageBg, ...restStyle } = data.style || {};

    const combinedStyle: React.CSSProperties = {
        padding: '10px',
        borderRadius: '8px',
        backgroundColor: 'var(--neutral-10)',
        border: '1px solid var(--neutral-50)',
        color: 'var(--neutral-90)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '150px',
        height: '150px',
        boxSizing: 'border-box',
        position: 'relative',
        ...restStyle,
        filter: data.inactive ? 'grayscale(100%)' : (restStyle.filter || undefined),
        boxShadow: selected ? '0 0 0 2px rgba(0, 123, 255, 0.25)' : (restStyle.boxShadow || '0 2px 4px rgba(0,0,0,0.1)')
    };

    const handleStyle: React.CSSProperties = {
        background: 'var(--neutral-90)',
        width: '8px',
        height: '8px',
        minWidth: '8px',
        minHeight: '8px',
        opacity: showHandles ? 1 : 0,
        pointerEvents: showHandles ? 'auto' : 'none',
        border: showHandles ? '1px solid var(--neutral-90)' : 'none',
        transition: 'all 0.15s ease-in-out'
    };
    
    const handleCount = Math.max(1, Math.min(8, Number(data.handleCount) || 5));
    const positions = Array.from({ length: handleCount }, (_, i) => `${((i + 0.5) / handleCount) * 100}%`);

    return (
        <div style={combinedStyle} title={data.tooltip}>
            {/* All handles are type="source"; ConnectionMode.Loose in the parent allows source-to-source connections */}
            {positions.map((pos, i) => <Handle className="arch-node-handle" key={`top-${i}`} type="source" position={Position.Top} id={`top-${i}`} style={{ ...handleStyle, left: pos }} />)}
            {positions.map((pos, i) => <Handle className="arch-node-handle" key={`right-${i}`} type="source" position={Position.Right} id={`right-${i}`} style={{ ...handleStyle, top: pos }} />)}
            {positions.map((pos, i) => <Handle className="arch-node-handle" key={`bottom-${i}`} type="source" position={Position.Bottom} id={`bottom-${i}`} style={{ ...handleStyle, left: pos }} />)}
            {positions.map((pos, i) => <Handle className="arch-node-handle" key={`left-${i}`} type="source" position={Position.Left} id={`left-${i}`} style={{ ...handleStyle, top: pos }} />)}

            <div
                style={{
                    position: 'absolute', top: 0, left: 0,
                    maxWidth: '100%', boxSizing: 'border-box', 
                    backgroundColor: finalLabelBg, padding: '4px 8px',
                    borderTopLeftRadius: '7px', 
                    borderTopRightRadius: '7px', 
                    borderBottomRightRadius: '8px',
                    fontSize: '12px', fontWeight: 'bold', color: finalLabelColor,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    overflow: 'hidden',
                    zIndex: 10,
                    ...(data.labelStyle || {}) 
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (data.onGearClick) data.onGearClick(id, e);
                }}
                title={data.label} 
            >
                <div className="arch-node-gear" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill={finalGearColor}>
                        <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/>
                    </svg>
                </div>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                    {data.label}
                </span>
            </div>

            {isTextNode ? (
                <textarea
                    className="nodrag nopan"
                    value={localText}
                    onChange={e => setLocalText(e.target.value)}
                    onBlur={() => { if (data.onTextChange) data.onTextChange(id, localText); }}
                    onMouseDown={e => e.stopPropagation()}
                    placeholder="Type here..."
                    style={{
                        flex: 1, width: '100%', minHeight: 0, marginTop: '28px',
                        background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                        color: data.textStyle?.color || 'var(--neutral-90)',
                        fontSize: data.textStyle?.fontSize || '12px',
                        fontFamily: 'inherit', padding: '6px', boxSizing: 'border-box', cursor: 'text'
                    }}
                />
            ) : (
                data.b64Image && (
                    <div
                        className="arch-node-svg-wrapper"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 0, zIndex: 1, backgroundColor: imageBg || undefined }}
                    >
                        <NodeImage src={data.b64Image} />
                    </div>
                )
            )}
        </div>
    );
};