import * as React from 'react';
// @ts-ignore
import { Edge, Connection, NodeChange, applyNodeChanges } from 'reactflow';
import { getHandlePixelPos, computeAutoWaypoints } from './EdgeUtils';

const generateShortId = () => 'I' + Math.random().toString(16).substring(2, 10);

const getNodesInside = (containerId: string, allNodes: any): string[] => {
    const container = allNodes[containerId];
    if (!container) return [];
    const cWidth = container.width || 300;
    const cHeight = container.height || 300;
    const cx1 = container.x, cy1 = container.y;
    const cx2 = cx1 + cWidth, cy2 = cy1 + cHeight;
    const inside: string[] = [];
    Object.keys(allNodes).forEach(id => {
        if (id === containerId) return;
        const node = allNodes[id];
        if (!node) return;
        const nw = node.paletteId === 'container' ? (node.width || 300) : 150;
        const nh = node.paletteId === 'container' ? (node.height || 300) : 150;
        if (nw >= cWidth || nh >= cHeight) return;
        if (node.x >= cx1 && node.y >= cy1 && node.x + nw <= cx2 && node.y + nh <= cy2) inside.push(id);
    });
    return inside;
};

export interface UseArchitectureFlowHandlersParams {
    store: any;
    componentEvents: any;
    rawNodesDict: any;
    rawEdgesDict: any;
    connectionTypes: any;
    globalHandleCount: number;
    globalDefaultConnectionType: string;
    paletteItems: any[];
    snapEnabled: boolean;
    snapPixels: number;
    reactFlowInstance: any;
    reactFlowWrapper: React.RefObject<HTMLDivElement>;
    isEnabled: boolean;
    selectedId: string | null;
    setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
    setLocalNodes: React.Dispatch<React.SetStateAction<any[]>>;
    contextMenu: any;
    setContextMenu: React.Dispatch<React.SetStateAction<any>>;
    setActiveSubMenu: React.Dispatch<React.SetStateAction<any>>;
    setStyleEditorNodeId: React.Dispatch<React.SetStateAction<string | null>>;
    clipboardRef: React.MutableRefObject<any>;
    draggedItemRef: React.MutableRefObject<any>;
}

export const useArchitectureFlowHandlers = ({
    store,
    componentEvents,
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
    contextMenu,
    setContextMenu,
    setActiveSubMenu,
    setStyleEditorNodeId,
    clipboardRef,
    draggedItemRef,
}: UseArchitectureFlowHandlersParams) => {
    const [isUpdatingEdge, setIsUpdatingEdge] = React.useState(false);
    const [isConnecting, setIsConnecting] = React.useState(false);
    const updatingEdgeRef = React.useRef<string | null>(null);
    const dragStartPos = React.useRef<any>(null);

    const closeContextMenu = React.useCallback(() => {
        setContextMenu(null);
        setActiveSubMenu(null);
    }, [setContextMenu, setActiveSubMenu]);

    // ─── Validation ──────────────────────────────────────────────────────────

    const getValidIntersection = React.useCallback((sourceId: string, targetId: string, ignoreEdgeId?: string): string[] => {
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
                    return (e.source === sourceId && e.target === targetId && e.connectionType === connType) ||
                           (e.source === targetId && e.target === sourceId && e.connectionType === connType);
                });
                return !edgeExists;
            }
            return true;
        });
        return intersection;
    }, [rawNodesDict, rawEdgesDict, connectionTypes]);

    const isValidConnection = React.useCallback((connection: any) => {
        return getValidIntersection(connection.source, connection.target, updatingEdgeRef.current || undefined).length > 0;
    }, [getValidIntersection]);

    // ─── Edge handlers ───────────────────────────────────────────────────────

    const handleWaypointsChange = React.useCallback((edgeId: string, waypoints: { x: number; y: number }[]) => {
        if (!store?.props) return;
        const nextEdges = { ...rawEdgesDict };
        if (nextEdges[edgeId]) {
            nextEdges[edgeId] = { ...nextEdges[edgeId], waypoints };
            store.props.write('edges', nextEdges);
        }
    }, [store, rawEdgesDict]);

    const onConnect = React.useCallback((connectionParams: any) => {
        const validTypes = getValidIntersection(connectionParams.source, connectionParams.target);
        if (validTypes.length === 0) return;
        let selectedType = validTypes[0];
        if (globalDefaultConnectionType && validTypes.includes(globalDefaultConnectionType)) selectedType = globalDefaultConnectionType;
        const typeDef = connectionTypes[selectedType] || {};
        if (store?.props) {
            const src = getHandlePixelPos(connectionParams.source, connectionParams.sourceHandle || '', rawNodesDict, globalHandleCount);
            const tgt = getHandlePixelPos(connectionParams.target, connectionParams.targetHandle || '', rawNodesDict, globalHandleCount);
            const waypoints = src && tgt ? computeAutoWaypoints(src.x, src.y, src.position, tgt.x, tgt.y, tgt.position) : [];
            store.props.write('edges', {
                ...rawEdgesDict,
                [generateShortId()]: { ...connectionParams, lineType: 'smoothstep', dashed: false, arrow: typeDef.arrow !== false, showLabel: false, connectionType: selectedType, waypoints },
            });
        }
    }, [store, rawEdgesDict, rawNodesDict, globalHandleCount, getValidIntersection, connectionTypes, globalDefaultConnectionType]);

    const onEdgeUpdate = React.useCallback((oldEdge: Edge, newConnection: Connection) => {
        if (!newConnection.source || !newConnection.target) return;
        const validTypes = getValidIntersection(newConnection.source, newConnection.target, oldEdge.id);
        if (validTypes.length === 0) return;
        if (store?.props) {
            const nextEdges = { ...rawEdgesDict };
            const oldData = nextEdges[oldEdge.id];
            if (!validTypes.includes(oldData.connectionType)) return;
            const src = getHandlePixelPos(newConnection.source, newConnection.sourceHandle || '', rawNodesDict, globalHandleCount);
            const tgt = getHandlePixelPos(newConnection.target, newConnection.targetHandle || '', rawNodesDict, globalHandleCount);
            const waypoints = src && tgt ? computeAutoWaypoints(src.x, src.y, src.position, tgt.x, tgt.y, tgt.position) : [];
            nextEdges[oldEdge.id] = { ...oldData, source: newConnection.source, target: newConnection.target, sourceHandle: newConnection.sourceHandle, targetHandle: newConnection.targetHandle, waypoints };
            store.props.write('edges', nextEdges);
        }
    }, [store, rawEdgesDict, rawNodesDict, globalHandleCount, getValidIntersection]);

    const onEdgeUpdateStart = React.useCallback((event: any, edge: any) => {
        updatingEdgeRef.current = edge?.id || null;
        setIsUpdatingEdge(true);
    }, []);

    const onEdgeUpdateEnd = React.useCallback(() => {
        updatingEdgeRef.current = null;
        setIsUpdatingEdge(false);
    }, []);

    const onConnectStart = React.useCallback(() => setIsConnecting(true), []);
    const onConnectEnd = React.useCallback(() => setIsConnecting(false), []);

    const onEdgesDelete = React.useCallback((deleted: Edge[]) => {
        if (!store?.props) return;
        const nextEdges = { ...rawEdgesDict };
        deleted.forEach(e => { delete nextEdges[e.id]; if (e.id === selectedId) setSelectedId(null); });
        store.props.write('edges', nextEdges);
    }, [store, rawEdgesDict, selectedId, setSelectedId]);

    const onEdgeContextMenu = React.useCallback((event: any, edge: any) => {
        event.preventDefault();
        setSelectedId(edge.id);
        const bounds = reactFlowWrapper.current?.getBoundingClientRect();
        if (bounds) {
            setContextMenu({ id: edge.id, top: event.clientY - bounds.top, left: event.clientX - bounds.left, type: 'edge' });
            setActiveSubMenu(null);
        }
    }, [reactFlowWrapper, setSelectedId, setContextMenu, setActiveSubMenu]);

    const onEdgeClick = React.useCallback((event: any, edge: any) => {
        setSelectedId(edge.id);
        const rawEdge = rawEdgesDict[edge.id];
        if (componentEvents) componentEvents.fireComponentEvent('onEdgeClick', { id: edge.id, paletteId: rawEdge?.connectionType, type: 'edge' });
    }, [componentEvents, rawEdgesDict, setSelectedId]);

    const handleLineTypeChange = React.useCallback((newLineType: string) => {
        if (!contextMenu || contextMenu.type !== 'edge') return;
        if (componentEvents) componentEvents.fireComponentEvent('onContextMenuAction', { id: contextMenu.id, paletteId: rawEdgesDict[contextMenu.id]?.connectionType, type: contextMenu.type, action: `lineType:${newLineType}` });
        if (store?.props) {
            const nextEdges = { ...rawEdgesDict };
            if (nextEdges[contextMenu.id]) { nextEdges[contextMenu.id].lineType = newLineType; store.props.write('edges', nextEdges); }
        }
        closeContextMenu();
    }, [contextMenu, componentEvents, rawEdgesDict, store, closeContextMenu]);

    const handleConnectionTypeChange = React.useCallback((newConnectionType: string) => {
        if (!contextMenu || contextMenu.type !== 'edge') return;
        if (componentEvents) componentEvents.fireComponentEvent('onContextMenuAction', { id: contextMenu.id, paletteId: rawEdgesDict[contextMenu.id]?.connectionType, type: contextMenu.type, action: `connectionType:${newConnectionType}` });
        if (store?.props) {
            const nextEdges = { ...rawEdgesDict };
            if (nextEdges[contextMenu.id]) {
                const typeDef = connectionTypes[newConnectionType] || {};
                nextEdges[contextMenu.id].connectionType = newConnectionType;
                nextEdges[contextMenu.id].arrow = typeDef.arrow !== false;
                store.props.write('edges', nextEdges);
            }
        }
        closeContextMenu();
    }, [contextMenu, componentEvents, rawEdgesDict, connectionTypes, store, closeContextMenu]);

    // ─── Node handlers ───────────────────────────────────────────────────────

    const handleGearClick = React.useCallback((id: string) => {
        setSelectedId(id);
        const node = rawNodesDict[id];
        if (componentEvents && node) {
            componentEvents.fireComponentEvent('onGearClick', { id, paletteId: node.paletteId, typeId: node.typeId, type: 'node', action: 'config' });
        }
    }, [componentEvents, rawNodesDict, setSelectedId]);

    const handlePaletteItemClick = React.useCallback((item: any) => {
        if (componentEvents) {
            componentEvents.fireComponentEvent('onPaletteItemClick', { id: item.id, typeId: item.typeId, label: item.label, category: item.category, tooltip: item.tooltip, b64Image: item.b64Image, supportedConnections: item.supportedConnections, swappableWith: item.swappableWith, defaultConfigs: item.defaultConfigs, hideHandles: item.hideHandles, style: item.style, labelStyle: item.labelStyle });
        }
    }, [componentEvents]);

    const handleResizeEnd = React.useCallback((id: string, x: number, y: number, width: number, height: number) => {
        if (store?.props) {
            const nextNodes = { ...rawNodesDict };
            if (nextNodes[id]) {
                nextNodes[id].x = Math.round(x);
                nextNodes[id].y = Math.round(y);
                nextNodes[id].width = Math.round(width);
                nextNodes[id].height = Math.round(height);
                store.props.write('nodes', nextNodes);
            }
        }
    }, [store, rawNodesDict]);

    const handleTextChange = React.useCallback((id: string, text: string) => {
        if (store?.props) {
            const nextNodes = { ...rawNodesDict };
            if (nextNodes[id]) {
                nextNodes[id] = { ...nextNodes[id], text };
                store.props.write('nodes', nextNodes);
            }
        }
    }, [store, rawNodesDict]);

    const onNodesChange = React.useCallback((changes: NodeChange[]) => {
        setLocalNodes((nds) => applyNodeChanges(changes, nds));
    }, [setLocalNodes]);

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
    }, [rawNodesDict, setLocalNodes]);

    const onNodeDragStop = React.useCallback((event: any, node: any) => {
        if (store?.props) {
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
            store.props.write('nodes', nextNodes);
            dragStartPos.current = null;
        }
    }, [store, rawNodesDict]);

    const onNodesDelete = React.useCallback((deleted: any[]) => {
        if (!store?.props) return;
        const nextNodes = { ...rawNodesDict };
        const nextEdges = { ...rawEdgesDict };
        let edgesChanged = false;
        deleted.forEach(n => {
            delete nextNodes[n.id];
            if (n.id === selectedId) setSelectedId(null);
            Object.keys(nextEdges).forEach(edgeId => {
                if (nextEdges[edgeId].source === n.id || nextEdges[edgeId].target === n.id) { delete nextEdges[edgeId]; edgesChanged = true; }
            });
        });
        store.props.write('nodes', nextNodes);
        if (edgesChanged) store.props.write('edges', nextEdges);
    }, [store, rawNodesDict, rawEdgesDict, selectedId, setSelectedId]);

    const onNodeContextMenu = React.useCallback((event: any, node: any) => {
        event.preventDefault();
        setSelectedId(node.id);
        const bounds = reactFlowWrapper.current?.getBoundingClientRect();
        const isContainer = rawNodesDict[node.id]?.paletteId === 'container';
        if (bounds) {
            setContextMenu({ id: node.id, top: event.clientY - bounds.top, left: event.clientX - bounds.left, type: 'node', isContainer, clientX: event.clientX, clientY: event.clientY });
            setActiveSubMenu(null);
        }
    }, [rawNodesDict, reactFlowWrapper, setSelectedId, setContextMenu, setActiveSubMenu]);

    const onNodeClick = React.useCallback((event: any, node: any) => {
        setSelectedId(node.id);
        const rawNode = rawNodesDict[node.id];
        if (componentEvents) componentEvents.fireComponentEvent('onNodeClick', { id: node.id, paletteId: rawNode?.paletteId, typeId: rawNode?.typeId, type: 'node' });
    }, [componentEvents, rawNodesDict, setSelectedId]);

    // ─── Clipboard ───────────────────────────────────────────────────────────

    const executeCopy = React.useCallback((id: string) => {
        const isContainer = rawNodesDict[id]?.paletteId === 'container';
        if (isContainer) {
            const insideIds = getNodesInside(id, rawNodesDict);
            const copiedNodes: any = { [id]: rawNodesDict[id] };
            insideIds.forEach(childId => { copiedNodes[childId] = rawNodesDict[childId]; });
            const copiedEdges: any = {};
            Object.keys(rawEdgesDict).forEach(edgeId => {
                const edge = rawEdgesDict[edgeId];
                if (copiedNodes[edge.source] && copiedNodes[edge.target]) copiedEdges[edgeId] = edge;
            });
            clipboardRef.current = { type: 'group', nodes: copiedNodes, edges: copiedEdges };
        } else {
            clipboardRef.current = { type: 'single', node: rawNodesDict[id] };
        }
    }, [rawNodesDict, rawEdgesDict, clipboardRef]);

    const executePaste = React.useCallback((dropX: number, dropY: number) => {
        const clipboard = clipboardRef.current;
        if (!clipboard || !store?.props) return;
        const nextNodes = { ...rawNodesDict };
        const nextEdges = { ...rawEdgesDict };
        if (clipboard.type === 'single') {
            const newNodeId = generateShortId();
            nextNodes[newNodeId] = JSON.parse(JSON.stringify({ ...clipboard.node, x: dropX, y: dropY }));
            setSelectedId(newNodeId);
            clipboardRef.current = { type: 'single', node: nextNodes[newNodeId] };
        } else if (clipboard.type === 'group') {
            let minX = Infinity, minY = Infinity;
            Object.values(clipboard.nodes).forEach((n: any) => { if (n.x < minX) minX = n.x; if (n.y < minY) minY = n.y; });
            const dx = dropX - minX, dy = dropY - minY;
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
        store.props.write('nodes', nextNodes);
        store.props.write('edges', nextEdges);
    }, [store, rawNodesDict, rawEdgesDict, setSelectedId, clipboardRef]);

    // ─── Pane handlers ───────────────────────────────────────────────────────

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
        let dropX = Math.round(position.x), dropY = Math.round(position.y);
        if (snapEnabled) { dropX = Math.round(dropX / snapPixels) * snapPixels; dropY = Math.round(dropY / snapPixels) * snapPixels; }
        const initialConfigs = JSON.parse(JSON.stringify(paletteItem.defaultConfigs || {}));
        const initialStyle = JSON.parse(JSON.stringify(paletteItem.style || { classes: '' }));
        const initialLabelStyle = JSON.parse(JSON.stringify(paletteItem.labelStyle || { classes: '' }));
        if (store?.props) {
            const newNodeId = generateShortId();
            const newNodeData: any = {
                paletteId: paletteItem.id, typeId: paletteItem.typeId, label: paletteItem.label, b64Image: paletteItem.b64Image, tooltip: paletteItem.tooltip,
                x: dropX, y: dropY,
                hideHandles: paletteItem.hideHandles === true, style: initialStyle, labelStyle: initialLabelStyle, configs: initialConfigs, supportedConnections: paletteItem.supportedConnections || [],
            };
            if (paletteItem.id === 'container') { newNodeData.width = 300; newNodeData.height = 300; newNodeData.zIndex = -1; }
            const nextNodes = { ...rawNodesDict };
            nextNodes[newNodeId] = newNodeData;
            store.props.write('nodes', nextNodes);
            setSelectedId(newNodeId);
        }
        draggedItemRef.current = null;
    }, [store, rawNodesDict, snapEnabled, snapPixels, reactFlowInstance, setSelectedId, draggedItemRef]);

    const onPaneClick = React.useCallback(() => {
        setSelectedId(null);
        closeContextMenu();
    }, [setSelectedId, closeContextMenu]);

    const onPaneContextMenu = React.useCallback((event: any) => {
        event.preventDefault();
        const bounds = reactFlowWrapper.current?.getBoundingClientRect();
        if (bounds) {
            setContextMenu({ id: 'pane', top: event.clientY - bounds.top, left: event.clientX - bounds.left, type: 'pane', clientX: event.clientX, clientY: event.clientY });
            setActiveSubMenu(null);
        }
    }, [reactFlowWrapper, setContextMenu, setActiveSubMenu]);

    // ─── Context menu actions ─────────────────────────────────────────────────

    const handleNodeSwap = React.useCallback((newId: string) => {
        if (!contextMenu || contextMenu.type !== 'node') return;
        const newItem = paletteItems.find((p: any) => p.id === newId);
        if (!newItem) return;
        if (componentEvents) componentEvents.fireComponentEvent('onContextMenuAction', { id: contextMenu.id, paletteId: rawNodesDict[contextMenu.id]?.paletteId, type: contextMenu.type, action: `swapNode:${newId}` });
        if (store?.props) {
            const nextNodes = { ...rawNodesDict };
            const existingNode = nextNodes[contextMenu.id];
            nextNodes[contextMenu.id] = { ...existingNode, paletteId: newItem.id, typeId: newItem.typeId, label: newItem.label, b64Image: newItem.b64Image, tooltip: newItem.tooltip, supportedConnections: newItem.supportedConnections || [] };
            const nextEdges = { ...rawEdgesDict };
            let edgesChanged = false;
            Object.keys(nextEdges).forEach(edgeId => {
                const e = nextEdges[edgeId];
                if (e.source === contextMenu.id || e.target === contextMenu.id) {
                    const otherNodeId = e.source === contextMenu.id ? e.target : e.source;
                    const otherNode = nextNodes[otherNodeId];
                    if (otherNode) {
                        const newSupported = newItem.supportedConnections || [];
                        const otherSupported = otherNode.supportedConnections || [];
                        if (!newSupported.includes(e.connectionType) || !otherSupported.includes(e.connectionType)) { delete nextEdges[edgeId]; edgesChanged = true; }
                    }
                }
            });
            store.props.write('nodes', nextNodes);
            if (edgesChanged) store.props.write('edges', nextEdges);
        }
        closeContextMenu();
    }, [contextMenu, paletteItems, componentEvents, rawNodesDict, rawEdgesDict, store, closeContextMenu]);

    const handleContextMenuAction = React.useCallback((action: string) => {
        if (!contextMenu) return;
        const isNode = contextMenu.type === 'node';
        const isEdge = contextMenu.type === 'edge';
        let currentPaletteId = 'pane';
        if (isNode) currentPaletteId = rawNodesDict[contextMenu.id]?.paletteId;
        if (isEdge) currentPaletteId = rawEdgesDict[contextMenu.id]?.connectionType;
        if (componentEvents) componentEvents.fireComponentEvent('onContextMenuAction', { id: contextMenu.id, paletteId: currentPaletteId, type: contextMenu.type, action });

        if (action === 'reverseEdge' && isEdge) {
            if (store?.props) {
                const nextEdges = { ...rawEdgesDict };
                const currentEdge = nextEdges[contextMenu.id];
                if (currentEdge) {
                    nextEdges[contextMenu.id] = { ...currentEdge, source: currentEdge.target, target: currentEdge.source, sourceHandle: currentEdge.targetHandle, targetHandle: currentEdge.sourceHandle };
                    store.props.write('edges', nextEdges);
                }
            }
            closeContextMenu(); return;
        }

        if (action === 'editStyle' && isNode) { setStyleEditorNodeId(contextMenu.id); closeContextMenu(); return; }

        if (action === 'toggleGrayscale' && isNode) {
            if (store?.props) {
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
                                if (!nextNodes[otherNodeId]?.inactive) nextEdges[edgeId] = { ...edge, dashed: false };
                            }
                            edgesChanged = true;
                        }
                    });
                    store.props.write('nodes', nextNodes);
                    if (edgesChanged) store.props.write('edges', nextEdges);
                }
            }
            closeContextMenu(); return;
        }

        if (action === 'copy' && isNode) { executeCopy(contextMenu.id); closeContextMenu(); return; }

        if (action === 'toggleLink' && contextMenu.isContainer) {
            if (store?.props) {
                const nextNodes = { ...rawNodesDict };
                const target = nextNodes[contextMenu.id];
                if (target) { target.configs = { ...target.configs, unlinked: !target.configs?.unlinked }; store.props.write('nodes', nextNodes); }
            }
            closeContextMenu(); return;
        }

        if (action === 'paste' && (contextMenu.type === 'pane' || contextMenu.isContainer)) {
            if (reactFlowInstance && contextMenu.clientX && contextMenu.clientY) {
                const position = reactFlowInstance.screenToFlowPosition({ x: contextMenu.clientX, y: contextMenu.clientY });
                let dropX = position.x, dropY = position.y;
                if (snapEnabled) { dropX = Math.round(dropX / snapPixels) * snapPixels; dropY = Math.round(dropY / snapPixels) * snapPixels; }
                executePaste(dropX, dropY);
            }
            closeContextMenu(); return;
        }

        if (action === 'deleteWithContents' && isNode) {
            if (store?.props) {
                const nextNodes = { ...rawNodesDict };
                const nextEdges = { ...rawEdgesDict };
                let edgesChanged = false;
                const idsToDelete = [contextMenu.id, ...getNodesInside(contextMenu.id, rawNodesDict)];
                idsToDelete.forEach(idToDel => {
                    delete nextNodes[idToDel];
                    if (selectedId === idToDel) setSelectedId(null);
                    Object.keys(nextEdges).forEach(edgeId => {
                        if (nextEdges[edgeId].source === idToDel || nextEdges[edgeId].target === idToDel) { delete nextEdges[edgeId]; edgesChanged = true; }
                    });
                });
                store.props.write('nodes', nextNodes);
                if (edgesChanged) store.props.write('edges', nextEdges);
            }
            closeContextMenu(); return;
        }

        if (action === 'delete') {
            if (contextMenu.type === 'node') {
                if (store?.props) {
                    const nextNodes = { ...rawNodesDict };
                    const nextEdges = { ...rawEdgesDict };
                    let edgesChanged = false;
                    delete nextNodes[contextMenu.id];
                    Object.keys(nextEdges).forEach(edgeId => {
                        if (nextEdges[edgeId].source === contextMenu.id || nextEdges[edgeId].target === contextMenu.id) { delete nextEdges[edgeId]; edgesChanged = true; }
                    });
                    store.props.write('nodes', nextNodes);
                    if (edgesChanged) store.props.write('edges', nextEdges);
                    if (selectedId === contextMenu.id) setSelectedId(null);
                }
            } else if (contextMenu.type === 'edge') {
                if (store?.props) {
                    const nextEdges = { ...rawEdgesDict };
                    delete nextEdges[contextMenu.id];
                    store.props.write('edges', nextEdges);
                    if (selectedId === contextMenu.id) setSelectedId(null);
                }
            }
            closeContextMenu(); return;
        }

        if (['bringToFront', 'bringForward', 'sendBackward', 'sendToBack'].includes(action) && isNode) {
            if (store?.props) {
                const nextNodes = { ...rawNodesDict };
                const currentZ = nextNodes[contextMenu.id].zIndex ?? -1;
                if (action === 'bringForward') {
                    nextNodes[contextMenu.id].zIndex = Math.min(currentZ + 1, 999);
                } else if (action === 'sendBackward') {
                    nextNodes[contextMenu.id].zIndex = currentZ - 1;
                } else {
                    const containerZIndices = Object.values(nextNodes).filter((n: any) => n.paletteId === 'container').map((n: any) => n.zIndex ?? -1);
                    if (action === 'bringToFront') nextNodes[contextMenu.id].zIndex = Math.min(Math.max(...containerZIndices, -1) + 1, 999);
                    else if (action === 'sendToBack') nextNodes[contextMenu.id].zIndex = Math.min(...containerZIndices, -1) - 1;
                }
                store.props.write('nodes', nextNodes);
            }
            closeContextMenu(); return;
        }

        if (action === 'toggleArrow' && isEdge) {
            if (store?.props) { const nextEdges = { ...rawEdgesDict }; if (nextEdges[contextMenu.id]) { nextEdges[contextMenu.id].arrow = nextEdges[contextMenu.id].arrow === false ? true : false; store.props.write('edges', nextEdges); } }
            closeContextMenu(); return;
        }
        if (action === 'toggleLabel' && isEdge) {
            if (store?.props) { const nextEdges = { ...rawEdgesDict }; if (nextEdges[contextMenu.id]) { nextEdges[contextMenu.id].showLabel = nextEdges[contextMenu.id].showLabel !== true; store.props.write('edges', nextEdges); } }
            closeContextMenu(); return;
        }
        if (action === 'toggleDashed' && isEdge) {
            if (store?.props) { const nextEdges = { ...rawEdgesDict }; if (nextEdges[contextMenu.id]) { nextEdges[contextMenu.id].dashed = !nextEdges[contextMenu.id].dashed; store.props.write('edges', nextEdges); } }
            closeContextMenu(); return;
        }
        if (action === 'clearWaypoints' && isEdge) {
            if (store?.props) { const nextEdges = { ...rawEdgesDict }; if (nextEdges[contextMenu.id]) { nextEdges[contextMenu.id] = { ...nextEdges[contextMenu.id], waypoints: [] }; store.props.write('edges', nextEdges); } }
            closeContextMenu(); return;
        }

        closeContextMenu();
    }, [contextMenu, rawNodesDict, rawEdgesDict, selectedId, snapEnabled, snapPixels, reactFlowInstance, store, componentEvents, setStyleEditorNodeId, executeCopy, executePaste, closeContextMenu, setSelectedId]);

    return {
        // State
        isUpdatingEdge,
        isConnecting,
        updatingEdgeRef,
        // Shared
        closeContextMenu,
        getValidIntersection,
        // Edge
        isValidConnection,
        handleWaypointsChange,
        onConnect,
        onEdgeUpdate,
        onEdgeUpdateStart,
        onEdgeUpdateEnd,
        onConnectStart,
        onConnectEnd,
        onEdgesDelete,
        onEdgeContextMenu,
        onEdgeClick,
        handleLineTypeChange,
        handleConnectionTypeChange,
        // Node
        handleGearClick,
        handlePaletteItemClick,
        handleResizeEnd,
        handleTextChange,
        onNodesChange,
        onNodeDragStart,
        onNodeDrag,
        onNodeDragStop,
        onNodesDelete,
        onNodeContextMenu,
        onNodeClick,
        // Clipboard
        executeCopy,
        executePaste,
        // Pane
        onDragOver,
        onDrop,
        onPaneClick,
        onPaneContextMenu,
        // Context menu
        handleNodeSwap,
        handleContextMenuAction,
    };
};
