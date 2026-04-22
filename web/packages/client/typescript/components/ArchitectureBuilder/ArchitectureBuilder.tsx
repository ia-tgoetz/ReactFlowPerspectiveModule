import * as React from 'react';
import { ComponentProps } from '@inductiveautomation/perspective-client';
import { observer } from 'mobx-react';
// @ts-ignore
import ReactFlow, { ReactFlowProvider, Background, Controls, ConnectionMode, Edge, Connection, applyNodeChanges, NodeChange, MarkerType, BaseEdge, getSmoothStepPath, getBezierPath, getStraightPath, EdgeLabelRenderer } from 'reactflow';
import 'reactflow/dist/style.css';
import { Sidebar, PaletteItem } from './Sidebar';
import { ArchitectureNode } from './ArchitectureNode';
import { ContainerNode } from './ContainerNode';

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
        else if (value.length === 9) {
            currentHex = value.substring(0, 7);
            currentAlpha = Math.round((parseInt(value.substring(7, 9), 16) / 255) * 100) / 100;
        } else if (value.length === 4) {
            currentHex = '#' + value[1]+value[1] + value[2]+value[2] + value[3]+value[3];
        }
    } else if (value.startsWith('rgba')) {
        const parts = value.match(/[\d.]+/g);
        if (parts && parts.length >= 4) {
            const r = parseInt(parts[0], 10);
            const g = parseInt(parts[1], 10);
            const b = parseInt(parts[2], 10);
            currentAlpha = parseFloat(parts[3]);
            currentHex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
    } else if (value.startsWith('rgb')) {
         const parts = value.match(/[\d.]+/g);
         if (parts && parts.length >= 3) {
            const r = parseInt(parts[0], 10);
            const g = parseInt(parts[1], 10);
            const b = parseInt(parts[2], 10);
            currentHex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
         }
    }

    const handleColorChange = (newHex: string) => {
        const r = parseInt(newHex.slice(1, 3), 16);
        const g = parseInt(newHex.slice(3, 5), 16);
        const b = parseInt(newHex.slice(5, 7), 16);
        if (currentAlpha < 1) {
            onChange(`rgba(${r}, ${g}, ${b}, ${currentAlpha})`);
        } else {
            onChange(newHex);
        }
    };

    const handleAlphaChange = (newAlpha: number) => {
        const r = parseInt(currentHex.slice(1, 3), 16);
        const g = parseInt(currentHex.slice(3, 5), 16);
        const b = parseInt(currentHex.slice(5, 7), 16);
        if (newAlpha === 1) {
            onChange(currentHex); 
        } else {
            onChange(`rgba(${r}, ${g}, ${b}, ${newAlpha})`);
        }
    };

    return (
        <div style={{ position: 'relative', display: 'flex', gap: '6px', marginTop: '4px' }}>
            <input 
                type="text" 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                placeholder={placeholder} 
                style={{ ...sharedInputStyle, marginTop: 0, flex: 1 }} 
            />
            <div 
                onClick={() => setPickerOpen(!pickerOpen)}
                style={{ 
                    width: '28px', height: '28px', borderRadius: '4px', border: '1px solid var(--neutral-40)', 
                    backgroundColor: value || '#000000', cursor: 'pointer', flexShrink: 0 
                }}
                title="Open color picker"
            />

            {pickerOpen && (
                <>
                    <div onClick={() => setPickerOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1001 }} />
                    <div style={{ 
                        position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 1002, 
                        backgroundColor: 'var(--neutral-10)', border: '1px solid var(--neutral-50)', 
                        borderRadius: '6px', padding: '12px', width: '220px', boxShadow: '0 8px 16px rgba(0,0,0,0.5)' 
                    }}>
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--neutral-40)', marginBottom: '10px' }}>
                            <div 
                                onClick={() => setActiveTab('palette')} 
                                style={{ padding: '4px 10px', fontSize: '11px', cursor: 'pointer', borderBottom: activeTab === 'palette' ? '2px solid var(--callToAction)' : '2px solid transparent', color: activeTab === 'palette' ? 'var(--neutral-90)' : 'var(--neutral-60)', fontWeight: activeTab === 'palette' ? 'bold' : 'normal' }}
                            >Palette</div>
                            <div 
                                onClick={() => setActiveTab('custom')} 
                                style={{ padding: '4px 10px', fontSize: '11px', cursor: 'pointer', borderBottom: activeTab === 'custom' ? '2px solid var(--callToAction)' : '2px solid transparent', color: activeTab === 'custom' ? 'var(--neutral-90)' : 'var(--neutral-60)', fontWeight: activeTab === 'custom' ? 'bold' : 'normal' }}
                            >Custom</div>
                        </div>

                        {activeTab === 'palette' && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {standardPalette.map(swatch => (
                                    <div
                                        key={`popover-palette-${swatch}`}
                                        onClick={() => { onChange(swatch); setPickerOpen(false); }}
                                        style={{ width: '18px', height: '18px', backgroundColor: swatch, border: '1px solid rgba(0,0,0,0.2)', borderRadius: '2px', cursor: 'pointer' }}
                                        title={swatch}
                                    />
                                ))}
                            </div>
                        )}
                        
                        {activeTab === 'custom' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '5px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--neutral-80)' }}>Base Color:</span>
                                    <div style={{ width: '100%', maxWidth: '100px', height: '24px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--neutral-40)', position: 'relative' }}>
                                        <input 
                                            type="color" 
                                            value={currentHex} 
                                            onChange={e => handleColorChange(e.target.value)} 
                                            style={{ position: 'absolute', top: '-10px', left: '-10px', width: '150px', height: '50px', padding: 0, border: 'none', cursor: 'pointer' }} 
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--neutral-80)', width: '40px' }}>Alpha:</span>
                                    <input 
                                        type="range" 
                                        min="0" max="1" step="0.01" 
                                        value={currentAlpha} 
                                        onChange={e => handleAlphaChange(parseFloat(e.target.value))} 
                                        style={{ flex: 1, cursor: 'pointer', height: '4px' }} 
                                    />
                                    <span style={{ fontSize: '11px', color: 'var(--neutral-80)', width: '30px', textAlign: 'right' }}>
                                        {Math.round(currentAlpha * 100)}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const StyleEditorModal = ({ node, onSave, onCancel }: { node: any, onSave: (style: any, labelStyle: any) => void, onCancel: () => void }) => {
    const [compBg, setCompBg] = React.useState(node.style?.backgroundColor || node.style?.fill || '');
    const [borderWidth, setBorderWidth] = React.useState(node.style?.borderWidth || '');
    const [borderStyle, setBorderStyle] = React.useState(node.style?.borderStyle || '');
    const [borderColor, setBorderColor] = React.useState(node.style?.borderColor || '');
    const [borderRadius, setBorderRadius] = React.useState(node.style?.borderRadius || '');
    
    const [labelBg, setLabelBg] = React.useState(node.labelStyle?.backgroundColor || '');
    const [labelColor, setLabelColor] = React.useState(node.labelStyle?.color || '');
    const [labelFontSize, setLabelFontSize] = React.useState(node.labelStyle?.fontSize || '');
    const [iconColor, setIconColor] = React.useState(node.labelStyle?.fill || '');

    const handleSave = () => {
        const newStyle: any = { ...node.style };
        if (compBg) newStyle.backgroundColor = compBg; else delete newStyle.backgroundColor;
        
        if (borderWidth || borderStyle || borderColor) {
            delete newStyle.border; 
        }

        if (borderWidth) newStyle.borderWidth = borderWidth; else delete newStyle.borderWidth;
        if (borderStyle) newStyle.borderStyle = borderStyle; else delete newStyle.borderStyle;
        if (borderColor) newStyle.borderColor = borderColor; else delete newStyle.borderColor;
        if (borderRadius) newStyle.borderRadius = borderRadius; else delete newStyle.borderRadius;
        
        const newLabelStyle: any = { ...node.labelStyle };
        if (labelBg) newLabelStyle.backgroundColor = labelBg; else delete newLabelStyle.backgroundColor;
        if (labelColor) newLabelStyle.color = labelColor; else delete newLabelStyle.color;
        if (labelFontSize) newLabelStyle.fontSize = labelFontSize; else delete newLabelStyle.fontSize;
        if (iconColor) newLabelStyle.fill = iconColor; else delete newLabelStyle.fill;

        onSave(newStyle, newLabelStyle);
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
                        <div style={labelRowStyle}>
                            <span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Background Color</span>
                            <ColorInput value={compBg} onChange={setCompBg} placeholder="e.g. #333 or rgba()" />
                        </div>
                        <div style={labelRowStyle}>
                            <span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Border Color</span>
                            <ColorInput value={borderColor} onChange={setBorderColor} placeholder="e.g. #ff0000" />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ ...labelRowStyle, flex: 1 }}>
                                <span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Border Width</span>
                                <input type="text" value={borderWidth} onChange={e => setBorderWidth(e.target.value)} placeholder="e.g. 2px" style={{...sharedInputStyle, marginTop: '4px'}} />
                            </div>
                            <div style={{ ...labelRowStyle, flex: 1 }}>
                                <span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Border Style</span>
                                <select value={borderStyle} onChange={e => setBorderStyle(e.target.value)} style={{...sharedInputStyle, marginTop: '4px'}}>
                                    <option value="" style={{backgroundColor: 'var(--neutral-20)', color: 'var(--neutral-90)'}}>Default</option>
                                    <option value="solid" style={{backgroundColor: 'var(--neutral-20)', color: 'var(--neutral-90)'}}>Solid</option>
                                    <option value="dashed" style={{backgroundColor: 'var(--neutral-20)', color: 'var(--neutral-90)'}}>Dashed</option>
                                    <option value="dotted" style={{backgroundColor: 'var(--neutral-20)', color: 'var(--neutral-90)'}}>Dotted</option>
                                </select>
                            </div>
                        </div>
                        <div style={labelRowStyle}>
                            <span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Border Radius</span>
                            <input type="text" value={borderRadius} onChange={e => setBorderRadius(e.target.value)} placeholder="e.g. 8px" style={{...sharedInputStyle, marginTop: '4px'}} />
                        </div>
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={sectionTitleStyle}>Label Tab</div>
                        <div style={labelRowStyle}>
                            <span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Background Color</span>
                            <ColorInput value={labelBg} onChange={setLabelBg} placeholder="e.g. var(--neutral-30)" />
                        </div>
                        <div style={labelRowStyle}>
                            <span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Text Color</span>
                            <ColorInput value={labelColor} onChange={setLabelColor} placeholder="e.g. #ffffff" />
                        </div>
                        <div style={labelRowStyle}>
                            <span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Icon / Gear Color</span>
                            <ColorInput value={iconColor} onChange={setIconColor} placeholder="e.g. var(--callToAction)" />
                        </div>
                        <div style={labelRowStyle}>
                            <span style={{ fontSize: '12px', color: 'var(--neutral-80)' }}>Text Size</span>
                            <input type="text" value={labelFontSize} onChange={e => setLabelFontSize(e.target.value)} placeholder="e.g. 14px" style={{...sharedInputStyle, marginTop: '4px'}} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button onClick={onCancel} style={{ padding: '6px 12px', backgroundColor: 'var(--neutral-40)', border: 'none', borderRadius: '4px', color: 'var(--neutral-90)', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleSave} style={{ padding: '6px 12px', backgroundColor: 'var(--callToAction)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const CustomEdge = ({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, style, label }: any) => {
    const offsetX = Number(data?.offsetX) || 0;
    const offsetY = Number(data?.offsetY) || 0;
    const showLabel = data?.showLabel === true;

    let edgePath = ''; let labelX = 0; let labelY = 0;

    if (data?.lineType === 'step' || data?.lineType === 'smoothstep' || !data?.lineType) {
        const defaultCenterX = (sourceX + targetX) / 2;
        const defaultCenterY = (sourceY + targetY) / 2;
        [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: data?.lineType === 'step' ? 0 : 15, centerX: defaultCenterX + offsetX, centerY: defaultCenterY + offsetY });
    } else if (data?.lineType === 'straight') {
        [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
    } else if (data?.lineType === 'default') { 
        [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
    }

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={{...style, fill: 'none'}} />
            {label && showLabel && (
                <EdgeLabelRenderer>
                    <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, backgroundColor: 'var(--neutral-10)', padding: '2px 8px', borderRadius: '4px', border: `1px solid var(--neutral-40)`, fontSize: '12px', fontWeight: 'bold', color: style?.stroke || 'var(--neutral-90)', pointerEvents: 'none' }} className="nodrag nopan">
                        {label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
};

const nodeTypes = { architecture: ArchitectureNode, container: ContainerNode }; 
const edgeTypes = { custom: CustomEdge };

const generateShortId = () => 'I' + Math.random().toString(16).substring(2, 10);
const extractDeep = (obj: any): any => { if (obj === null || obj === undefined) return undefined; if (typeof obj !== 'object') return obj; if (Array.isArray(obj) || typeof obj.map === 'function') { return obj.map((item: any) => extractDeep(item)); } const plain: any = {}; for (const key in obj) plain[key] = extractDeep(obj[key]); return plain; };

const mapIgnitionToReactFlowNodes = (ignitionNodes: any, handleGearClick: (id: string) => void, handleResizeEnd: (id: string, x: number, y: number, w: number, h: number) => void, handleTextChange: (id: string, text: string) => void, selectedId: string | null, globalHideHandles: boolean, globalHandleCount: number) => {
    if (!ignitionNodes) return [];
    return Object.entries(ignitionNodes).filter(([id, nodeData]: any) => nodeData !== null && nodeData !== undefined).map(([id, nodeData]: any) => {
        const isContainer = nodeData.paletteId === 'container';
        return {
            id, type: isContainer ? 'container' : 'architecture', selected: id === selectedId,
            position: { x: nodeData.x || 0, y: nodeData.y || 0 },
            zIndex: isContainer ? (nodeData.zIndex ?? -1) : 1000,
            style: isContainer ? { width: nodeData.width || 300, height: nodeData.height || 300 } : undefined,
            data: {
                label: nodeData.label || 'Unknown', svg: nodeData.svg || '', text: nodeData.text || '', tooltip: nodeData.tooltip || '', configs: nodeData.configs || {},
                style: nodeData.style || {},
                labelStyle: nodeData.labelStyle || {},
                paletteId: nodeData.paletteId || 'unknown',
                inactive: nodeData.inactive || false,
                hideHandles: nodeData.hideHandles,
                globalHideHandles: globalHideHandles,
                handleCount: globalHandleCount,
                onGearClick: handleGearClick,
                onTextChange: handleTextChange,
                onResizeEnd: isContainer ? handleResizeEnd : undefined
            }
        };
    });
};

const mapIgnitionToReactFlowEdges = (ignitionEdges: any, connectionTypes: any, selectedId: string | null) => {
    if (!ignitionEdges) return [];
    return Object.entries(ignitionEdges).filter(([id, edgeData]: any) => edgeData !== null && edgeData !== undefined).map(([id, edgeData]: any) => { 
        const typeConfig = connectionTypes[edgeData.connectionType] || {}; 
        const isSelected = id === selectedId; 
        
        const strokeStyle: any = { stroke: typeConfig.color || '#888', strokeWidth: isSelected ? 6 : 4 }; 
        
        if (edgeData.dashed) strokeStyle.strokeDasharray = '8 5'; 
        
        const arrowMarker = edgeData.arrow !== false ? { type: MarkerType.ArrowClosed, width: 10, height: 10, color: strokeStyle.stroke } : undefined; 
        
        return { id, ...edgeData, type: 'custom', data: { lineType: edgeData.lineType || 'smoothstep', offsetX: edgeData.offsetX || 0, offsetY: edgeData.offsetY || 0, showLabel: edgeData.showLabel === true }, label: typeConfig.label || edgeData.connectionType || '', style: strokeStyle, markerEnd: arrowMarker, interactionWidth: 20, updatable: true }; 
    });
};

const getNodesInside = (containerId: string, allNodes: any): string[] => {
    const container = allNodes[containerId];
    if (!container) return [];
    
    const cWidth = container.width || 300;
    const cHeight = container.height || 300;
    const cx1 = container.x;
    const cy1 = container.y;
    const cx2 = cx1 + cWidth;
    const cy2 = cy1 + cHeight;

    let inside: string[] = [];
    Object.keys(allNodes).forEach(id => {
        if (id === containerId) return;
        const node = allNodes[id];
        if (!node) return;
        
        const nw = node.paletteId === 'container' ? (node.width || 300) : 150;
        const nh = node.paletteId === 'container' ? (node.height || 300) : 150;
        
        const nx1 = node.x;
        const ny1 = node.y;
        const nx2 = nx1 + nw;
        const ny2 = ny1 + nh;
        
        if (nw >= cWidth || nh >= cHeight) return; 
        
        if (nx1 >= cx1 && ny1 >= cy1 && nx2 <= cx2 && ny2 <= cy2) {
            inside.push(id);
        }
    });
    return inside;
};

export interface ArchitectureBuilderProps { enabled?: any; hideHandles?: any; handleCount?: any; defaultConnectionType?: string; snapEnabled?: any; snapPixels?: any; style?: any; connectionTypes: any; paletteItems: any[]; nodes: any; edges: any; }

export const ArchitectureBuilder = observer((props: ComponentProps<ArchitectureBuilderProps>) => {
  const reactFlowWrapper = React.useRef<HTMLDivElement>(null);
  const clipboardRef = React.useRef<any>(null);
  const updatingEdgeRef = React.useRef<string | null>(null); 
  const dragStartPos = React.useRef<any>(null); 
  
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [styleEditorNodeId, setStyleEditorNodeId] = React.useState<string | null>(null);
  const [contextMenu, setContextMenu] = React.useState<{ id: string, top: number, left: number, type: 'node' | 'edge' | 'pane', clientX?: number, clientY?: number, isContainer?: boolean } | null>(null);
  const [activeSubMenu, setActiveSubMenu] = React.useState<'lineType' | 'connectionType' | 'swapNode' | 'order' | null>(null); 
  
  const draggedItemRef = React.useRef<PaletteItem | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [localNodes, setLocalNodes] = React.useState<any[]>([]);

  const rawNodesJson = JSON.stringify(extractDeep(props.props.nodes) || {});
  const rawEdgesJson = JSON.stringify(extractDeep(props.props.edges) || {});
  const connectionTypesJson = JSON.stringify(extractDeep(props.props.connectionTypes) || {});
  const paletteItemsJson = JSON.stringify(extractDeep(props.props.paletteItems) || []);

  const rawNodesDict = React.useMemo(() => JSON.parse(rawNodesJson), [rawNodesJson]);
  const rawEdgesDict = React.useMemo(() => JSON.parse(rawEdgesJson), [rawEdgesJson]);
  const connectionTypes = React.useMemo(() => JSON.parse(connectionTypesJson), [connectionTypesJson]);
  const paletteItems = React.useMemo(() => JSON.parse(paletteItemsJson), [paletteItemsJson]);
  
  const globalHideHandles = props.props.hideHandles === true || String(props.props.hideHandles).toLowerCase() === 'true';
  const globalHandleCount = Number(props.props.handleCount) || 5; 
  const globalDefaultConnectionType = props.props.defaultConnectionType || '';
  
  const isEnabled = props.props.enabled !== false && String(props.props.enabled).toLowerCase() !== 'false';

  const snapEnabled = props.props.snapEnabled !== false && String(props.props.snapEnabled).toLowerCase() !== 'false';
  const snapPixels = Number(props.props.snapPixels) || 15;
  const snapGrid = React.useMemo<[number, number]>(() => [snapPixels, snapPixels], [snapPixels]);

  const closeContextMenu = React.useCallback(() => { setContextMenu(null); setActiveSubMenu(null); }, []);

  const executeCopy = React.useCallback((id: string) => {
      const isContainer = rawNodesDict[id]?.paletteId === 'container';
      if (isContainer) {
          const insideIds = getNodesInside(id, rawNodesDict);
          const copiedNodes: any = { [id]: rawNodesDict[id] };
          insideIds.forEach(childId => { copiedNodes[childId] = rawNodesDict[childId]; });
          
          const copiedEdges: any = {};
          Object.keys(rawEdgesDict).forEach(edgeId => {
              const edge = rawEdgesDict[edgeId];
              if (copiedNodes[edge.source] && copiedNodes[edge.target]) { copiedEdges[edgeId] = edge; }
          });
          clipboardRef.current = { type: 'group', nodes: copiedNodes, edges: copiedEdges };
      } else {
          clipboardRef.current = { type: 'single', node: rawNodesDict[id] };
      }
  }, [rawNodesDict, rawEdgesDict]);

  const executePaste = React.useCallback((dropX: number, dropY: number) => {
      const clipboard = clipboardRef.current;
      if (!clipboard || !props.store?.props) return;

      const nextNodes = { ...rawNodesDict };
      const nextEdges = { ...rawEdgesDict };

      if (clipboard.type === 'single') {
          const newNodeId = generateShortId();
          nextNodes[newNodeId] = JSON.parse(JSON.stringify({ ...clipboard.node, x: dropX, y: dropY }));
          setSelectedId(newNodeId);
          clipboardRef.current = { type: 'single', node: nextNodes[newNodeId] }; 
      } else if (clipboard.type === 'group') {
          let minX = Infinity; let minY = Infinity;
          Object.values(clipboard.nodes).forEach((n: any) => {
              if (n.x < minX) minX = n.x;
              if (n.y < minY) minY = n.y;
          });
          
          const dx = dropX - minX;
          const dy = dropY - minY;
          
          const idMap: any = {}; 
          const newGroupNodes: any = {}; 
          
          Object.keys(clipboard.nodes).forEach(oldId => {
              const newId = generateShortId();
              idMap[oldId] = newId;
              const oldNode = clipboard.nodes[oldId];
              const newNode = JSON.parse(JSON.stringify({ ...oldNode, x: oldNode.x + dx, y: oldNode.y + dy }));
              nextNodes[newId] = newNode;
              newGroupNodes[oldId] = newNode; 
          });
          
          const newGroupEdges: any = {};
          Object.keys(clipboard.edges).forEach(oldEdgeId => {
              const newEdgeId = generateShortId();
              const oldEdge = clipboard.edges[oldEdgeId];
              const newEdge = JSON.parse(JSON.stringify({ ...oldEdge, source: idMap[oldEdge.source], target: idMap[oldEdge.target] }));
              nextEdges[newEdgeId] = newEdge;
              newGroupEdges[oldEdgeId] = newEdge;
          });
          
          clipboardRef.current = { type: 'group', nodes: newGroupNodes, edges: newGroupEdges };
      }
      
      props.store.props.write('nodes', nextNodes);
      props.store.props.write('edges', nextEdges);
  }, [rawNodesDict, rawEdgesDict, props.store]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            closeContextMenu();
            setStyleEditorNodeId(null);
            return;
        }

        if (!isEnabled) return;
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            if (selectedId && rawNodesDict[selectedId]) executeCopy(selectedId);
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            const clipboard = clipboardRef.current;
            if (clipboard && props.store?.props) {
                const targetNode = clipboard.type === 'single' ? clipboard.node : Object.values(clipboard.nodes)[0];
                let dropX = (targetNode as any).x + (snapEnabled ? snapPixels * 2 : 30);
                let dropY = (targetNode as any).y + (snapEnabled ? snapPixels * 2 : 30);
                executePaste(dropX, dropY);
            }
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, selectedId, rawNodesDict, snapEnabled, snapPixels, props.store, executeCopy, executePaste, closeContextMenu]);

  const handleGearClick = React.useCallback((id: string) => {
      setSelectedId(id); 
      const node = rawNodesDict[id];
      if (props.componentEvents && node) {
          props.componentEvents.fireComponentEvent('onGearClick', { id, paletteId: node.paletteId, type: 'node', action: 'config' });
      }
  }, [props.componentEvents, rawNodesDict]);

  const handleResizeEnd = React.useCallback((id: string, x: number, y: number, width: number, height: number) => {
      if (props.store?.props) { 
          const nextNodes = { ...rawNodesDict }; 
          if (nextNodes[id]) { 
              nextNodes[id].x = Math.round(x);
              nextNodes[id].y = Math.round(y);
              nextNodes[id].width = Math.round(width); 
              nextNodes[id].height = Math.round(height); 
              props.store.props.write('nodes', nextNodes); 
          } 
      }
  }, [props.store, rawNodesDict]);

  const handleTextChange = React.useCallback((id: string, text: string) => {
      if (props.store?.props) {
          const nextNodes = { ...rawNodesDict };
          if (nextNodes[id]) {
              nextNodes[id] = { ...nextNodes[id], text };
              props.store.props.write('nodes', nextNodes);
          }
      }
  }, [props.store, rawNodesDict]);

  const flowNodes = React.useMemo(() => mapIgnitionToReactFlowNodes(rawNodesDict, handleGearClick, handleResizeEnd, handleTextChange, selectedId, globalHideHandles, globalHandleCount), [rawNodesDict, handleGearClick, handleResizeEnd, handleTextChange, selectedId, globalHideHandles, globalHandleCount]);
  const flowEdges = React.useMemo(() => mapIgnitionToReactFlowEdges(rawEdgesDict, connectionTypes, selectedId), [rawEdgesDict, connectionTypes, selectedId]);

  React.useEffect(() => { setLocalNodes(flowNodes); }, [flowNodes]);

  const onNodesChange = React.useCallback((changes: NodeChange[]) => {
      setLocalNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const getValidIntersection = React.useCallback((sourceId: string, targetId: string, ignoreEdgeId?: string) => {
      const sourceNode = rawNodesDict[sourceId];
      const targetNode = rawNodesDict[targetId];
      if (!sourceNode || !targetNode || !sourceNode.supportedConnections || !targetNode.supportedConnections) return [];

      let intersection = sourceNode.supportedConnections.filter((c: string) => targetNode.supportedConnections.includes(c));
      intersection = intersection.filter((connType: string) => {
          const typeDef = connectionTypes[connType];
          const isMultipleFalse = typeDef && (typeDef.multiple === false || String(typeDef.multiple).toLowerCase() === 'false');
          if (isMultipleFalse) {
              const edgeExists = Object.entries(rawEdgesDict).some(([id, e]: any) => {
                  if (ignoreEdgeId && id === ignoreEdgeId) return false; 
                  return ((e.source === sourceId && e.target === targetId && e.connectionType === connType) || (e.source === targetId && e.target === sourceId && e.connectionType === connType));
              });
              return !edgeExists;
          }
          return true;
      });
      return intersection;
  }, [rawNodesDict, rawEdgesDict, connectionTypes]);

  const isValidConnection = React.useCallback((connection: any) => { return getValidIntersection(connection.source, connection.target, updatingEdgeRef.current || undefined).length > 0; }, [getValidIntersection]);

  const onConnect = React.useCallback((connectionParams: any) => {
      const validTypes = getValidIntersection(connectionParams.source, connectionParams.target);
      if (validTypes.length === 0) return;
      
      let selectedType = validTypes[0]; 
      if (globalDefaultConnectionType && validTypes.includes(globalDefaultConnectionType)) {
          selectedType = globalDefaultConnectionType;
      }
      
      const typeDef = connectionTypes[selectedType] || {};

      if (props.store?.props) {
          props.store.props.write('edges', { ...rawEdgesDict, [generateShortId()]: { ...connectionParams, lineType: 'smoothstep', dashed: false, arrow: typeDef.arrow !== false, showLabel: false, connectionType: selectedType, offsetX: 0, offsetY: 0 } });
      }
  }, [props.store, rawEdgesDict, getValidIntersection, connectionTypes, globalDefaultConnectionType]);

  const onEdgeUpdate = React.useCallback((oldEdge: Edge, newConnection: Connection) => {
      if (!newConnection.source || !newConnection.target) return;
      const validTypes = getValidIntersection(newConnection.source, newConnection.target, oldEdge.id);
      if (validTypes.length === 0) return;

      if (props.store?.props) {
          const nextEdges = { ...rawEdgesDict }; const oldData = nextEdges[oldEdge.id];
          if (!validTypes.includes(oldData.connectionType)) { return; }
          nextEdges[oldEdge.id] = { ...oldData, source: newConnection.source, target: newConnection.target, sourceHandle: newConnection.sourceHandle, targetHandle: newConnection.targetHandle };
          props.store.props.write('edges', nextEdges);
      }
  }, [props.store, rawEdgesDict, getValidIntersection]);

  const onNodeDragStart = React.useCallback((event: any, node: any) => {
      const rawNode = rawNodesDict[node.id];
      if (rawNode?.paletteId === 'container' && !rawNode?.configs?.unlinked) {
          const insideIds = getNodesInside(node.id, rawNodesDict);
          const startPositions: any = {};
          insideIds.forEach(id => { startPositions[id] = { x: rawNodesDict[id].x, y: rawNodesDict[id].y }; });
          dragStartPos.current = startPositions;
      } else {
          dragStartPos.current = null;
      }
  }, [rawNodesDict]);

  const onNodeDrag = React.useCallback((event: any, node: any) => {
      if (dragStartPos.current && rawNodesDict[node.id]?.paletteId === 'container') {
          const dx = node.position.x - rawNodesDict[node.id].x;
          const dy = node.position.y - rawNodesDict[node.id].y;
          
          setLocalNodes(nds => nds.map(n => {
              if (dragStartPos.current[n.id]) {
                  return { ...n, position: { x: dragStartPos.current[n.id].x + dx, y: dragStartPos.current[n.id].y + dy } };
              }
              return n;
          }));
      }
  }, [rawNodesDict]);

  const onNodeDragStop = React.useCallback((event: any, node: any) => {
    if (props.store?.props) { 
        const nextNodes = { ...rawNodesDict }; 
        if (!nextNodes[node.id]) return; 

        const isContainer = nextNodes[node.id].paletteId === 'container';
        const dx = Math.round(node.position.x) - nextNodes[node.id].x;
        const dy = Math.round(node.position.y) - nextNodes[node.id].y;

        nextNodes[node.id] = { ...nextNodes[node.id], x: Math.round(node.position.x), y: Math.round(node.position.y) }; 

        if (isContainer && dragStartPos.current && (dx !== 0 || dy !== 0)) {
            Object.keys(dragStartPos.current).forEach(childId => {
                if (nextNodes[childId]) {
                    nextNodes[childId] = { ...nextNodes[childId], x: dragStartPos.current[childId].x + dx, y: dragStartPos.current[childId].y + dy };
                }
            });
        }
        
        props.store.props.write('nodes', nextNodes); 
        dragStartPos.current = null;
    }
  }, [props.store, rawNodesDict]);

  const onNodesDelete = React.useCallback((deleted: any[]) => {
      if (!props.store?.props) return;
      const nextNodes = { ...rawNodesDict }; const nextEdges = { ...rawEdgesDict }; let edgesChanged = false;
      deleted.forEach(n => {
          delete nextNodes[n.id];
          if (n.id === selectedId) setSelectedId(null);
          Object.keys(nextEdges).forEach(edgeId => { if (nextEdges[edgeId].source === n.id || nextEdges[edgeId].target === n.id) { delete nextEdges[edgeId]; edgesChanged = true; } });
      });
      props.store.props.write('nodes', nextNodes); if (edgesChanged) props.store.props.write('edges', nextEdges);
  }, [props.store, rawNodesDict, rawEdgesDict, selectedId]);

  const onEdgesDelete = React.useCallback((deleted: Edge[]) => {
      if (!props.store?.props) return;
      const nextEdges = { ...rawEdgesDict };
      deleted.forEach(e => { delete nextEdges[e.id]; if (e.id === selectedId) setSelectedId(null); });
      props.store.props.write('edges', nextEdges);
  }, [props.store, rawEdgesDict, selectedId]);

  const onNodeContextMenu = React.useCallback((event: any, node: any) => {
      event.preventDefault(); setSelectedId(node.id);
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      const isContainer = rawNodesDict[node.id]?.paletteId === 'container';
      if (bounds) { 
          setContextMenu({ 
              id: node.id, 
              top: event.clientY - bounds.top, 
              left: event.clientX - bounds.left, 
              type: 'node', 
              isContainer,
              clientX: event.clientX,
              clientY: event.clientY
          }); 
          setActiveSubMenu(null); 
      }
  }, [rawNodesDict]);

  const onEdgeContextMenu = React.useCallback((event: any, edge: any) => {
      event.preventDefault(); setSelectedId(edge.id);
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (bounds) { setContextMenu({ id: edge.id, top: event.clientY - bounds.top, left: event.clientX - bounds.left, type: 'edge' }); setActiveSubMenu(null); }
  }, []);

  const onPaneContextMenu = React.useCallback((event: any) => {
      event.preventDefault();
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (bounds) { setContextMenu({ id: 'pane', top: event.clientY - bounds.top, left: event.clientX - bounds.left, type: 'pane', clientX: event.clientX, clientY: event.clientY }); setActiveSubMenu(null); }
  }, []);

  const handleContextMenuAction = React.useCallback((action: string) => {
      if (!contextMenu) return;
      const isNode = contextMenu.type === 'node';
      const isEdge = contextMenu.type === 'edge';
      
      let currentPaletteId = 'pane';
      if (isNode) currentPaletteId = rawNodesDict[contextMenu.id]?.paletteId;
      if (isEdge) currentPaletteId = rawEdgesDict[contextMenu.id]?.connectionType;

      if (props.componentEvents) { props.componentEvents.fireComponentEvent('onContextMenuAction', { id: contextMenu.id, paletteId: currentPaletteId, type: contextMenu.type, action: action }); }

      if (action === 'reverseEdge' && isEdge) {
          if (props.store?.props) {
              const nextEdges = { ...rawEdgesDict };
              const currentEdge = nextEdges[contextMenu.id];
              if (currentEdge) {
                  nextEdges[contextMenu.id] = {
                      ...currentEdge,
                      source: currentEdge.target,
                      target: currentEdge.source,
                      sourceHandle: currentEdge.targetHandle,
                      targetHandle: currentEdge.sourceHandle
                  };
                  props.store.props.write('edges', nextEdges);
              }
          }
          closeContextMenu(); return;
      }

      if (action === 'editStyle' && isNode) {
          setStyleEditorNodeId(contextMenu.id);
          closeContextMenu(); return;
      }

      if (action === 'toggleGrayscale' && isNode) {
          if (props.store?.props) {
              const nextNodes = { ...rawNodesDict };
              const target = nextNodes[contextMenu.id];
              if (target) {
                  const newInactive = !target.inactive;
                  nextNodes[contextMenu.id] = { ...target, inactive: newInactive };

                  const nextEdges = { ...rawEdgesDict };
                  let edgesChanged = false;
                  Object.keys(nextEdges).forEach(edgeId => {
                      const edge = nextEdges[edgeId];
                      if (edge.source === contextMenu.id || edge.target === contextMenu.id) {
                          if (newInactive) {
                              nextEdges[edgeId] = { ...edge, dashed: true };
                          } else {
                              const otherNodeId = edge.source === contextMenu.id ? edge.target : edge.source;
                              if (!nextNodes[otherNodeId]?.inactive) {
                                  nextEdges[edgeId] = { ...edge, dashed: false };
                              }
                          }
                          edgesChanged = true;
                      }
                  });

                  props.store.props.write('nodes', nextNodes);
                  if (edgesChanged) props.store.props.write('edges', nextEdges);
              }
          }
          closeContextMenu(); return;
      }

      if (action === 'copy' && isNode) {
          executeCopy(contextMenu.id);
          closeContextMenu(); return;
      }

      if (action === 'toggleLink' && contextMenu.isContainer) {
          if (props.store?.props) {
              const nextNodes = { ...rawNodesDict };
              const target = nextNodes[contextMenu.id];
              if (target) {
                  target.configs = { ...target.configs, unlinked: !target.configs?.unlinked };
                  props.store.props.write('nodes', nextNodes);
              }
          }
          closeContextMenu(); return;
      }

      if (action === 'paste' && (contextMenu.type === 'pane' || contextMenu.isContainer)) {
          if (reactFlowInstance && contextMenu.clientX && contextMenu.clientY) {
              const position = reactFlowInstance.screenToFlowPosition({ x: contextMenu.clientX, y: contextMenu.clientY });
              let dropX = position.x; let dropY = position.y;
              if (snapEnabled) { dropX = Math.round(dropX / snapPixels) * snapPixels; dropY = Math.round(dropY / snapPixels) * snapPixels; }
              executePaste(dropX, dropY);
          }
          closeContextMenu(); return;
      }

      if (action === 'deleteWithContents' && isNode) {
          if (props.store?.props) {
              const nextNodes = { ...rawNodesDict }; 
              const nextEdges = { ...rawEdgesDict }; 
              let edgesChanged = false;
              
              const insideIds = getNodesInside(contextMenu.id, rawNodesDict);
              const idsToDelete = [contextMenu.id, ...insideIds];

              idsToDelete.forEach(idToDel => {
                  delete nextNodes[idToDel];
                  if (selectedId === idToDel) setSelectedId(null);
                  
                  Object.keys(nextEdges).forEach(edgeId => {
                      if (nextEdges[edgeId].source === idToDel || nextEdges[edgeId].target === idToDel) {
                          delete nextEdges[edgeId]; 
                          edgesChanged = true;
                      }
                  });
              });

              props.store.props.write('nodes', nextNodes);
              if (edgesChanged) props.store.props.write('edges', nextEdges);
          }
          closeContextMenu(); return;
      }

      if (action === 'delete') {
          if (contextMenu.type === 'node') {
              if (props.store?.props) {
                  const nextNodes = { ...rawNodesDict }; const nextEdges = { ...rawEdgesDict }; let edgesChanged = false;
                  delete nextNodes[contextMenu.id];
                  Object.keys(nextEdges).forEach(edgeId => { if (nextEdges[edgeId].source === contextMenu.id || nextEdges[edgeId].target === contextMenu.id) { delete nextEdges[edgeId]; edgesChanged = true; } });
                  props.store.props.write('nodes', nextNodes); if (edgesChanged) props.store.props.write('edges', nextEdges);
                  if (selectedId === contextMenu.id) setSelectedId(null);
              }
          } else if (contextMenu.type === 'edge') {
              if (props.store?.props) { const nextEdges = { ...rawEdgesDict }; delete nextEdges[contextMenu.id]; props.store.props.write('edges', nextEdges); if (selectedId === contextMenu.id) setSelectedId(null); }
          }
          closeContextMenu(); return;
      }

      if (['bringToFront', 'bringForward', 'sendBackward', 'sendToBack'].includes(action) && isNode) {
          if (props.store?.props) {
              const nextNodes = { ...rawNodesDict };
              const currentZ = nextNodes[contextMenu.id].zIndex ?? -1;

              if (action === 'bringForward') {
                  nextNodes[contextMenu.id].zIndex = Math.min(currentZ + 1, 999);
              } else if (action === 'sendBackward') {
                  nextNodes[contextMenu.id].zIndex = currentZ - 1;
              } else {
                  const containerZIndices = Object.values(nextNodes)
                      .filter((n: any) => n.paletteId === 'container')
                      .map((n: any) => n.zIndex ?? -1);
                  
                  if (action === 'bringToFront') {
                      nextNodes[contextMenu.id].zIndex = Math.min(Math.max(...containerZIndices, -1) + 1, 999);
                  } else if (action === 'sendToBack') {
                      nextNodes[contextMenu.id].zIndex = Math.min(...containerZIndices, -1) - 1;
                  }
              }
              props.store.props.write('nodes', nextNodes);
          }
          closeContextMenu(); return;
      }

      if (action === 'toggleArrow' && isEdge) {
          if (props.store?.props) { const nextEdges = { ...rawEdgesDict }; if (nextEdges[contextMenu.id]) { nextEdges[contextMenu.id].arrow = nextEdges[contextMenu.id].arrow === false ? true : false; props.store.props.write('edges', nextEdges); } }
          closeContextMenu(); return;
      }

      if (action === 'toggleLabel' && isEdge) {
          if (props.store?.props) { const nextEdges = { ...rawEdgesDict }; if (nextEdges[contextMenu.id]) { nextEdges[contextMenu.id].showLabel = nextEdges[contextMenu.id].showLabel !== true; props.store.props.write('edges', nextEdges); } }
          closeContextMenu(); return;
      }

      if (action === 'toggleDashed' && isEdge) {
          if (props.store?.props) { const nextEdges = { ...rawEdgesDict }; if (nextEdges[contextMenu.id]) { nextEdges[contextMenu.id].dashed = !nextEdges[contextMenu.id].dashed; props.store.props.write('edges', nextEdges); } }
          closeContextMenu(); return;
      }
      closeContextMenu();
  }, [contextMenu, rawNodesDict, rawEdgesDict, selectedId, snapEnabled, snapPixels, reactFlowInstance, props.store, executeCopy, executePaste, closeContextMenu]);

  const handleNodeSwap = (newPaletteId: string) => {
      if (!contextMenu || contextMenu.type !== 'node') return;
      const newItem = paletteItems.find((p: any) => p.id === newPaletteId);
      if (!newItem) return;
      if (props.componentEvents) { props.componentEvents.fireComponentEvent('onContextMenuAction', { id: contextMenu.id, paletteId: rawNodesDict[contextMenu.id]?.paletteId, type: contextMenu.type, action: `swapNode:${newPaletteId}` }); }
      if (props.store?.props) {
          const nextNodes = { ...rawNodesDict }; const existingNode = nextNodes[contextMenu.id];
          nextNodes[contextMenu.id] = { ...existingNode, paletteId: newItem.id, label: newItem.label, svg: newItem.svg, tooltip: newItem.tooltip, supportedConnections: newItem.supportedConnections || [] };
          const nextEdges = { ...rawEdgesDict }; let edgesChanged = false;
          Object.keys(nextEdges).forEach(edgeId => {
              const e = nextEdges[edgeId];
              if (e.source === contextMenu.id || e.target === contextMenu.id) {
                  const isSource = e.source === contextMenu.id; const otherNodeId = isSource ? e.target : e.source; const otherNode = nextNodes[otherNodeId];
                  if (otherNode) {
                      const newSupported = newItem.supportedConnections || []; const otherSupported = otherNode.supportedConnections || [];
                      if (!newSupported.includes(e.connectionType) || !otherSupported.includes(e.connectionType)) { delete nextEdges[edgeId]; edgesChanged = true; }
                  }
              }
          });
          props.store.props.write('nodes', nextNodes); if (edgesChanged) props.store.props.write('edges', nextEdges);
      }
      closeContextMenu();
  };

  const handleLineTypeChange = (newLineType: string) => {
      if (!contextMenu || contextMenu.type !== 'edge') return;
      if (props.componentEvents) { props.componentEvents.fireComponentEvent('onContextMenuAction', { id: contextMenu.id, paletteId: rawEdgesDict[contextMenu.id]?.connectionType, type: contextMenu.type, action: `lineType:${newLineType}` }); }
      if (props.store?.props) { const nextEdges = { ...rawEdgesDict }; if (nextEdges[contextMenu.id]) { nextEdges[contextMenu.id].lineType = newLineType; props.store.props.write('edges', nextEdges); } }
      closeContextMenu();
  };

  const handleConnectionTypeChange = (newConnectionType: string) => {
      if (!contextMenu || contextMenu.type !== 'edge') return;
      if (props.componentEvents) { props.componentEvents.fireComponentEvent('onContextMenuAction', { id: contextMenu.id, paletteId: rawEdgesDict[contextMenu.id]?.connectionType, type: contextMenu.type, action: `connectionType:${newConnectionType}` }); }
      if (props.store?.props) { const nextEdges = { ...rawEdgesDict }; if (nextEdges[contextMenu.id]) { const typeDef = connectionTypes[newConnectionType] || {}; nextEdges[contextMenu.id].connectionType = newConnectionType; nextEdges[contextMenu.id].arrow = typeDef.arrow !== false; props.store.props.write('edges', nextEdges); } }
      closeContextMenu();
  };

  const onDragOver = React.useCallback((event: any) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = 'move'; }, []);
  
  const onDrop = React.useCallback((event: any) => {
    event.preventDefault(); event.stopPropagation();
    const paletteItem = draggedItemRef.current; if (!paletteItem || !reactFlowInstance) return;
    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    let dropX = Math.round(position.x); let dropY = Math.round(position.y);
    if (snapEnabled) { dropX = Math.round(dropX / snapPixels) * snapPixels; dropY = Math.round(dropY / snapPixels) * snapPixels; }
    
    const initialConfigs = JSON.parse(JSON.stringify(paletteItem.defaultConfigs || {}));
    const initialStyle = JSON.parse(JSON.stringify(paletteItem.style || { classes: "" }));
    const initialLabelStyle = JSON.parse(JSON.stringify(paletteItem.labelStyle || { classes: "" })); 

    if (props.store?.props) {
        const newNodeId = generateShortId();
        const newNodeData: any = { 
            paletteId: paletteItem.id, label: paletteItem.label, svg: paletteItem.svg, tooltip: paletteItem.tooltip, 
            x: dropX, y: dropY, 
            hideHandles: false, style: initialStyle, labelStyle: initialLabelStyle, configs: initialConfigs, supportedConnections: paletteItem.supportedConnections || [] 
        };
        
        if (paletteItem.id === 'container') {
            newNodeData.width = 300;
            newNodeData.height = 300;
            newNodeData.zIndex = -1;
        }
        
        const nextNodes = { ...rawNodesDict }; nextNodes[newNodeId] = newNodeData;
        props.store.props.write('nodes', nextNodes); setSelectedId(newNodeId);
    }
    draggedItemRef.current = null;
  }, [reactFlowInstance, props.store, rawNodesDict, snapEnabled, snapPixels]);

  const onNodeClick = React.useCallback((event: any, node: any) => { setSelectedId(node.id); const rawNode = rawNodesDict[node.id]; if (props.componentEvents) props.componentEvents.fireComponentEvent('onNodeClick', { id: node.id, paletteId: rawNode?.paletteId, type: 'node' }); }, [props.componentEvents, rawNodesDict]);
  const onEdgeClick = React.useCallback((event: any, edge: any) => { setSelectedId(edge.id); const rawEdge = rawEdgesDict[edge.id]; if (props.componentEvents) props.componentEvents.fireComponentEvent('onEdgeClick', { id: edge.id, paletteId: rawEdge?.connectionType, type: 'edge' }); }, [props.componentEvents, rawEdgesDict]);
  const onPaneClick = React.useCallback(() => { setSelectedId(null); closeContextMenu(); }, [closeContextMenu]);

  let availableConnections: string[] = []; let currentLineType = 'smoothstep'; let currentConnectionType = '';
  let validSwapItems: any[] = []; 
  
  if (contextMenu && contextMenu.type === 'edge') {
      const edge = rawEdgesDict[contextMenu.id];
      if (edge) {
          currentLineType = edge.lineType || 'smoothstep'; currentConnectionType = edge.connectionType;
          availableConnections = getValidIntersection(edge.source, edge.target, contextMenu.id);
          if (!availableConnections.includes(currentConnectionType)) availableConnections.push(currentConnectionType);
      }
  }

  if (contextMenu && contextMenu.type === 'node') {
      const node = rawNodesDict[contextMenu.id];
      if (node) {
          const currentPaletteItem = paletteItems.find((p: any) => p.id === node.paletteId);
          if (currentPaletteItem && currentPaletteItem.swappableWith) { validSwapItems = paletteItems.filter((p: any) => currentPaletteItem.swappableWith.includes(p.id)); }
      }
  }

  const flyoutStyle: React.CSSProperties = (reactFlowWrapper.current && contextMenu &&
      contextMenu.left + 310 > reactFlowWrapper.current.clientWidth)
      ? { position: 'absolute', top: '-4px', right: '100%', marginRight: '4px' }
      : { position: 'absolute', top: '-4px', left: '100%', marginLeft: '4px' };

  const { classes, ...ignitionStyles } = props.props.style || {};
  const containerStyle: React.CSSProperties = { 
      display: 'flex', 
      width: '100%', 
      height: '100%', 
      backgroundColor: 'var(--neutral-00)', 
      ...ignitionStyles 
  };

  return (
    <div {...props.emit({ classes })} style={containerStyle} tabIndex={0}>
      <style>
        {`
        .arch-theme-wrapper {
            display: flex;
            flex-direction: row;
            flex: 1;
            width: 100%;
            height: 100%;
            --edge: #78D175;
            --panel: #78D175;
            --cloud: #25A4E9;
            --standard: #FF8C00;
            --cirrusLink: #156D97;
            --sepasoft: #2DA449;
            --ia-darkgray: #39464B;
            --ia-green: #8DC63E;
            --ia-gray: #445C6D;
            --ignition-orange: #F7901E;
            --ignition-blue: #003E69;
            --ignition-darkblue: #002143;
            --edge-green: #78D175;
            --edge-gray: #283439;
            --edge-dark-gray: #1E2528;
            --edge-light-gray: #4E5558;
        }

        .arch-node-gear { transform-origin: 50% 50%; transition: transform 0.75s ease-in-out; }
        .arch-node-gear:hover { transform: rotate(360deg); }
        .arch-node-gear:active { transform: translateX(-100%) rotate(-360deg); }

        .arch-node-svg-wrapper svg {
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }

        .arch-node-handle::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            background: transparent;
            cursor: crosshair;
        }

        .arch-node-handle:hover {
            background-color: var(--callToAction) !important;
            border-color: var(--callToAction) !important;
            transform: scale(1.5);
        }
        `}
      </style>

      <div className="arch-theme-wrapper">
        {isEnabled && <Sidebar paletteItems={paletteItems} isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onDragStartItem={(item) => { draggedItemRef.current = item; }} />}
        
        <div style={{ flexGrow: 1, height: '100%', position: 'relative', overflow: 'hidden' }} ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={localNodes} edges={flowEdges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
              isValidConnection={isValidConnection} onInit={setReactFlowInstance}
              onDrop={isEnabled ? onDrop : undefined} onDragOver={isEnabled ? onDragOver : undefined}
              onConnect={isEnabled ? onConnect : undefined} onEdgeUpdate={isEnabled ? onEdgeUpdate : undefined}
              onEdgeUpdateStart={isEnabled ? (event: any, edge: any) => { updatingEdgeRef.current = edge?.id || null; } : undefined}
              onEdgeUpdateEnd={isEnabled ? () => { updatingEdgeRef.current = null; } : undefined}
              onNodeDragStart={isEnabled ? onNodeDragStart : undefined} onNodeDrag={isEnabled ? onNodeDrag : undefined} onNodeDragStop={isEnabled ? onNodeDragStop : undefined}
              onNodesChange={onNodesChange}
              onNodeClick={isEnabled ? onNodeClick : undefined} onEdgeClick={isEnabled ? onEdgeClick : undefined}
              onNodesDelete={isEnabled ? onNodesDelete : undefined} onEdgesDelete={isEnabled ? onEdgesDelete : undefined}
              onNodeContextMenu={isEnabled ? onNodeContextMenu : undefined} onEdgeContextMenu={isEnabled ? onEdgeContextMenu : undefined}
              onPaneClick={onPaneClick} onPaneContextMenu={isEnabled ? onPaneContextMenu : undefined}
              nodesDraggable={isEnabled} nodesConnectable={isEnabled} elementsSelectable={isEnabled}
              connectionMode={ConnectionMode.Loose} snapToGrid={snapEnabled} snapGrid={snapGrid}
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
                  onSave={(newStyle, newLabelStyle) => {
                      if (props.store?.props) {
                          const nextNodes = { ...rawNodesDict };
                          nextNodes[styleEditorNodeId].style = newStyle;
                          nextNodes[styleEditorNodeId].labelStyle = newLabelStyle;
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
                      <div style={{ padding: '5px 8px', cursor: clipboardRef.current ? 'pointer' : 'not-allowed', color: clipboardRef.current ? 'var(--neutral-90)' : 'var(--neutral-50)' }} onClick={() => { if(clipboardRef.current) handleContextMenuAction('paste'); }}> 
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
                                          <span>⬜ Toggle Inactive</span>
                                          <span>{rawNodesDict[contextMenu.id]?.inactive ? '✓' : ''}</span>
                                      </div>
                                  )}

                                  <div style={{ borderTop: '1px solid var(--neutral-40)', margin: '4px 0' }} />
                                  
                                  <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('copy')}>📋 Copy</div> 
                                  
                                  {contextMenu.isContainer && (
                                      <>
                                          <div style={{ padding: '5px 8px', cursor: clipboardRef.current ? 'pointer' : 'not-allowed', color: clipboardRef.current ? 'var(--neutral-90)' : 'var(--neutral-50)' }} onClick={() => { if(clipboardRef.current) handleContextMenuAction('paste'); }}>📋 Paste</div>
                                          
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
                                                          <div style={{ width: '16px', height: '16px', marginRight: '6px', display: 'flex', alignItems: 'center' }} dangerouslySetInnerHTML={{ __html: targetItem.svg }} />
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
                                  <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('reverseEdge')}> 
                                      🔄 Reverse Direction 
                                  </div>
                                  <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('toggleArrow')}> 
                                      {rawEdgesDict[contextMenu.id]?.arrow !== false ? '❌ Remove Arrow' : '➡️ Add Arrow'} 
                                  </div>
                                  <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('toggleLabel')}>
                                      {rawEdgesDict[contextMenu.id]?.showLabel === true ? '👁️ Hide Label' : '👁️ Show Label'}
                                  </div>
                                  <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('toggleDashed')}>
                                      {rawEdgesDict[contextMenu.id]?.dashed ? '─── Solid Line' : '- - - Dashed Line'}
                                  </div>
                                  <div style={{ borderTop: '1px solid var(--neutral-40)', margin: '4px 0' }} />
                                  
                                  <div style={{ position: 'relative' }} onMouseEnter={() => setActiveSubMenu('lineType')}>
                                      <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', backgroundColor: activeSubMenu === 'lineType' ? 'var(--neutral-30)' : 'transparent' }}> 
                                          <span>〰️ Line Type</span><span>▶</span> 
                                      </div>
                                      {activeSubMenu === 'lineType' && (
                                          <div style={{ ...flyoutStyle, backgroundColor: 'var(--neutral-20)', border: '1px solid var(--neutral-50)', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', padding: '4px', minWidth: '120px' }}>
                                              <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', gap: '12px' }} onClick={() => handleLineTypeChange('smoothstep')}>
                                                  <span>〰️ Smooth</span><span>{currentLineType === 'smoothstep' ? '✓' : ''}</span>
                                              </div>
                                              <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', gap: '12px' }} onClick={() => handleLineTypeChange('step')}>
                                                  <span>🔲 Stepped</span><span>{currentLineType === 'step' ? '✓' : ''}</span>
                                              </div>
                                              <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', gap: '12px' }} onClick={() => handleLineTypeChange('straight')}>
                                                  <span>📏 Straight</span><span>{currentLineType === 'straight' ? '✓' : ''}</span>
                                              </div>
                                              <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', gap: '12px' }} onClick={() => handleLineTypeChange('default')}>
                                                  <span>➰ Bezier</span><span>{currentLineType === 'default' ? '✓' : ''}</span>
                                              </div>
                                          </div>
                                      )}
                                  </div>
                                  
                                  <div style={{ position: 'relative' }} onMouseEnter={() => setActiveSubMenu('connectionType')}>
                                      <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', backgroundColor: activeSubMenu === 'connectionType' ? 'var(--neutral-30)' : 'transparent' }}> 
                                          <span>🔗 Connection</span><span>▶</span> 
                                      </div>
                                      {activeSubMenu === 'connectionType' && (
                                          <div style={{ ...flyoutStyle, backgroundColor: 'var(--neutral-20)', border: '1px solid var(--neutral-50)', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', padding: '4px', minWidth: '140px' }}>
                                              {availableConnections.length === 0 ? ( 
                                                  <div style={{ padding: '5px 8px', color: 'var(--neutral-60)' }}>No valid connections</div> 
                                              ) : ( 
                                                  availableConnections.map(c => ( 
                                                      <div key={c} style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', whiteSpace: 'nowrap', gap: '12px' }} onClick={() => handleConnectionTypeChange(c)}> 
                                                          <span><span style={{ color: connectionTypes[c]?.color || 'var(--neutral-90)', marginRight: '4px' }}>●</span> {connectionTypes[c]?.label || c}</span>
                                                          <span>{currentConnectionType === c ? '✓' : ''}</span>
                                                      </div> 
                                                  )) 
                                              )}
                                          </div>
                                      )}
                                  </div>
                              </>
                          )}
                          {contextMenu.isContainer && (
                              <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--error)', borderTop: '1px solid var(--neutral-40)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('deleteWithContents')}>🗑️ Delete Area & Contents</div>
                          )}
                          <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--error)', borderTop: contextMenu.isContainer ? 'none' : '1px solid var(--neutral-40)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('delete')}>{contextMenu.isContainer ? '🗑️ Delete Area Only' : '🗑️ Delete'}</div>
                      </>
                  )}
              </div>
          )}
        </div>
      </div>
    </div>
  );
});