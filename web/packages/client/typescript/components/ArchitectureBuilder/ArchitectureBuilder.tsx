import * as React from 'react';
import { ComponentProps } from '@inductiveautomation/perspective-client';
import { observer } from 'mobx-react';
// @ts-ignore
import ReactFlow, { ReactFlowProvider, Background, Controls, ConnectionMode, Edge, Connection, applyNodeChanges, NodeChange, MarkerType, BaseEdge, getSmoothStepPath, getBezierPath, getStraightPath, EdgeLabelRenderer } from 'reactflow';
import 'reactflow/dist/style.css';
import { Sidebar, PaletteItem } from './Sidebar';
import { ArchitectureNode } from './ArchitectureNode';
import { ContainerNode } from './ContainerNode';

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

const mapIgnitionToReactFlowNodes = (ignitionNodes: any, handleGearClick: (id: string) => void, handleResizeEnd: (id: string, x: number, y: number, w: number, h: number) => void, selectedId: string | null, globalHideHandles: boolean) => {
    if (!ignitionNodes) return [];
    return Object.entries(ignitionNodes).filter(([id, nodeData]: any) => nodeData !== null && nodeData !== undefined).map(([id, nodeData]: any) => { 
        const isContainer = nodeData.paletteId === 'container';
        return { 
            id, type: isContainer ? 'container' : 'architecture', selected: id === selectedId, 
            position: { x: nodeData.x || 0, y: nodeData.y || 0 }, 
            zIndex: nodeData.zIndex ?? (isContainer ? -1 : 10),
            style: isContainer ? { width: nodeData.width || 300, height: nodeData.height || 300 } : undefined, 
            data: { 
                label: nodeData.label || 'Unknown', svg: nodeData.svg || '', tooltip: nodeData.tooltip || '', configs: nodeData.configs || {}, 
                style: nodeData.style || {}, paletteId: nodeData.paletteId || 'unknown', hideHandles: nodeData.hideHandles, globalHideHandles: globalHideHandles, onGearClick: handleGearClick, onResizeEnd: isContainer ? handleResizeEnd : undefined 
            } 
        }; 
    });
};

const mapIgnitionToReactFlowEdges = (ignitionEdges: any, connectionTypes: any, selectedId: string | null) => {
    if (!ignitionEdges) return [];
    return Object.entries(ignitionEdges).filter(([id, edgeData]: any) => edgeData !== null && edgeData !== undefined).map(([id, edgeData]: any) => { const typeConfig = connectionTypes[edgeData.connectionType] || {}; const isSelected = id === selectedId; const strokeStyle: any = { stroke: typeConfig.color || '#888', strokeWidth: isSelected ? 5 : 3 }; if (edgeData.dashed) strokeStyle.strokeDasharray = '8 5'; const arrowMarker = edgeData.arrow !== false ? { type: MarkerType.ArrowClosed, width: 20, height: 20, color: strokeStyle.stroke } : undefined; return { id, ...edgeData, type: 'custom', data: { lineType: edgeData.lineType || 'smoothstep', offsetX: edgeData.offsetX || 0, offsetY: edgeData.offsetY || 0, showLabel: edgeData.showLabel === true }, label: typeConfig.label || edgeData.connectionType || '', style: strokeStyle, markerEnd: arrowMarker, interactionWidth: 20, updatable: true }; });
};

const getNodesInside = (containerId: string, allNodes: any): string[] => {
    const container = allNodes[containerId];
    if (!container) return [];
    
    const cx1 = container.x;
    const cy1 = container.y;
    const cx2 = container.x + (container.width || 300);
    const cy2 = container.y + (container.height || 300);

    let inside: string[] = [];
    Object.keys(allNodes).forEach(id => {
        if (id === containerId) return;
        const node = allNodes[id];
        if (!node) return;
        
        const nx = node.x;
        const ny = node.y;
        const nw = node.paletteId === 'container' ? (node.width || 300) : 120;
        const nh = node.paletteId === 'container' ? (node.height || 300) : 120;
        
        const cx = nx + nw / 2;
        const cy = ny + nh / 2;
        
        if (cx >= cx1 && cx <= cx2 && cy >= cy1 && cy <= cy2) inside.push(id);
    });
    return inside;
};

export interface ArchitectureBuilderProps { hideHandles?: any; snapEnabled?: any; snapPixels?: any; style?: any; connectionTypes: any; paletteItems: any[]; nodes: any; edges: any; }

export const ArchitectureBuilder = observer((props: ComponentProps<ArchitectureBuilderProps>) => {
  const reactFlowWrapper = React.useRef<HTMLDivElement>(null);
  const clipboardRef = React.useRef<any>(null);
  const updatingEdgeRef = React.useRef<string | null>(null); 
  const dragStartPos = React.useRef<any>(null); 
  
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  
  const [contextMenu, setContextMenu] = React.useState<{ id: string, top: number, left: number, type: 'node' | 'edge' | 'pane', clientX?: number, clientY?: number, isContainer?: boolean } | null>(null);
  const [activeSubMenu, setActiveSubMenu] = React.useState<'lineType' | 'connectionType' | 'swapNode' | null>(null); 
  
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
  }, [selectedId, rawNodesDict, snapEnabled, snapPixels, props.store, executeCopy, executePaste]);

  const handleGearClick = React.useCallback((id: string) => {
      setSelectedId(id); 
      const node = rawNodesDict[id];
      if (props.componentEvents && node) {
          props.componentEvents.fireComponentEvent('onGearClick', { id, paletteId: node.paletteId, type: 'node', action: 'config' });
      }
  }, [props.componentEvents, rawNodesDict]);

  // <-- CHANGED: Capture the new X and Y from the Resizer component and save to Ignition
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

  const flowNodes = React.useMemo(() => mapIgnitionToReactFlowNodes(rawNodesDict, handleGearClick, handleResizeEnd, selectedId, globalHideHandles), [rawNodesDict, handleGearClick, handleResizeEnd, selectedId, globalHideHandles]);
  const flowEdges = React.useMemo(() => mapIgnitionToReactFlowEdges(rawEdgesDict, connectionTypes, selectedId), [rawEdgesDict, connectionTypes, selectedId]);

  React.useEffect(() => { setLocalNodes(flowNodes); }, [flowNodes]);

  // <-- CHANGED: Cleaned out the dimensions math loop because handleResizeEnd covers it perfectly!
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
      const selectedType = validTypes[0];
      const typeDef = connectionTypes[selectedType] || {};

      if (props.store?.props) {
          props.store.props.write('edges', { ...rawEdgesDict, [generateShortId()]: { ...connectionParams, lineType: 'smoothstep', dashed: false, arrow: typeDef.arrow !== false, showLabel: false, connectionType: selectedType, offsetX: 0, offsetY: 0 } });
      }
  }, [props.store, rawEdgesDict, getValidIntersection, connectionTypes]);

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
      if (rawNodesDict[node.id]?.paletteId === 'container') {
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
      if (bounds) { setContextMenu({ id: node.id, top: event.clientY - bounds.top, left: event.clientX - bounds.left, type: 'node', isContainer }); setActiveSubMenu(null); }
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

  const closeContextMenu = React.useCallback(() => { setContextMenu(null); setActiveSubMenu(null); }, []);

  const handleContextMenuAction = (action: string) => {
      if (!contextMenu) return;
      const isNode = contextMenu.type === 'node';
      const isEdge = contextMenu.type === 'edge';
      
      let currentPaletteId = 'pane';
      if (isNode) currentPaletteId = rawNodesDict[contextMenu.id]?.paletteId;
      if (isEdge) currentPaletteId = rawEdgesDict[contextMenu.id]?.connectionType;

      if (props.componentEvents) { props.componentEvents.fireComponentEvent('onContextMenuAction', { id: contextMenu.id, paletteId: currentPaletteId, type: contextMenu.type, action: action }); }

      if (action === 'copy' && isNode) {
          executeCopy(contextMenu.id);
          closeContextMenu(); return;
      }

      if (action === 'paste' && contextMenu.type === 'pane') {
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

      if ((action === 'bringForward' || action === 'sendBackward') && isNode) {
          if (props.store?.props) {
              const nextNodes = { ...rawNodesDict };
              const currentZ = nextNodes[contextMenu.id].zIndex ?? -1;
              nextNodes[contextMenu.id].zIndex = action === 'bringForward' ? currentZ + 1 : currentZ - 1;
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
      closeContextMenu();
  };

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
    const initialConfigs = paletteItem.defaultConfigs || paletteItem.configs || {};
    
    if (props.store?.props) {
        const newNodeId = generateShortId();
        const newNodeData: any = { 
            paletteId: paletteItem.id, label: paletteItem.label, svg: paletteItem.svg, tooltip: paletteItem.tooltip, 
            x: dropX, y: dropY, 
            hideHandles: false, style: paletteItem.style || { classes: "" }, configs: initialConfigs, supportedConnections: paletteItem.supportedConnections || [] 
        };
        
        if (paletteItem.id === 'container') {
            newNodeData.width = 300;
            newNodeData.height = 300;
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

  return (
    <div {...props.emit()} style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: 'var(--neutral-00)' }} tabIndex={0}>
      <Sidebar paletteItems={paletteItems} isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onDragStartItem={(item) => { draggedItemRef.current = item; }} />
      
      <div style={{ flexGrow: 1, height: '100%', position: 'relative', overflow: 'hidden' }} ref={reactFlowWrapper}>
        <ReactFlowProvider>
          <ReactFlow 
            nodes={localNodes} edges={flowEdges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} 
            isValidConnection={isValidConnection} onInit={setReactFlowInstance} 
            onDrop={onDrop} onDragOver={onDragOver} onConnect={onConnect} onEdgeUpdate={onEdgeUpdate}
            onEdgeUpdateStart={(event: any, edge: any) => { updatingEdgeRef.current = edge?.id || null; }}
            onEdgeUpdateEnd={() => { updatingEdgeRef.current = null; }}
            onNodeDragStart={onNodeDragStart} onNodeDrag={onNodeDrag} onNodeDragStop={onNodeDragStop} 
            onNodesChange={onNodesChange} 
            onNodeClick={onNodeClick} onEdgeClick={onEdgeClick}
            onNodesDelete={onNodesDelete} onEdgesDelete={onEdgesDelete}
            onNodeContextMenu={onNodeContextMenu} onEdgeContextMenu={onEdgeContextMenu} 
            onPaneClick={onPaneClick} onPaneContextMenu={onPaneContextMenu}
            connectionMode={ConnectionMode.Loose} snapToGrid={snapEnabled} snapGrid={snapGrid}
          >
            <Background gap={snapPixels} />
            <Controls />
          </ReactFlow>
        </ReactFlowProvider>

        {contextMenu && (
            <div style={{ position: 'absolute', top: contextMenu.top, left: contextMenu.left, zIndex: 10, backgroundColor: 'var(--neutral-20)', border: '1px solid var(--neutral-50)', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', padding: '4px', minWidth: '140px', fontSize: '12px' }}>
                
                {contextMenu.type === 'pane' && ( 
                    <div style={{ padding: '5px 8px', cursor: clipboardRef.current ? 'pointer' : 'not-allowed', color: clipboardRef.current ? 'var(--neutral-90)' : 'var(--neutral-50)' }} onClick={() => { if(clipboardRef.current) handleContextMenuAction('paste'); }}> 
                        📋 Paste 
                    </div> 
                )}
                
                {contextMenu.type !== 'pane' && (
                    <>
                        <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('adjust')}>⚙️ Adjust</div>
                        
                        {contextMenu.type === 'node' && ( 
                            <>
                                <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('copy')}>📋 Copy</div> 
                                
                                {contextMenu.isContainer && (
                                    <>
                                        <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('bringForward')}>🔼 Bring Forward</div> 
                                        <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('sendBackward')}>🔽 Send Backward</div> 
                                    </>
                                )}

                                {validSwapItems.length > 0 && (
                                    <div style={{ position: 'relative' }} onMouseEnter={() => setActiveSubMenu('swapNode')}>
                                        <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', backgroundColor: activeSubMenu === 'swapNode' ? 'var(--neutral-30)' : 'transparent' }}> 
                                            <span>🔄 Swap Node</span><span>▶</span> 
                                        </div>
                                        {activeSubMenu === 'swapNode' && (
                                            <div style={{ position: 'absolute', top: '-4px', left: '100%', marginLeft: '4px', backgroundColor: 'var(--neutral-20)', border: '1px solid var(--neutral-50)', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', padding: '4px', minWidth: '150px' }}>
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
                                <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('toggleArrow')}> 
                                    {rawEdgesDict[contextMenu.id]?.arrow !== false ? '❌ Remove Arrow' : '➡️ Add Arrow'} 
                                </div>
                                <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onMouseEnter={() => setActiveSubMenu(null)} onClick={() => handleContextMenuAction('toggleLabel')}> 
                                    {rawEdgesDict[contextMenu.id]?.showLabel === true ? '👁️ Hide Label' : '👁️ Show Label'} 
                                </div>
                                <div style={{ borderTop: '1px solid var(--neutral-40)', margin: '4px 0' }} />
                                <div style={{ position: 'relative' }} onMouseEnter={() => setActiveSubMenu('lineType')}>
                                    <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', backgroundColor: activeSubMenu === 'lineType' ? 'var(--neutral-30)' : 'transparent' }}> 
                                        <span>〰️ Line Type</span><span>▶</span> 
                                    </div>
                                    {activeSubMenu === 'lineType' && (
                                        <div style={{ position: 'absolute', top: '-4px', left: '100%', marginLeft: '4px', backgroundColor: 'var(--neutral-20)', border: '1px solid var(--neutral-50)', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', padding: '4px', minWidth: '120px' }}>
                                            <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onClick={() => handleLineTypeChange('smoothstep')}>〰️ Smooth {currentLineType === 'smoothstep' && '✓'}</div>
                                            <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onClick={() => handleLineTypeChange('step')}>🔲 Stepped {currentLineType === 'step' && '✓'}</div>
                                            <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onClick={() => handleLineTypeChange('straight')}>📏 Straight {currentLineType === 'straight' && '✓'}</div>
                                            <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onClick={() => handleLineTypeChange('default')}>➰ Bezier {currentLineType === 'default' && '✓'}</div>
                                        </div>
                                    )}
                                </div>
                                <div style={{ position: 'relative' }} onMouseEnter={() => setActiveSubMenu('connectionType')}>
                                    <div style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)', display: 'flex', justifyContent: 'space-between', backgroundColor: activeSubMenu === 'connectionType' ? 'var(--neutral-30)' : 'transparent' }}> 
                                        <span>🔗 Connection</span><span>▶</span> 
                                    </div>
                                    {activeSubMenu === 'connectionType' && (
                                        <div style={{ position: 'absolute', top: '-4px', left: '100%', marginLeft: '4px', backgroundColor: 'var(--neutral-20)', border: '1px solid var(--neutral-50)', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', padding: '4px', minWidth: '140px' }}>
                                            {availableConnections.length === 0 ? ( 
                                                <div style={{ padding: '5px 8px', color: 'var(--neutral-60)' }}>No valid connections</div> 
                                            ) : ( 
                                                availableConnections.map(c => ( 
                                                    <div key={c} style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--neutral-90)' }} onClick={() => handleConnectionTypeChange(c)}> 
                                                        <span style={{ color: connectionTypes[c]?.color || 'var(--neutral-90)' }}>●</span> {connectionTypes[c]?.label || c} {currentConnectionType === c && '✓'} 
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
  );
});