// @ts-ignore
import { MarkerType } from 'reactflow';

export const getHandlePixelPos = (
    nodeId: string,
    handleId: string,
    nodes: any,
    handleCount: number
): { x: number; y: number; position: string } | null => {
    const node = nodes[nodeId];
    if (!node || !handleId) return null;
    const parts = handleId.split('-');
    if (parts.length < 2) return null;
    const side = parts[0];
    const idx = parseInt(parts[1]);
    if (isNaN(idx)) return null;
    const pos = (idx + 0.5) / handleCount;
    const isContainer = node.paletteId === 'container';
    const nw = isContainer ? (node.width || 300) : 150;
    const nh = isContainer ? (node.height || 300) : 150;
    switch (side) {
        case 'top':    return { x: node.x + pos * nw, y: node.y,           position: 'top' };
        case 'bottom': return { x: node.x + pos * nw, y: node.y + nh,      position: 'bottom' };
        case 'left':   return { x: node.x,            y: node.y + pos * nh, position: 'left' };
        case 'right':  return { x: node.x + nw,       y: node.y + pos * nh, position: 'right' };
        default: return null;
    }
};

export const buildPolylinePath = (pts: { x: number; y: number }[], borderRadius: number): string => {
    if (pts.length < 2) return '';
    if (borderRadius === 0 || pts.length === 2)
        return `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length - 1; i++) {
        const prev = pts[i - 1], curr = pts[i], next = pts[i + 1];
        const d1 = Math.hypot(curr.x - prev.x, curr.y - prev.y);
        const d2 = Math.hypot(next.x - curr.x, next.y - curr.y);
        if (d1 === 0 || d2 === 0) { d += ` L ${curr.x} ${curr.y}`; continue; }
        const r = Math.min(borderRadius, d1 / 2, d2 / 2);
        const bx = curr.x + (prev.x - curr.x) * r / d1, by = curr.y + (prev.y - curr.y) * r / d1;
        const ax = curr.x + (next.x - curr.x) * r / d2, ay = curr.y + (next.y - curr.y) * r / d2;
        d += ` L ${bx} ${by} Q ${curr.x} ${curr.y} ${ax} ${ay}`;
    }
    return d + ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
};

const CLEARANCE = 25;

export const computeAutoWaypoints = (
    sx: number, sy: number, sp: string,
    tx: number, ty: number, tp: string
): { x: number; y: number }[] => {
    const isHorizSrc = sp === 'right' || sp === 'left';
    const isHorizTgt = tp === 'right' || tp === 'left';

    if (isHorizSrc && !isHorizTgt) {
        // Horizontal source → vertical target: L-shape when clear, 3-waypoint U when not.
        const srcOK = sp === 'right' ? tx >= sx + CLEARANCE : tx <= sx - CLEARANCE;
        const tgtOK = tp === 'top'   ? sy <= ty - CLEARANCE : sy >= ty + CLEARANCE;
        if (srcOK && tgtOK) return [{ x: tx, y: sy }];
        const ex = sp === 'right' ? sx + CLEARANCE : sx - CLEARANCE;
        const ey = tp === 'top'   ? ty - CLEARANCE : ty + CLEARANCE;
        return [{ x: ex, y: sy }, { x: ex, y: ey }, { x: tx, y: ey }];
    }

    if (!isHorizSrc && isHorizTgt) {
        // Vertical source → horizontal target: L-shape when clear, 3-waypoint U when not.
        const srcOK = sp === 'top'    ? ty <= sy - CLEARANCE : ty >= sy + CLEARANCE;
        const tgtOK = tp === 'right'  ? sx >= tx + CLEARANCE : sx <= tx - CLEARANCE;
        if (srcOK && tgtOK) return [{ x: sx, y: ty }];
        const ey = sp === 'top'   ? sy - CLEARANCE : sy + CLEARANCE;
        const ex = tp === 'right' ? tx + CLEARANCE : tx - CLEARANCE;
        return [{ x: sx, y: ey }, { x: ex, y: ey }, { x: ex, y: ty }];
    }

    if (isHorizSrc) {
        // Same horizontal axis: Z-shape when midX clears both handles, 4-waypoint U when not.
        const midX = (sx + tx) / 2;
        const srcOK = sp === 'right' ? midX >= sx + CLEARANCE : midX <= sx - CLEARANCE;
        const tgtOK = tp === 'left'  ? midX <= tx - CLEARANCE : midX >= tx + CLEARANCE;
        if (srcOK && tgtOK) return [{ x: midX, y: sy }, { x: midX, y: ty }];
        const ex = sp === 'right' ? sx + CLEARANCE : sx - CLEARANCE;
        const fx = tp === 'right' ? tx + CLEARANCE : tx - CLEARANCE;
        const midY = (sy + ty) / 2;
        return [{ x: ex, y: sy }, { x: ex, y: midY }, { x: fx, y: midY }, { x: fx, y: ty }];
    }

    // Same vertical axis: Z-shape when midY clears both handles, 4-waypoint U when not.
    const midY = (sy + ty) / 2;
    const srcOK = sp === 'top'    ? midY <= sy - CLEARANCE : midY >= sy + CLEARANCE;
    const tgtOK = tp === 'bottom' ? midY >= ty + CLEARANCE : midY <= ty - CLEARANCE;
    if (srcOK && tgtOK) return [{ x: sx, y: midY }, { x: tx, y: midY }];
    const ey = sp === 'top'    ? sy - CLEARANCE : sy + CLEARANCE;
    const fy = tp === 'top'    ? ty - CLEARANCE : ty + CLEARANCE;
    const midX = (sx + tx) / 2;
    return [{ x: sx, y: ey }, { x: midX, y: ey }, { x: midX, y: fy }, { x: tx, y: fy }];
};

export const mapIgnitionToReactFlowEdges = (
    ignitionEdges: any,
    connectionTypes: any,
    selectedId: string | null,
    onWaypointsChange?: (id: string, wps: { x: number; y: number }[]) => void,
    snapEnabled?: boolean,
    snapPixels?: number,
    globalEdgeWidth?: number
) => {
    const baseWidth = globalEdgeWidth ?? 6;
    if (!ignitionEdges) return [];
    return Object.entries(ignitionEdges)
        .filter(([, edgeData]: any) => edgeData !== null && edgeData !== undefined)
        .map(([id, edgeData]: any) => {
            const typeConfig = connectionTypes[edgeData.connectionType] || {};
            const isSelected = id === selectedId;
            const strokeStyle: any = { stroke: typeConfig.color || '#888', strokeWidth: isSelected ? baseWidth + 2 : baseWidth };
            if (edgeData.dashed) strokeStyle.strokeDasharray = '8 5';
            const arrowMarker = edgeData.arrow !== false
                ? { type: MarkerType.ArrowClosed, width: 10, height: 10, color: strokeStyle.stroke }
                : undefined;
            return {
                id, ...edgeData,
                type: 'custom',
                data: {
                    lineType: edgeData.lineType || 'smoothstep',
                    waypoints: edgeData.waypoints || [],
                    showLabel: edgeData.showLabel === true,
                    isSelected,
                    snapEnabled: snapEnabled ?? true,
                    snapPixels: snapPixels ?? 15,
                    onWaypointsChange: onWaypointsChange
                        ? (wps: { x: number; y: number }[]) => onWaypointsChange(id, wps)
                        : undefined,
                },
                label: typeConfig.label || edgeData.connectionType || '',
                style: strokeStyle,
                markerEnd: arrowMarker,
                interactionWidth: 20,
            };
        });
};
