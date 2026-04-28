import * as React from 'react';
import { ComponentProps } from '@inductiveautomation/perspective-client';
import { observer } from 'mobx-react';
// @ts-ignore
import ReactFlow, { ReactFlowProvider, Background, Controls, ConnectionMode } from 'reactflow';
import 'reactflow/dist/style.css';
import { Sidebar, PaletteItem } from './Sidebar';
import { ArchitectureNode } from './ArchitectureNode';
import { ContainerNode } from './ContainerNode';
import { edgeTypes } from './CustomEdge';
import { mapIgnitionToReactFlowEdges } from './EdgeUtils';
import { useArchitectureFlowHandlers } from './useArchitectureFlowHandlers';

// ─── Shared UI primitives ─────────────────────────────────────────────────────

const sharedInputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 8px', backgroundColor: 'var(--neutral-00)', border: '1px solid var(--neutral-40)',
    color: 'var(--neutral-90)', borderRadius: '4px', boxSizing: 'border-box', fontSize: '12px'
};

const standardPalette = [
    '#ffffff', '#e0e0e0', '#c0c0c0', '#a0a0a0', '#808080', '#606060', '#404040', '#202020', '#000000',
    '#ffcccc', '#ff9999', '#ff6666', '#ff3333', '#ff0000', '#cc0000', '#990000', '#660000', '#330000',
    '#ffe5cc', '#ffcc99', '#ffb266', '#ff9933', '#ff8000', '#cc6600', '#994c00', '#663300', '#331900',
    '#ffffcc', '#ffff99', '#ffff66', '#ffff33', '#ffff00', '#cccc00', '#999900', '#666600', '#333300',
    '#ccffcc', '#99ff99', '#66ff66', '#33ff33', '#00ff00', '#00cc00', '#009900', '#006600', '#003300',
    '#ccffff', '#99ffff', '#66ffff', '#33ffff', '#00ffff', '#00cccc', '#009999', '#006666', '#003333',
    '#ccccff', '#9999ff', '#6666ff', '#3333ff', '#0000ff', '#0000cc', '#000099', '#000066', '#000033',
    '#ffccff', '#ff99ff', '#ff66ff', '#ff33ff', '#ff00ff', '#cc00cc', '#990099', '#660066', '#330033'
];

const ColorInput = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder: string }) => {
    const [pickerOpen, setPickerOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'palette' | 'custom'>('palette');

    let currentHex = '#000000';
    let currentAlpha = 1;

    if (value.startsWith('#')) {
        if (value.length === 7) currentHex = value;
        else if (value.length === 9) { currentHex = value.substring(0, 7); currentAlpha = Math.round((parseInt(value.substring(7, 9), 16) / 255) * 100) / 100; }
        else if (value.length === 4) { currentHex = '#' + value[1]+value[1] + value[2]+value[2] + value[3]+value[3]; }
    } else if (value.startsWith('rgba')) {
        const parts = value.match(/[\d.]+/g);
        if (parts && parts.length >= 4) { const r = parseInt(parts[0], 10), g = parseInt(parts[1], 10), b = parseInt(parts[2], 10); currentAlpha = parseFloat(parts[3]); currentHex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }
    } else if (value.startsWith('rgb')) {
        const parts = value.match(/[\d.]+/g);
        if (parts && parts.length >= 3) { const r = parseInt(parts[0], 10), g = parseInt(parts[1], 10), b = parseInt(parts[2], 10); currentHex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }
    }

    const handleColorChange = (newHex: string) => {
        const r = parseInt(newHex.slice(1, 3), 16), g = parseInt(newHex.slice(3, 5), 16), b = parseInt(newHex.slice(5, 7), 16);
        onChange(currentAlpha < 1 ? `rgba(${r}, ${g}, ${b}, ${currentAlpha})` : newHex);
    };
    const handleAlphaChange = (newAlpha: number) => {
        const r = parseInt(currentHex.slice(1, 3), 16), g = parseInt(currentHex.slice(3, 5), 16), b = parseInt(currentHex.slice(5, 7), 16);
        onChange(newAlpha === 1 ? currentHex : `rgba(${r}, ${g}, ${b}, ${newAlpha})`);
    };

    return (
        <div style={{ position: 'relative', display: 'flex', gap: '6px', marginTop: '4px' }}>
            <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...sharedInputStyle, marginTop: 0, flex: 1 }} />
            <div onClick={() => setPickerOpen(!pickerOpen)} style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid var(--neutral-40)', backgroundColor: value || '#000000', cursor: 'pointer', flexShrink: 0 }} title="Open color picker" />
            {pickerOpen && (
                <>
                    <div onClick={() => setPickerOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1001 }} />
                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 1002, backgroundColor: 'var(--neutral-10)', border: '1px solid var(--neutral-50)', borderRadius: '6px', padding: '12px', width: '220px', boxShadow: '0 8px 16px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--neutral-40)', marginBottom: '10px' }}>
                            <div onClick={() => setActiveTab('palette')} style={{ padding: '4px 10px', fontSize: '11px', cursor: 'pointer', borderBottom: activeTab === 'palette' ? '2px solid var(--callToAction)' : '2px solid transparent', color: activeTab === 'palette' ? 'var(--neutral-90)' : 'var(--neutral-60)', fontWeight: activeTab === 'palette' ? 'bold' : 'normal' }}>Palette</div>
                            <div onClick={() => setActiveTab('custom')} style={{ padding: '4px 10px', fontSize: '11px', cursor: 'pointer', borderBottom: activeTab === 'custom' ? '2px solid var(--callToAction)' : '2px solid transparent', color: activeTab === 'custom' ? 'var(--neutral-90)' : 'var(--neutral-60)', fontWeight: activeTab === 'custom' ? 'bold' : 'normal' }}>Custom</div>
                        </div>
                        {activeTab === 'palette' && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {standardPalette.map(swatch => (
                                    <div key={`popover-palette-${swatch}`} onClick={() => { onChange(swatch); setPickerOpen(false); }} style={{ width: '18px', height: '18px', backgroundColor: swatch, border: '1px solid rgba(0,0,0,0.2)', borderRadius: '2px', cursor: 'pointer' }} title={swatch} />
                                ))}
                            </div>
                        )}
                        {activeTab === 'custom' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '5px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--neutral-80)' }}>Base Color:</span>
                                    <div style={{ width: '100%', maxWidth: '100px', height: '24px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--neutral-40)', position: 'relative' }}>
                                        <input type="color" value={currentHex} onChange={e => handleColorChange(e.target.value)} style={{ position: 'absolute', top: '-10px', left: '-10px', width: '150px', height: '50px', padding: 0, border: 'none', cursor: 'pointer' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--neutral-80)', width: '40px' }}>Alpha:</span>
                                    <input type="range" min="0" max="1" step="0.01" value={currentAlpha} onChange={e => handleAlphaChange(parseFloat(e.target.value))} style={{ flex: 1, cursor: 'pointer', height: '4px' }} />
                                    <span style={{ fontSize: '11px', color: 'var(--neutral-80)', width: '30px', textAlign: 'right' }}>{Math.round(currentAlpha * 100)}%</span>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// ─── Style editor modal ───────────────────────────────────────────────────────

const TEXT_NODE_PALETTE_IDS = new Set(['Note', 'Label']);

const StyleEditorModal = ({ node, onSave, onCancel }: { node: any, onSave: (style: any, labelStyle: any, textStyle: any) => void, onCancel: () => void }) => {
    const isTextNode = TEXT_NODE_PALETTE_IDS.has(node.paletteId);
    const [compBg, setCompBg] = React.useState(node.style?.backgroundColor || node.style?.fill || '');
    const [borderWidth, setBorderWidth] = React.useState(node.style?.borderWidth || '');
    const [borderStyle, setBorderStyle] = React.useState(node.style?.borderStyle || '');
    const [borderColor, setBorderColor] = React.useState(node.style?.borderColor || '');
    const [borderRadius, setBorderRadius] = React.useState(node.style?.borderRadius || '');
    const [labelBg, setLabelBg] = React.useState(node.labelStyle?.backgroundColor || '');
    const [labelColor, setLabelColor] = React.useState(node.labelStyle?.color || '');
    const [labelFontSize, setLabelFontSize] = React.useState(node.labelStyle?.fontSize || '');
    const [iconColor, setIconColor] = React.useState(node.labelStyle?.fill || '');
    const [textColor, setTextColor] = React.useState(node.textStyle?.color || '');
    const [textFontSize, setTextFontSize] = React.useState(node.textStyle?.fontSize || '');

    const handleSave = () => {
        const newStyle: any = { ...node.style };
        if (compBg) newStyle.backgroundColor = compBg; else delete newStyle.backgroundColor;
        if (borderWidth || borderStyle || borderColor) delete newStyle.border;
        if (borderWidth) newStyle.borderWidth = borderWidth; else delete newStyle.borderWidth;
        if (borderStyle) newStyle.borderStyle = borderStyle; else delete newStyle.borderStyle;
        if (borderColor) newStyle.borderColor = borderColor; else delete newStyle.borderColor;
        if (borderRadius) newStyle.borderRadius = borderRadius; else delete newStyle.borderRadius;
        const newLabelStyle: any = { ...node.labelStyle };
        if (labelBg) newLabelStyle.backgroundColor = labelBg; else delete newLabelStyle.backgroundColor;
        if (labelColor) newLabelStyle.color = labelColor; else delete newLabelStyle.color;
        if (labelFontSize) newLabelStyle.fontSize = labelFontSize; else delete newLabelStyle.fontSize;
        if (iconColor) newLabelStyle.fill = iconColor; else delete newLabelStyle.fill;
        const newTextStyle: any = { ...node.textStyle };
        if (textColor) newTextStyle.color = textColor; else delete newTextStyle.color;
        if (textFontSize) newTextStyle.fontSize = textFontSize; else delete newTextStyle.fontSize;
        onSave(newStyle, newLabelStyle, newTextStyle);
    };

    const labelRowStyle: React.CSSProperties = { marginBottom: '10px', display: 'flex', flexDirection: 'column' };
    const sectionTitleStyle: React.CSSProperties = { fontSize: '14px', fontWeight: 'bold', color: 'var(--callToAction)', borderBottom: '1px solid var(--neutral-40)', paddingBottom: '4px', marginBottom: '10px' };

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ backgroundColor: 'var(--neutral-20)', padding: '24px', borderRadius: '8px', width: '650px', border: '1px solid var(--neutral-50)', boxShadow: '0 8px 16px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '20px' }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: 0, color: 'var(--neutral-90)' }}>Edit Styles: {node.label}</h3>
                <div style={{ display: 'flex', gap: '30px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={sectionTitleStyle}>Component</div>
                        <div style={labelRowStyle}><span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Background Color</span><ColorInput value={compBg} onChange={setCompBg} placeholder="e.g. #333 or rgba()" /></div>
                        <div style={labelRowStyle}><span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Border Color</span><ColorInput value={borderColor} onChange={setBorderColor} placeholder="e.g. #ff0000" /></div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ ...labelRowStyle, flex: 1 }}><span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Border Width</span><input type="text" value={borderWidth} onChange={e => setBorderWidth(e.target.value)} placeholder="e.g. 2px" style={{...sharedInputStyle, marginTop: '4px'}} /></div>
                            <div style={{ ...labelRowStyle, flex: 1 }}><span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Border Style</span>
                                <select value={borderStyle} onChange={e => setBorderStyle(e.target.value)} style={{...sharedInputStyle, marginTop: '4px'}}>
                                    <option value="" style={{backgroundColor: 'var(--neutral-20)', color: 'var(--neutral-90)'}}>Default</option>
                                    <option value="solid" style={{backgroundColor: 'var(--neutral-20)', color: 'var(--neutral-90)'}}>Solid</option>
                                    <option value="dashed" style={{backgroundColor: 'var(--neutral-20)', color: 'var(--neutral-90)'}}>Dashed</option>
                                    <option value="dotted" style={{backgroundColor: 'var(--neutral-20)', color: 'var(--neutral-90)'}}>Dotted</option>
                                </select>
                            </div>
                        </div>
                        <div style={labelRowStyle}><span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Border Radius</span><input type="text" value={borderRadius} onChange={e => setBorderRadius(e.target.value)} placeholder="e.g. 8px" style={{...sharedInputStyle, marginTop: '4px'}} /></div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={sectionTitleStyle}>Label Tab</div>
                        <div style={labelRowStyle}><span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Background Color</span><ColorInput value={labelBg} onChange={setLabelBg} placeholder="e.g. var(--neutral-30)" /></div>
                        <div style={labelRowStyle}><span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Text Color</span><ColorInput value={labelColor} onChange={setLabelColor} placeholder="e.g. #ffffff" /></div>
                        <div style={labelRowStyle}><span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Icon / Gear Color</span><ColorInput value={iconColor} onChange={setIconColor} placeholder="e.g. var(--callToAction)" /></div>
                        <div style={labelRowStyle}><span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Text Size</span><input type="text" value={labelFontSize} onChange={e => setLabelFontSize(e.target.value)} placeholder="e.g. 14px" style={{...sharedInputStyle, marginTop: '4px'}} /></div>
                    </div>
                    {isTextNode && (
                        <div style={{ flex: 1 }}>
                            <div style={sectionTitleStyle}>Text Content</div>
                            <div style={labelRowStyle}><span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Text Color</span><ColorInput value={textColor} onChange={setTextColor} placeholder="e.g. #ffffff" /></div>
                            <div style={labelRowStyle}><span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Text Size</span><input type="text" value={textFontSize} onChange={e => setTextFontSize(e.target.value)} placeholder="e.g. 14px" style={{...sharedInputStyle, marginTop: '4px'}} /></div>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button onClick={onCancel} style={{ padding: '6px 12px', backgroundColor: 'var(--neutral-40)', border: 'none', borderRadius: '4px', color: 'var(--neutral-90)', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleSave} style={{ padding: '6px 12px', backgroundColor: 'var(--callToAction)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Save Changes</button>
                </div>
            </div>
        </div>
    );
};

// ─── Node types registration ──────────────────────────────────────────────────

const nodeTypes = { architecture: ArchitectureNode, container: ContainerNode };

// ─── Utility functions (used only by ArchitectureBuilder) ─────────────────────

const extractDeep = (obj: any): any => {
    if (obj === null || obj === undefined) return undefined;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj) || typeof obj.map === 'function') return obj.map((item: any) => extractDeep(item));
    const plain: any = {};
    for (const key in obj) plain[key] = extractDeep(obj[key]);
    return plain;
};

const mapIgnitionToReactFlowNodes = (
    ignitionNodes: any,
    handleGearClick: (id: string) => void,
    handleResizeEnd: (id: string, x: number, y: number, w: number, h: number) => void,
    handleTextChange: (id: string, text: string) => void,
    selectedId: string | null,
    globalHideHandles: boolean,
    globalHandleCount: number
) => {
    if (!ignitionNodes) return [];
    return Object.entries(ignitionNodes)
        .filter(([id, nodeData]: any) => nodeData !== null && nodeData !== undefined)
        .map(([id, nodeData]: any) => {
            const isContainer = nodeData.paletteId === 'container';
            return {
                id, type: isContainer ? 'container' : 'architecture', selected: id === selectedId,
                position: { x: nodeData.x || 0, y: nodeData.y || 0 },
                zIndex: isContainer ? (nodeData.zIndex ?? -1) : 1000,
                style: isContainer ? { width: nodeData.width || 300, height: nodeData.height || 300 } : undefined,
                data: {
                    label: nodeData.label || 'Unknown', b64Image: nodeData.b64Image || '', text: nodeData.text || '', tooltip: nodeData.tooltip || '', configs: nodeData.configs || {},
                    style: nodeData.style || {}, labelStyle: nodeData.labelStyle || {}, textStyle: nodeData.textStyle || {},
                    paletteId: nodeData.paletteId || 'unknown', inactive: nodeData.inactive || false,
                    hideHandles: nodeData.hideHandles, globalHideHandles, handleCount: globalHandleCount,
                    onGearClick: handleGearClick, onTextChange: handleTextChange,
                    onResizeEnd: isContainer ? handleResizeEnd : undefined,
                },
            };
        });
};

const isInsideContainer = (item: any, container: any): boolean => {
    const iw = item.paletteId === 'container' ? (item.width || 300) : 150;
    const ih = item.paletteId === 'container' ? (item.height || 300) : 150;
    const cw = container.width || 300, ch = container.height || 300;
    if (iw >= cw || ih >= ch) return false;
    return item.x >= container.x && item.y >= container.y && item.x + iw <= container.x + cw && item.y + ih <= container.y + ch;
};

const computeHierarchyData = (nodesDict: any, edgesDict: any) => {
    const allEntries: [string, any][] = Object.entries(nodesDict).filter(([, n]) => n) as [string, any][];
    const containerEntries = allEntries.filter(([, n]) => n.paletteId === 'container');
    const containers = containerEntries.map(([id, n]) => ({ id, ...n }));

    const connectionsByNode: Record<string, string[]> = {};
    Object.entries(edgesDict).forEach(([edgeId, edge]: any) => {
        if (!edge) return;
        [edge.source, edge.target].forEach((nodeId: string) => {
            if (!nodeId) return;
            if (!connectionsByNode[nodeId]) connectionsByNode[nodeId] = [];
            if (!connectionsByNode[nodeId].includes(edgeId)) connectionsByNode[nodeId].push(edgeId);
        });
    });
    Object.values(connectionsByNode).forEach(arr => arr.sort());

    const getChain = (item: any): any[] =>
        containers
            .filter(c => c.id !== item.id && isInsideContainer(item, c))
            .sort((a, b) => ((b.width || 300) * (b.height || 300)) - ((a.width || 300) * (a.height || 300)));

    const getDirectParent = (item: any): string | null => {
        const chain = getChain(item);
        return chain.length > 0 ? chain[chain.length - 1].id : null;
    };

    const nodeEnrichments: Record<string, { hierarchy: string[]; connections: string[] }> = {};
    allEntries.forEach(([id, n]) => {
        nodeEnrichments[id] = { hierarchy: getChain({ id, ...n }).map(c => c.id), connections: connectionsByNode[id] || [] };
    });

    const treeMap: Record<string, any> = {};
    containers.forEach(c => { treeMap[c.id] = { id: c.id, typeId: c.typeId || 'container', label: c.label || '', areas: [], nodes: [] }; });
    containers.forEach(c => { const parent = getDirectParent(c); if (parent && treeMap[parent]) treeMap[parent].areas.push(treeMap[c.id]); });
    allEntries.filter(([, n]) => n.paletteId !== 'container').forEach(([id, n]) => {
        const entry = { id, typeId: n.typeId || n.paletteId || '', label: n.label || '' };
        const parent = getDirectParent({ id, ...n });
        if (parent && treeMap[parent]) treeMap[parent].nodes.push(entry);
    });

    const rootHierarchy = {
        areas: containers.filter(c => getDirectParent(c) === null).map(c => treeMap[c.id]),
        nodes: allEntries.filter(([id, n]) => n.paletteId !== 'container' && getDirectParent({ id, ...n }) === null).map(([id, n]) => ({ id, typeId: n.typeId || n.paletteId || '', label: n.label || '' })),
    };

    return { nodeEnrichments, rootHierarchy };
};

// ─── Component ────────────────────────────────────────────────────────────────

export interface ArchitectureBuilderProps {
    enabled?: any; hideHandles?: any; handleCount?: any; defaultConnectionType?: string;
    snapEnabled?: any; snapPixels?: any; edgeWidth?: any; style?: any; connectionTypes: any; paletteItems: any[];
    nodes: any; edges: any; hierarchy?: any;
}

export const ArchitectureBuilder = observer((props: ComponentProps<ArchitectureBuilderProps>) => {
    const reactFlowWrapper = React.useRef<HTMLDivElement>(null);
    const clipboardRef = React.useRef<any>(null);
    const draggedItemRef = React.useRef<PaletteItem | null>(null);
    const hierarchyWriteRef = React.useRef<string>('');

    const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
    const [styleEditorNodeId, setStyleEditorNodeId] = React.useState<string | null>(null);
    const [contextMenu, setContextMenu] = React.useState<{ id: string, top: number, left: number, type: 'node' | 'edge' | 'pane', clientX?: number, clientY?: number, isContainer?: boolean } | null>(null);
    const [activeSubMenu, setActiveSubMenu] = React.useState<'lineType' | 'connectionType' | 'swapNode' | 'order' | null>(null);
    const [selectedId, setSelectedId] = React.useState<string | null>(null);
    const [localNodes, setLocalNodes] = React.useState<any[]>([]);
    const [localEdges, setLocalEdges] = React.useState<any[]>([]);
    const [hoveredEdgeId, setHoveredEdgeId] = React.useState<string | null>(null);

    // ─── Prop extraction ───────────────────────────────────────────────────

    const rawNodesJson = JSON.stringify(extractDeep(props.props.nodes) || {});
    const rawEdgesJson = JSON.stringify(extractDeep(props.props.edges) || {});
    const connectionTypesJson = JSON.stringify(extractDeep(props.props.connectionTypes) || {});
    const paletteItemsJson = JSON.stringify(extractDeep(props.props.paletteItems) || []);

    // Scalar display props use the same extractDeep + JSON pipeline as complex props.
    // Direct property access on Perspective's observable store can miss scalar updates;
    // running them through extractDeep forces a MobX subscription that reliably
    // triggers re-renders when any of these values change in the Designer or Session.
    const rawConfigJson = JSON.stringify({
        edgeWidth:             extractDeep(props.props.edgeWidth),
        snapEnabled:           extractDeep(props.props.snapEnabled),
        snapPixels:            extractDeep(props.props.snapPixels),
        hideHandles:           extractDeep(props.props.hideHandles),
        handleCount:           extractDeep(props.props.handleCount),
        defaultConnectionType: extractDeep(props.props.defaultConnectionType),
        enabled:               extractDeep(props.props.enabled),
    });

    const rawNodesDict = React.useMemo(() => JSON.parse(rawNodesJson), [rawNodesJson]);
    const rawEdgesDict = React.useMemo(() => JSON.parse(rawEdgesJson), [rawEdgesJson]);
    const connectionTypes = React.useMemo(() => JSON.parse(connectionTypesJson), [connectionTypesJson]);
    const paletteItems = React.useMemo(() => JSON.parse(paletteItemsJson), [paletteItemsJson]);
    const rawConfig = React.useMemo(() => JSON.parse(rawConfigJson), [rawConfigJson]);

    const globalHideHandles = rawConfig.hideHandles === true || String(rawConfig.hideHandles ?? '').toLowerCase() === 'true';
    const globalHandleCount = Number(rawConfig.handleCount) || 5;
    const globalDefaultConnectionType = rawConfig.defaultConnectionType || '';
    const isEnabled = rawConfig.enabled !== false && String(rawConfig.enabled ?? 'true').toLowerCase() !== 'false';
    const snapEnabled = rawConfig.snapEnabled !== false && String(rawConfig.snapEnabled ?? 'true').toLowerCase() !== 'false';
    const snapPixels = Number(rawConfig.snapPixels) || 15;
    const snapGrid = React.useMemo<[number, number]>(() => [snapPixels, snapPixels], [snapPixels]);
    const globalEdgeWidth = Math.max(1, Number(rawConfig.edgeWidth) || 6);

    // ─── Hierarchy sync ────────────────────────────────────────────────────

    // hierarchyWriteRef prevents infinite loops: writing enriched nodes back causes rawNodesDict
    // to re-trigger this effect, but the serialized output is identical so the write is skipped.
    React.useEffect(() => {
        if (!props.store?.props) return;
        const { nodeEnrichments, rootHierarchy } = computeHierarchyData(rawNodesDict, rawEdgesDict);
        const serialized = JSON.stringify({ rootHierarchy, nodeEnrichments });
        if (serialized === hierarchyWriteRef.current) return;
        hierarchyWriteRef.current = serialized;
        props.store.props.write('hierarchy', rootHierarchy);
        const enrichedNodes: any = {};
        Object.keys(rawNodesDict).forEach(id => {
            if (!rawNodesDict[id]) return;
            enrichedNodes[id] = { ...rawNodesDict[id], ...nodeEnrichments[id] };
        });
        props.store.props.write('nodes', enrichedNodes);
    }, [rawNodesDict, rawEdgesDict, props.store]);

    // ─── Handlers hook ─────────────────────────────────────────────────────

    const {
        isUpdatingEdge, isConnecting,
        closeContextMenu,
        getValidIntersection,
        isValidConnection,
        handleWaypointsChange,
        onConnect, onEdgeUpdate, onEdgeUpdateStart, onEdgeUpdateEnd, onConnectStart, onConnectEnd,
        onEdgesDelete, onEdgeContextMenu, onEdgeClick,
        handleLineTypeChange, handleConnectionTypeChange,
        handleGearClick, handlePaletteItemClick, handleResizeEnd, handleTextChange,
        onNodesChange, onNodeDragStart, onNodeDrag, onNodeDragStop,
        onNodesDelete, onNodeContextMenu, onNodeClick,
        executeCopy, executePaste,
        onDragOver, onDrop, onPaneClick, onPaneContextMenu,
        handleNodeSwap, handleContextMenuAction,
    } = useArchitectureFlowHandlers({
        store: props.store,
        componentEvents: props.componentEvents,
        rawNodesDict,
        rawEdgesDict,
        connectionTypes,
        globalHandleCount,
        globalDefaultConnectionType,
        paletteItems,
        snapEnabled,
        snapPixels,
        reactFlowInstance,
        reactFlowWrapper,
        isEnabled,
        selectedId,
        setSelectedId,
        setLocalNodes,
        setLocalEdges,
        contextMenu,
        setContextMenu,
        setActiveSubMenu,
        setStyleEditorNodeId,
        clipboardRef,
        draggedItemRef,
    });

    // ─── Derived flow data ─────────────────────────────────────────────────

    const flowNodes = React.useMemo(
        () => mapIgnitionToReactFlowNodes(rawNodesDict, handleGearClick, handleResizeEnd, handleTextChange, selectedId, globalHideHandles, globalHandleCount),
        [rawNodesDict, handleGearClick, handleResizeEnd, handleTextChange, selectedId, globalHideHandles, globalHandleCount]
    );
    const flowEdges = React.useMemo(
        () => mapIgnitionToReactFlowEdges(rawEdgesDict, connectionTypes, selectedId, handleWaypointsChange, snapEnabled, snapPixels, globalEdgeWidth),
        [rawEdgesDict, connectionTypes, selectedId, handleWaypointsChange, snapEnabled, snapPixels, globalEdgeWidth]
    );

    React.useEffect(() => { setLocalNodes(flowNodes); }, [flowNodes]);
    React.useEffect(() => { setLocalEdges(flowEdges); }, [flowEdges]);

    const displayEdges = React.useMemo(() => {
        const localMap = new Map(localEdges.map((e: any) => [e.id, e]));
        return flowEdges.map((fresh: any) => {
            const local = localMap.get(fresh.id);
            const isHovered = fresh.id === hoveredEdgeId;
            const isSelected = fresh.data?.isSelected === true;
            const strokeWidth = (isHovered || isSelected) ? globalEdgeWidth + 2 : globalEdgeWidth;
            const waypoints = local?.data?.waypoints ?? fresh.data?.waypoints;
            return {
                ...fresh,
                style: { ...fresh.style, strokeWidth },
                data: { ...fresh.data, waypoints },
            };
        });
    }, [localEdges, flowEdges, hoveredEdgeId, globalEdgeWidth]);

    // ─── Keyboard shortcuts ────────────────────────────────────────────────

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { closeContextMenu(); setStyleEditorNodeId(null); return; }
            if (!isEnabled) return;
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') { if (selectedId && rawNodesDict[selectedId]) executeCopy(selectedId); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                const clipboard = clipboardRef.current;
                if (clipboard && props.store?.props) {
                    const targetNode = clipboard.type === 'single' ? clipboard.node : Object.values(clipboard.nodes)[0];
                    const dropX = (targetNode as any).x + (snapEnabled ? snapPixels * 2 : 30);
                    const dropY = (targetNode as any).y + (snapEnabled ? snapPixels * 2 : 30);
                    executePaste(dropX, dropY);
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isEnabled, selectedId, rawNodesDict, snapEnabled, snapPixels, props.store, executeCopy, executePaste, closeContextMenu]);

    // ─── Context menu derived state ────────────────────────────────────────

    let availableConnections: string[] = [], currentLineType = 'smoothstep', currentConnectionType = '';
    let validSwapItems: any[] = [];

    if (contextMenu && contextMenu.type === 'edge') {
        const edge = rawEdgesDict[contextMenu.id];
        if (edge) {
            currentLineType = edge.lineType || 'smoothstep';
            currentConnectionType = edge.connectionType;
            availableConnections = getValidIntersection(edge.source, edge.target, contextMenu.id);
            if (!availableConnections.includes(currentConnectionType)) availableConnections.push(currentConnectionType);
        }
    }
    if (contextMenu && contextMenu.type === 'node') {
        const node = rawNodesDict[contextMenu.id];
        if (node) {
            const currentPaletteItem = paletteItems.find((p: any) => p.id === node.paletteId);
            if (currentPaletteItem?.swappableWith) validSwapItems = paletteItems.filter((p: any) => currentPaletteItem.swappableWith.includes(p.id));
        }
    }

    const flyoutStyle: React.CSSProperties = (reactFlowWrapper.current && contextMenu && contextMenu.left + 310 > reactFlowWrapper.current.clientWidth)
        ? { position: 'absolute', top: '-4px', right: '100%', marginRight: '4px' }
        : { position: 'absolute', top: '-4px', left: '100%', marginLeft: '4px' };

    const { classes, ...ignitionStyles } = props.props.style || {};
    const containerStyle: React.CSSProperties = { display: 'flex', width: '100%', height: '100%', backgroundColor: 'var(--neutral-00)', ...ignitionStyles };

    // ─── Render ────────────────────────────────────────────────────────────

    return (
        <div {...props.emit({ classes })} style={containerStyle} tabIndex={0}>
            <style>{`
            .arch-theme-wrapper {
                display: flex; flex-direction: row; flex: 1; width: 100%; height: 100%;
                --edge: #78D175; --panel: #78D175; --cloud: #25A4E9; --standard: #FF8C00;
                --cirrusLink: #156D97; --sepasoft: #2DA449; --ia-darkgray: #39464B;
                --ia-green: #8DC63E; --ia-gray: #445C6D; --ignition-orange: #F7901E;
                --ignition-blue: #003E69; --ignition-darkblue: #002143;
                --edge-green: #78D175; --edge-gray: #283439; --edge-dark-gray: #1E2528; --edge-light-gray: #4E5558;
            }
            .arch-node-gear { transform-origin: 50% 50%; transition: transform 0.75s ease-in-out; }
            .arch-node-gear:hover { transform: rotate(360deg); }
            .arch-node-gear:active { transform: translateX(-100%) rotate(-360deg); }
            .arch-node-svg-wrapper svg { width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: contain; }
            /* Base handle is a transparent anchor — React Flow's translate(-50%,-50%) is never overwritten */
            .arch-node-handle { background: transparent !important; border-color: transparent !important; }
            /* ::after renders the visible dot and owns all visual transitions */
            .arch-node-handle::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; border-radius: 50%; background: var(--neutral-90); border: 1px solid var(--neutral-90); pointer-events: none; transition: transform 0.15s ease-in-out, background 0.15s ease-in-out, border-color 0.15s ease-in-out; }
            /* Hover: scale ::after from its own center — base anchor is untouched */
            .arch-node-handle:hover::after { background: var(--callToAction) !important; border-color: var(--callToAction) !important; transform: translate(-50%, -50%) scale(1.5); }
            /* React Flow connection states: base stays transparent, ::after carries the color */
            .react-flow__handle.connecting { background: transparent !important; border-color: transparent !important; }
            .react-flow__handle.connecting::after { background: #3b82f6 !important; border-color: #2563eb !important; width: 14px !important; height: 14px !important; }
            .react-flow__handle.valid { background: transparent !important; border-color: transparent !important; cursor: crosshair !important; }
            .react-flow__handle.valid::after { background: #22c55e !important; border-color: #16a34a !important; width: 14px !important; height: 14px !important; }
            /* Cursors live on the base handle (the pointer-events target) */
            .arch-creating-edge .arch-node-handle { cursor: crosshair !important; }
            .arch-moving-edge .arch-node-handle { cursor: grab !important; }
            .arch-creating-edge .arch-node-handle.connecting:not(.valid):hover,
            .arch-moving-edge   .arch-node-handle.connecting:not(.valid):hover { cursor: not-allowed !important; }
            .arch-creating-edge .arch-node-handle.connecting:not(.valid):hover::after,
            .arch-moving-edge   .arch-node-handle.connecting:not(.valid):hover::after { background: #ef4444 !important; border-color: #dc2626 !important; }
            `}</style>

            <div className="arch-theme-wrapper">
                {isEnabled && <Sidebar paletteItems={paletteItems} isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onDragStartItem={(item) => { draggedItemRef.current = item; }} onItemClick={handlePaletteItemClick} />}

                <div style={{ flexGrow: 1, height: '100%', position: 'relative', overflow: 'hidden' }} ref={reactFlowWrapper} className={isConnecting ? 'arch-creating-edge' : isUpdatingEdge ? 'arch-moving-edge' : ''}>
                    <ReactFlowProvider>
                        <ReactFlow
                            nodes={localNodes} edges={displayEdges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
                            isValidConnection={isValidConnection} onInit={setReactFlowInstance}
                            onDrop={isEnabled ? onDrop : undefined} onDragOver={isEnabled ? onDragOver : undefined}
                            onConnect={isEnabled ? onConnect : undefined} onEdgeUpdate={isEnabled ? onEdgeUpdate : undefined}
                            onEdgeUpdateStart={isEnabled ? onEdgeUpdateStart : undefined}
                            onEdgeUpdateEnd={isEnabled ? onEdgeUpdateEnd : undefined}
                            onConnectStart={isEnabled ? onConnectStart : undefined}
                            onConnectEnd={isEnabled ? onConnectEnd : undefined}
                            onNodeDragStart={isEnabled ? onNodeDragStart : undefined} onNodeDrag={isEnabled ? onNodeDrag : undefined} onNodeDragStop={isEnabled ? onNodeDragStop : undefined}
                            onNodesChange={onNodesChange}
                            onNodeClick={isEnabled ? onNodeClick : undefined} onEdgeClick={isEnabled ? onEdgeClick : undefined}
                            onNodesDelete={isEnabled ? onNodesDelete : undefined} onEdgesDelete={isEnabled ? onEdgesDelete : undefined}
                            onNodeContextMenu={isEnabled ? onNodeContextMenu : undefined} onEdgeContextMenu={isEnabled ? onEdgeContextMenu : undefined}
                            onEdgeMouseEnter={(_evt, edge) => setHoveredEdgeId(edge.id)}
                            onEdgeMouseLeave={() => setHoveredEdgeId(null)}
                            onPaneClick={onPaneClick} onPaneContextMenu={isEnabled ? onPaneContextMenu : undefined}
                            nodesDraggable={isEnabled} nodesConnectable={isEnabled} elementsSelectable={isEnabled}
                            connectionMode={ConnectionMode.Loose} snapToGrid={snapEnabled} snapGrid={snapGrid}
                            connectionLineStyle={{ stroke: '#cccccc', strokeWidth: 6 }}
                            elevateNodesOnSelect={false}
                            minZoom={0.05}
                        >
                            <Background gap={snapPixels} />
                            <Controls />
                        </ReactFlow>
                    </ReactFlowProvider>

                    {styleEditorNodeId && rawNodesDict[styleEditorNodeId] && (
                        <StyleEditorModal
                            node={rawNodesDict[styleEditorNodeId]}
                            onSave={(newStyle, newLabelStyle, newTextStyle) => {
                                if (props.store?.props) {
                                    const nextNodes = { ...rawNodesDict };
                                    nextNodes[styleEditorNodeId].style = newStyle;
                                    nextNodes[styleEditorNodeId].labelStyle = newLabelStyle;
                                    nextNodes[styleEditorNodeId].textStyle = newTextStyle;
                                    props.store.props.write('nodes', nextNodes);
                                }
                                setStyleEditorNodeId(null);
                            }}
                            onCancel={() => setStyleEditorNodeId(null)}
                        />
                    )}

                    {contextMenu && (
                        <div style={{ position: 'absolute', top: contextMenu.top, left: contextMenu.left, zIndex: 10, backgroundColor: 'var(--neutral-20)', border: '1px solid var(--neutral-50)', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', padding: '4px', minWidth: '140px', fontSize: '12px' }}>

                            {contextMenu.type === 'pane' && (
                                <div style={{ padding: '5px 8px', cursor: clipboardRef.current ? 'pointer' : 'not-allowed', color: clipboardRef.current ? 'var(--neutral-90)' : 'var(--neutral-50)' }} onClick={() => { if (clipboardRef.current) handleContextMenuAction('paste'); }}>
                                    📋 Paste
                                </div>
                            )}

                            {contextMenu.type !== 'pane' && (
                                <>
                                    <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('config')}>⚙️ Config</div>

                                    {contextMenu.type === 'node' && (
                                        <>
                                            <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--callToAction)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('editStyle')}>🎨 Edit Style</div>
                                            {!contextMenu.isContainer && (
                                                <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', gap: '12px' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('toggleGrayscale')}>
                                                    <span>⬜ Toggle Inactive</span><span>{rawNodesDict[contextMenu.id]?.inactive ? '✓' : ''}</span>
                                                </div>
                                            )}
                                            <div style={{ borderTop: '1px solid var(--neutral-40)', margin: '4px 0' }} />
                                            <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('copy')}>📋 Copy</div>
                                            {contextMenu.isContainer && (
                                                <>
                                                    <div style={{ padding: '5px 8px', cursor: clipboardRef.current ? 'pointer' : 'not-allowed', color: clipboardRef.current ? 'var(--neutral-90)' : 'var(--neutral-50)' }} onClick={() => { if (clipboardRef.current) handleContextMenuAction('paste'); }}>📋 Paste</div>
                                                    <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', borderTop: '1px solid var(--neutral-40)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('toggleLink')}>
                                                        {rawNodesDict[contextMenu.id]?.configs?.unlinked ? '🔗 Link Contents' : '🔓 Unlink Contents'}
                                                    </div>
                                                    <div style={{ position: 'relative' }} onMouseEnter={() => setActiveSubMenu('order')}>
                                                        <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', backgroundColor: activeSubMenu === 'order' ? 'var(--neutral-30)' : 'transparent' }}>
                                                            <span>📑 Order</span><span>▶</span>
                                                        </div>
                                                        {activeSubMenu === 'order' && (
                                                            <div style={{ ...flyoutStyle, backgroundColor: 'var(--neutral-20)', border: '1px solid var(--neutral-50)', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', padding: '4px', minWidth: '150px' }}>
                                                                <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onClick={() => handleContextMenuAction('bringToFront')}>⏫ Bring to Front</div>
                                                                <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onClick={() => handleContextMenuAction('bringForward')}>🔼 Bring Forward</div>
                                                                <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onClick={() => handleContextMenuAction('sendBackward')}>🔽 Send Backward</div>
                                                                <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onClick={() => handleContextMenuAction('sendToBack')}>⏬ Send to Back</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                            {validSwapItems.length > 0 && (
                                                <div style={{ position: 'relative' }} onMouseEnter={() => setActiveSubMenu('swapNode')}>
                                                    <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', backgroundColor: activeSubMenu === 'swapNode' ? 'var(--neutral-30)' : 'transparent' }}>
                                                        <span>🔄 Swap Node</span><span>▶</span>
                                                    </div>
                                                    {activeSubMenu === 'swapNode' && (
                                                        <div style={{ ...flyoutStyle, backgroundColor: 'var(--neutral-20)', border: '1px solid var(--neutral-50)', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', padding: '4px', minWidth: '150px' }}>
                                                            {validSwapItems.map(targetItem => (
                                                                <div key={targetItem.id} style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', alignItems: 'center' }} onClick={() => handleNodeSwap(targetItem.id)}>
                                                                    <div style={{ width: '16px', height: '16px', marginRight: '6px', display: 'flex', alignItems: 'center' }}>{targetItem.b64Image && <img src={targetItem.b64Image.startsWith('data:') ? targetItem.b64Image : `data:image/svg+xml,${encodeURIComponent(targetItem.b64Image)}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}</div>
                                                                    <span>{targetItem.label}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {contextMenu.type === 'edge' && (
                                        <>
                                            <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('reverseEdge')}>🔄 Reverse Direction</div>
                                            <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('toggleArrow')}>
                                                {rawEdgesDict[contextMenu.id]?.arrow !== false ? '❌ Remove Arrow' : '➡️ Add Arrow'}
                                            </div>
                                            <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('toggleLabel')}>
                                                {rawEdgesDict[contextMenu.id]?.showLabel === true ? '👁️ Hide Label' : '👁️ Show Label'}
                                            </div>
                                            <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('toggleDashed')}>
                                                {rawEdgesDict[contextMenu.id]?.dashed ? '─── Solid Line' : '- - - Dashed Line'}
                                            </div>
                                            {(() => {
                                                const e = rawEdgesDict[contextMenu.id];
                                                const lt = e?.lineType;
                                                const canClear = (!lt || lt === 'smoothstep' || lt === 'step') && e?.waypoints?.length > 0;
                                                return canClear ? (
                                                    <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('clearWaypoints')}>
                                                        ⊙ Clear Path ({e.waypoints.length} pt{e.waypoints.length !== 1 ? 's' : ''})
                                                    </div>
                                                ) : null;
                                            })()}
                                            <div style={{ borderTop: '1px solid var(--neutral-40)', margin: '4px 0' }} />
                                            <div style={{ position: 'relative' }} onMouseEnter={() => setActiveSubMenu('lineType')}>
                                                <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', backgroundColor: activeSubMenu === 'lineType' ? 'var(--neutral-30)' : 'transparent' }}>
                                                    <span>〰️ Line Type</span><span>▶</span>
                                                </div>
                                                {activeSubMenu === 'lineType' && (
                                                    <div style={{ ...flyoutStyle, backgroundColor: 'var(--neutral-20)', border: '1px solid var(--neutral-50)', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', padding: '4px', minWidth: '120px' }}>
                                                        <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', gap: '12px' }} onClick={() => handleLineTypeChange('smoothstep')}><span>〰️ Smooth</span><span>{currentLineType === 'smoothstep' ? '✓' : ''}</span></div>
                                                        <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', gap: '12px' }} onClick={() => handleLineTypeChange('step')}><span>🔲 Stepped</span><span>{currentLineType === 'step' ? '✓' : ''}</span></div>
                                                        <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', gap: '12px' }} onClick={() => handleLineTypeChange('straight')}><span>📏 Straight</span><span>{currentLineType === 'straight' ? '✓' : ''}</span></div>
                                                        <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', gap: '12px' }} onClick={() => handleLineTypeChange('default')}><span>➰ Bezier</span><span>{currentLineType === 'default' ? '✓' : ''}</span></div>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ position: 'relative' }} onMouseEnter={() => setActiveSubMenu('connectionType')}>
                                                <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', backgroundColor: activeSubMenu === 'connectionType' ? 'var(--neutral-30)' : 'transparent' }}>
                                                    <span>🔗 Connection</span><span>▶</span>
                                                </div>
                                                {activeSubMenu === 'connectionType' && (
                                                    <div style={{ ...flyoutStyle, backgroundColor: 'var(--neutral-20)', border: '1px solid var(--neutral-50)', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', padding: '4px', minWidth: '140px' }}>
                                                        {availableConnections.length === 0
                                                            ? <div style={{ padding: '5px 8px', color: 'var(--neutral-60)' }}>No valid connections</div>
                                                            : availableConnections.map(c => (
                                                                <div key={c} style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', whiteSpace: 'nowrap', gap: '12px' }} onClick={() => handleConnectionTypeChange(c)}>
                                                                    <span><span style={{ color: connectionTypes[c]?.color || 'var(--neutral-90)', marginRight: '4px' }}>●</span>{connectionTypes[c]?.label || c}</span>
                                                                    <span>{currentConnectionType === c ? '✓' : ''}</span>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {contextMenu.isContainer && (
                                        <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--error)', borderTop: '1px solid var(--neutral-40)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('deleteWithContents')}>🗑️ Delete Area & Contents</div>
                                    )}
                                    <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--error)', borderTop: contextMenu.isContainer ? 'none' : '1px solid var(--neutral-40)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('delete')}>
                                        {contextMenu.isContainer ? '🗑️ Delete Area Only' : '🗑️ Delete'}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
