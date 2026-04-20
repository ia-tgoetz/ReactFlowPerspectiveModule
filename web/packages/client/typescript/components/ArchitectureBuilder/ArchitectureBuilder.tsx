import * as React from 'react';
import { ComponentProps } from '@inductiveautomation/perspective-client';
import { observer } from 'mobx-react';
// @ts-ignore
import ReactFlow, { ReactFlowProvider, Background, Controls, ConnectionMode, Edge, Connection, applyNodeChanges, NodeChange, MarkerType, BaseEdge, getSmoothStepPath, getBezierPath, getStraightPath } from 'reactflow';
import 'reactflow/dist/style.css';
import { Sidebar, PaletteItem } from './Sidebar';
import { ArchitectureNode } from './ArchitectureNode';

// 1. Custom Edge Component to handle offsetX and offsetY on the middle segment
const CustomEdge = ({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, style, label }: any) => {
    const offsetX = Number(data?.offsetX) || 0;
    const offsetY = Number(data?.offsetY) || 0;
    const showLabel = data?.showLabel !== false; // <-- ADDED: Default to true if undefined

    let edgePath = '';
    let labelX = 0;
    let labelY = 0;

    // Only apply offsets to stepped lines
    if (data?.lineType === 'step' || data?.lineType === 'smoothstep' || !data?.lineType) {
        
        // Calculate the natural center of the routing path
        const defaultCenterX = (sourceX + targetX) / 2;
        const defaultCenterY = (sourceY + targetY) / 2;

        [edgePath, labelX, labelY] = getSmoothStepPath({ 
            sourceX, 
            sourceY, 
            targetX, 
            targetY, 
            sourcePosition, 
            targetPosition, 
            borderRadius: data?.lineType === 'step' ? 0 : 15, // 15 is React Flow's default smooth curve
            // Apply the offsets ONLY to the middle routing segments, keeping ends attached
            centerX: defaultCenterX + offsetX,
            centerY: defaultCenterY + offsetY
        });
        
    } else if (data?.lineType === 'straight') {
        // Straight lines ignore offsets
        [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
    } else if (data?.lineType === 'default') { 
        // Bezier curves ignore offsets
        [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
    }

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={{...style, fill: 'none'}} />
            {/* <-- ADDED: showLabel condition here */}
            {label && showLabel && (
                <text x={labelX} y={labelY} style={{ fill: style?.stroke || 'var(--neutral-90)', fontSize: 12, fontWeight: 'bold' }} textAnchor="middle" dominantBaseline="central">
                    {label}
                </text>
            )}
        </>
    );
};

const nodeTypes = { architecture: ArchitectureNode };
const edgeTypes = { custom: CustomEdge };

const generateShortId = () => 'I' + Math.random().toString(16).substring(2, 10);

const extractDeep = (obj: any): any => {
    if (obj === null || obj === undefined) return undefined;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj) || typeof obj.map === 'function') {
        return obj.map((item: any) => extractDeep(item));
    }
    const plain: any = {};
    for (const key in obj) plain[key] = extractDeep(obj[key]);
    return plain;
};

const mapIgnitionToReactFlowNodes = (ignitionNodes: any, handleGearClick: (id: string) => void, selectedId: string | null, globalHideHandles: boolean) => {
    if (!ignitionNodes) return [];
    return Object.entries(ignitionNodes)
        .filter(([id, nodeData]: any) => nodeData !== null && nodeData !== undefined)
        .map(([id, nodeData]: any) => {
            return {
                id, type: 'architecture',
                selected: id === selectedId,
                position: { x: nodeData.x || 0, y: nodeData.y || 0 },
                data: { 
                    label: nodeData.label || 'Unknown', 
                    svg: nodeData.svg || '', 
                    tooltip: nodeData.tooltip || '',
                    configs: nodeData.configs || {}, 
                    style: nodeData.style || {},
                    paletteId: nodeData.paletteId || 'unknown',
                    hideHandles: nodeData.hideHandles,
                    globalHideHandles: globalHideHandles,
                    onGearClick: handleGearClick 
                } 
            };
        });
};

const mapIgnitionToReactFlowEdges = (ignitionEdges: any, connectionTypes: any, selectedId: string | null) => {
    if (!ignitionEdges) return [];
    return Object.entries(ignitionEdges)
        .filter(([id, edgeData]: any) => edgeData !== null && edgeData !== undefined)
        .map(([id, edgeData]: any) => {
            const typeConfig = connectionTypes[edgeData.connectionType] || {};
            const isSelected = id === selectedId;
            
            const strokeStyle: any = { 
                stroke: isSelected ? 'var(--callToAction)' : (typeConfig.color || '#888'), 
                strokeWidth: isSelected ? 5 : 3 
            };
            
            if (edgeData.dashed) strokeStyle.strokeDasharray = '8 5'; 

            const arrowMarker = edgeData.arrow !== false ? {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: strokeStyle.stroke
            } : undefined;

            return {
                id, ...edgeData,
                type: 'custom', 
                data: { 
                    lineType: edgeData.lineType || 'smoothstep', 
                    offsetX: edgeData.offsetX || 0, 
                    offsetY: edgeData.offsetY || 0,
                    showLabel: edgeData.showLabel !== false // <-- ADDED: Send showLabel to CustomEdge
                },
                label: typeConfig.label || edgeData.connectionType || '',
                style: strokeStyle,
                markerEnd: arrowMarker,
                interactionWidth: 20,
                updatable: true
            };
        });
};

export interface ArchitectureBuilderProps {
    hideHandles?: any;
    snapEnabled?: any;
    snapPixels?: any;
    style?: any; connectionTypes: any; paletteItems: any[]; nodes: any; edges: any;
}

export const ArchitectureBuilder = observer((props: ComponentProps<ArchitectureBuilderProps>) => {
  const reactFlowWrapper = React.useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [contextMenu, setContextMenu] = React.useState<{ id: string, top: number, left: number, type: 'node' | 'edge' } | null>(null);
  const [activeSubMenu, setActiveSubMenu] = React.useState<'lineType' | 'connectionType' | null>(null);
  
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
  const snapEnabled = props.props.snapEnabled !== false && String(props.props.snapEnabled).toLowerCase() !== 'false'; 
  const snapPixels = Number(props.props.snapPixels) || 15;
  const snapGrid = React.useMemo<[number, number]>(() => [snapPixels, snapPixels], [snapPixels]);

  const handleGearClick = React.useCallback((id: string) => {
      setSelectedId(id); 
      const node = rawNodesDict[id];
      if (props.componentEvents && node) {
          props.componentEvents.fireComponentEvent('onGearClick', { id, paletteId: node.paletteId, type: 'node', action: 'config' });
      }
  }, [props.componentEvents, rawNodesDict]);

  const flowNodes = React.useMemo(() => mapIgnitionToReactFlowNodes(rawNodesDict, handleGearClick, selectedId, globalHideHandles), [rawNodesDict, handleGearClick, selectedId, globalHideHandles]);
  const flowEdges = React.useMemo(() => mapIgnitionToReactFlowEdges(rawEdgesDict, connectionTypes, selectedId), [rawEdgesDict, connectionTypes, selectedId]);

  React.useEffect(() => {
      setLocalNodes(flowNodes);
  }, [flowNodes]);

  const onNodesChange = React.useCallback((changes: NodeChange[]) => {
      setLocalNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const getValidIntersection = React.useCallback((sourceId: string, targetId: string) => {
      const sourceNode = rawNodesDict[sourceId];
      const targetNode = rawNodesDict[targetId];
      if (!sourceNode || !targetNode || !sourceNode.supportedConnections || !targetNode.supportedConnections) return [];

      let intersection = sourceNode.supportedConnections.filter((c: string) => targetNode.supportedConnections.includes(c));

      intersection = intersection.filter((connType: string) => {
          const typeDef = connectionTypes[connType];
          if (typeDef && typeDef.multiple === false) {
              const edgeExists = Object.values(rawEdgesDict).some((e: any) =>
                  (e.source === sourceId && e.target === targetId && e.connectionType === connType) ||
                  (e.source === targetId && e.target === sourceId && e.connectionType === connType) 
              );
              return !edgeExists;
          }
          return true;
      });

      return intersection;
  }, [rawNodesDict, rawEdgesDict, connectionTypes]);

  const isValidConnection = React.useCallback((connection: any) => {
      const validTypes = getValidIntersection(connection.source, connection.target);
      return validTypes.length > 0;
  }, [getValidIntersection]);

  const onConnect = React.useCallback((connectionParams: any) => {
      const validTypes = getValidIntersection(connectionParams.source, connectionParams.target);
      if (validTypes.length === 0) return;
      
      const selectedType = validTypes[0];
      const typeDef = connectionTypes[selectedType] || {};

      if (props.store?.props) {
          props.store.props.write('edges', {
              ...rawEdgesDict, 
              [generateShortId()]: { 
                  ...connectionParams, 
                  lineType: 'smoothstep', 
                  dashed: false, 
                  arrow: typeDef.arrow !== false, 
                  showLabel: true, // <-- ADDED: Default new edges to show label
                  connectionType: selectedType,
                  offsetX: 0,
                  offsetY: 0
              }
          });
      }
  }, [props.store, rawEdgesDict, getValidIntersection, connectionTypes]);

  const onEdgeUpdate = React.useCallback((oldEdge: Edge, newConnection: Connection) => {
      if (!newConnection.source || !newConnection.target) return;
      
      const validTypes = getValidIntersection(newConnection.source, newConnection.target);
      if (validTypes.length === 0) return;

      if (props.store?.props) {
          const nextEdges = { ...rawEdgesDict };
          const oldData = nextEdges[oldEdge.id];
          
          const newConnType = validTypes.includes(oldData.connectionType) ? oldData.connectionType : validTypes[0];
          
          let newArrowState = oldData.arrow;
          if (newConnType !== oldData.connectionType) {
              const typeDef = connectionTypes[newConnType] || {};
              newArrowState = typeDef.arrow !== false; 
          }

          nextEdges[oldEdge.id] = {
              ...oldData,
              source: newConnection.source,
              target: newConnection.target,
              sourceHandle: newConnection.sourceHandle,
              targetHandle: newConnection.targetHandle,
              connectionType: newConnType,
              arrow: newArrowState
          };
          props.store.props.write('edges', nextEdges);
      }
  }, [props.store, rawEdgesDict, getValidIntersection, connectionTypes]);

  const onNodesDelete = React.useCallback((deleted: any[]) => {
      if (!props.store?.props) return;
      const nextNodes = { ...rawNodesDict };
      deleted.forEach(n => {
          delete nextNodes[n.id];
          if (n.id === selectedId) setSelectedId(null);
      });
      props.store.props.write('nodes', nextNodes);
  }, [props.store, rawNodesDict, selectedId]);

  const onEdgesDelete = React.useCallback((deleted: Edge[]) => {
      if (!props.store?.props) return;
      const nextEdges = { ...rawEdgesDict };
      deleted.forEach(e => {
          delete nextEdges[e.id];
          if (e.id === selectedId) setSelectedId(null);
      });
      props.store.props.write('edges', nextEdges);
  }, [props.store, rawEdgesDict, selectedId]);

  const onNodeContextMenu = React.useCallback((event: any, node: any) => {
      event.preventDefault();
      setSelectedId(node.id);
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (bounds) {
          setContextMenu({ id: node.id, top: event.clientY - bounds.top, left: event.clientX - bounds.left, type: 'node' });
          setActiveSubMenu(null);
      }
  }, []);

  const onEdgeContextMenu = React.useCallback((event: any, edge: any) => {
      event.preventDefault();
      setSelectedId(edge.id);
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (bounds) {
          setContextMenu({ id: edge.id, top: event.clientY - bounds.top, left: event.clientX - bounds.left, type: 'edge' });
          setActiveSubMenu(null);
      }
  }, []);

  const closeContextMenu = React.useCallback(() => {
      setContextMenu(null);
      setActiveSubMenu(null);
  }, []);

  const handleContextMenuAction = (action: string) => {
      if (!contextMenu) return;
      const isNode = contextMenu.type === 'node';

      if (action === 'toggleArrow' && !isNode) {
          if (props.store?.props) {
              const nextEdges = { ...rawEdgesDict };
              if (nextEdges[contextMenu.id]) {
                  nextEdges[contextMenu.id].arrow = nextEdges[contextMenu.id].arrow === false ? true : false;
                  props.store.props.write('edges', nextEdges);
              }
          }
          closeContextMenu();
          return;
      }

      // <-- ADDED: Context menu action to toggle the label boolean
      if (action === 'toggleLabel' && !isNode) {
          if (props.store?.props) {
              const nextEdges = { ...rawEdgesDict };
              if (nextEdges[contextMenu.id]) {
                  nextEdges[contextMenu.id].showLabel = nextEdges[contextMenu.id].showLabel === false ? true : false;
                  props.store.props.write('edges', nextEdges);
              }
          }
          closeContextMenu();
          return;
      }

      const paletteId = isNode ? rawNodesDict[contextMenu.id]?.paletteId : rawEdgesDict[contextMenu.id]?.connectionType;
      
      if (props.componentEvents) {
          props.componentEvents.fireComponentEvent('onContextMenuAction', { id: contextMenu.id, paletteId, type: contextMenu.type, action });
      }
      closeContextMenu();
  };

  const handleLineTypeChange = (newLineType: string) => {
      if (!contextMenu || contextMenu.type !== 'edge') return;
      if (props.store?.props) {
          const nextEdges = { ...rawEdgesDict };
          if (nextEdges[contextMenu.id]) {
              nextEdges[contextMenu.id].lineType = newLineType;
              props.store.props.write('edges', nextEdges);
          }
      }
      closeContextMenu();
  };

  const handleConnectionTypeChange = (newConnectionType: string) => {
      if (!contextMenu || contextMenu.type !== 'edge') return;
      if (props.store?.props) {
          const nextEdges = { ...rawEdgesDict };
          if (nextEdges[contextMenu.id]) {
              const typeDef = connectionTypes[newConnectionType] || {};
              nextEdges[contextMenu.id].connectionType = newConnectionType;
              nextEdges[contextMenu.id].arrow = typeDef.arrow !== false;
              props.store.props.write('edges', nextEdges);
          }
      }
      closeContextMenu();
  };

  const onDragOver = React.useCallback((event: any) => { 
      event.preventDefault(); 
      event.stopPropagation(); 
      event.dataTransfer.dropEffect = 'move'; 
  }, []);

  const onDrop = React.useCallback((event: any) => {
    event.preventDefault();
    event.stopPropagation();

    const paletteItem = draggedItemRef.current;
    if (!paletteItem || !reactFlowInstance) return;

    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });

    let dropX = Math.round(position.x);
    let dropY = Math.round(position.y);
    
    if (snapEnabled) {
        dropX = Math.round(dropX / snapPixels) * snapPixels;
        dropY = Math.round(dropY / snapPixels) * snapPixels;
    }

    const initialConfigs = paletteItem.defaultConfigs || paletteItem.configs || {};

    if (props.store?.props) {
        const newNodeId = generateShortId();
        const newNodeData = {
            paletteId: paletteItem.id, 
            label: paletteItem.label, svg: paletteItem.svg, tooltip: paletteItem.tooltip,
            x: dropX, y: dropY, 
            hideHandles: false, 
            style: paletteItem.style || { classes: "" },
            configs: initialConfigs,
            supportedConnections: paletteItem.supportedConnections || []
        };
        const nextNodes = { ...rawNodesDict };
        nextNodes[newNodeId] = newNodeData;
        props.store.props.write('nodes', nextNodes);
        setSelectedId(newNodeId);
    }
    draggedItemRef.current = null;
  }, [reactFlowInstance, props.store, rawNodesDict, snapEnabled, snapPixels]);

  const onNodeDragStop = React.useCallback((event: any, node: any) => {
    if (props.store?.props) {
        const nextNodes = { ...rawNodesDict };
        if (!nextNodes[node.id]) return;
        nextNodes[node.id] = { ...nextNodes[node.id], x: Math.round(node.position.x), y: Math.round(node.position.y) };
        props.store.props.write('nodes', nextNodes);
    }
  }, [props.store, rawNodesDict]);

  const onNodeClick = React.useCallback((event: any, node: any) => {
      setSelectedId(node.id);
      const rawNode = rawNodesDict[node.id];
      if (props.componentEvents) {
          props.componentEvents.fireComponentEvent('onNodeClick', { id: node.id, paletteId: rawNode?.paletteId, type: 'node' });
      }
  }, [props.componentEvents, rawNodesDict]);

  const onEdgeClick = React.useCallback((event: any, edge: any) => {
      setSelectedId(edge.id);
      const rawEdge = rawEdgesDict[edge.id];
      if (props.componentEvents) {
          props.componentEvents.fireComponentEvent('onEdgeClick', { id: edge.id, paletteId: rawEdge?.connectionType, type: 'edge' });
      }
  }, [props.componentEvents, rawEdgesDict]);

  const onPaneClick = React.useCallback(() => {
      setSelectedId(null);
      closeContextMenu();
  }, [closeContextMenu]);


  let availableConnections: string[] = [];
  let currentLineType = 'smoothstep';
  let currentConnectionType = '';

  if (contextMenu && contextMenu.type === 'edge') {
      const edge = rawEdgesDict[contextMenu.id];
      if (edge) {
          currentLineType = edge.lineType || 'smoothstep';
          currentConnectionType = edge.connectionType;
          availableConnections = getValidIntersection(edge.source, edge.target);
          if (!availableConnections.includes(currentConnectionType)) availableConnections.push(currentConnectionType);
      }
  }

  return (
    <div {...props.emit()} style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: 'var(--neutral-00)' }}>
      <Sidebar 
          paletteItems={paletteItems} 
          isOpen={isSidebarOpen} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          onDragStartItem={(item) => { draggedItemRef.current = item; }}
      />
      
      <div style={{ flexGrow: 1, height: '100%', position: 'relative', overflow: 'hidden' }} ref={reactFlowWrapper}>
        <ReactFlowProvider>
          <ReactFlow 
            nodes={localNodes} 
            edges={flowEdges} 
            nodeTypes={nodeTypes} 
            edgeTypes={edgeTypes} 
            isValidConnection={isValidConnection} 
            onInit={setReactFlowInstance} 
            onDrop={onDrop} 
            onDragOver={onDragOver} 
            onConnect={onConnect} 
            onEdgeUpdate={onEdgeUpdate}
            onNodesChange={onNodesChange} 
            onNodeDragStop={onNodeDragStop} 
            onNodeClick={onNodeClick} 
            onEdgeClick={onEdgeClick}
            onNodesDelete={onNodesDelete} 
            onEdgesDelete={onEdgesDelete}
            onNodeContextMenu={onNodeContextMenu} 
            onEdgeContextMenu={onEdgeContextMenu} 
            onPaneClick={onPaneClick}
            connectionMode={ConnectionMode.Loose} 
            snapToGrid={snapEnabled}
            snapGrid={snapGrid}
          >
            <Background gap={snapPixels} />
            <Controls />
          </ReactFlow>
        </ReactFlowProvider>

        {contextMenu && (
            <div style={{
                position: 'absolute', top: contextMenu.top, left: contextMenu.left, zIndex: 10,
                backgroundColor: 'var(--neutral-20)', border: '1px solid var(--neutral-50)',
                borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', padding: '5px', minWidth: '150px'
            }}>
                <div style={{ padding: '8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('adjust')}>⚙️ Adjust</div>
                <div style={{ padding: '8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('copy')}>📋 Copy</div>
                
                {contextMenu.type === 'edge' && (
                    <>
                        <div style={{ padding: '8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('toggleArrow')}>
                            {rawEdgesDict[contextMenu.id]?.arrow !== false ? '❌ Remove Arrow' : '➡️ Add Arrow'}
                        </div>
                        {/* <-- ADDED: Toggle Label UI Button */}
                        <div style={{ padding: '8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('toggleLabel')}>
                            {rawEdgesDict[contextMenu.id]?.showLabel !== false ? '👁️ Hide Label' : '👁️ Show Label'}
                        </div>
                        <div style={{ borderTop: '1px solid var(--neutral-40)', margin: '4px 0' }} />
                        <div 
                            style={{ padding: '8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', backgroundColor: activeSubMenu === 'lineType' ? 'var(--neutral-30)' : 'transparent' }}
                            onMouseEnter={() => setActiveSubMenu('lineType')}
                        >
                            <span>〰️ Line Type</span><span>▶</span>
                        </div>
                        <div 
                            style={{ padding: '8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', backgroundColor: activeSubMenu === 'connectionType' ? 'var(--neutral-30)' : 'transparent' }}
                            onMouseEnter={() => setActiveSubMenu('connectionType')}
                        >
                            <span>🔗 Connection</span><span>▶</span>
                        </div>
                    </>
                )}

                <div style={{ padding: '8px', cursor: 'pointer', color: 'var(--error)', borderTop: '1px solid var(--neutral-40)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('delete')}>🗑️ Delete</div>

                {/* <-- Adjusted 'top' values below to account for the new height of the Context Menu --> */}
                {activeSubMenu === 'lineType' && (
                    <div style={{
                        position: 'absolute', top: '141px', left: '100%', marginLeft: '2px',
                        backgroundColor: 'var(--neutral-20)', border: '1px solid var(--neutral-50)',
                        borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', padding: '5px', minWidth: '130px'
                    }}>
                        <div style={{ padding: '8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onClick={() => handleLineTypeChange('smoothstep')}>〰️ Smooth {currentLineType === 'smoothstep' && '✓'}</div>
                        <div style={{ padding: '8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onClick={() => handleLineTypeChange('step')}>🔲 Stepped {currentLineType === 'step' && '✓'}</div>
                        <div style={{ padding: '8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onClick={() => handleLineTypeChange('straight')}>📏 Straight {currentLineType === 'straight' && '✓'}</div>
                        <div style={{ padding: '8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onClick={() => handleLineTypeChange('default')}>➰ Bezier {currentLineType === 'default' && '✓'}</div>
                    </div>
                )}

                {activeSubMenu === 'connectionType' && (
                    <div style={{
                        position: 'absolute', top: '176px', left: '100%', marginLeft: '2px',
                        backgroundColor: 'var(--neutral-20)', border: '1px solid var(--neutral-50)',
                        borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', padding: '5px', minWidth: '150px'
                    }}>
                        {availableConnections.length === 0 ? (
                            <div style={{ padding: '8px', color: 'var(--neutral-60)' }}>No valid connections</div>
                        ) : (
                            availableConnections.map(c => (
                                <div key={c} style={{ padding: '8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onClick={() => handleConnectionTypeChange(c)}>
                                    <span style={{ color: connectionTypes[c]?.color || 'var(--neutral-90)' }}>●</span> {connectionTypes[c]?.label || c} {currentConnectionType === c && '✓'}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
});