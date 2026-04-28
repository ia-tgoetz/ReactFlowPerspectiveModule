import * as React from 'react';
// @ts-ignore
import { BaseEdge, getBezierPath, getSmoothStepPath, getStraightPath, EdgeLabelRenderer, useReactFlow } from 'reactflow';
import { buildPolylinePath, computeAutoWaypoints } from './EdgeUtils';

type Waypoint = { x: number; y: number };

interface DragState {
    startClientX: number;
    startClientY: number;
    startCoord: number;
    wp0Idx: number;
    wp1Idx: number;
    isH: boolean;
    baseWaypoints: Waypoint[];
    snapEnabled: boolean;
    snapPixels: number;
    onWaypointsChange: ((wps: Waypoint[]) => void) | undefined;
}

export const CustomEdge = ({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    data, markerEnd, style, label,
}: any) => {
    const storedWaypoints: Waypoint[] = data?.waypoints ?? [];
    const showLabel = data?.showLabel === true;
    const { getZoom } = useReactFlow();

    // null = at rest (derive from props); non-null = user is actively dragging.
    // No useEffect or useMemo sync — the component reads from storedWaypoints (props) directly.
    const [liveWaypoints, setLiveWaypoints] = React.useState<Waypoint[] | null>(null);
    const dragState = React.useRef<DragState | null>(null);

    const isStepType = data?.lineType === 'step' || data?.lineType === 'smoothstep' || !data?.lineType;
    const isHorizSrc = sourcePosition === 'right' || sourcePosition === 'left';
    const isHorizTgt = targetPosition === 'right' || targetPosition === 'left';

    // Priority: active drag > stored custom waypoints > auto-routed.
    // Stored waypoints are never discarded in favour of auto-routing once they exist.
    const baseWaypoints: Waypoint[] =
        liveWaypoints ??
        (storedWaypoints.length > 0
            ? storedWaypoints
            : computeAutoWaypoints(sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition));

    // Pin the perpendicular axis of the first/last waypoint on every render so the
    // edge always exits/enters perpendicular to the handle, even when nodes move.
    // The parallel axis (the user's flat segment) is untouched.
    const pinnedWaypoints: Waypoint[] =
        isStepType && baseWaypoints.length > 0
            ? baseWaypoints.map((wp, i) => {
                if (i === 0)
                    return isHorizSrc ? { ...wp, y: sourceY } : { ...wp, x: sourceX };
                if (i === baseWaypoints.length - 1)
                    return isHorizTgt ? { ...wp, y: targetY } : { ...wp, x: targetX };
                return wp;
            })
            : baseWaypoints;

    const allPts: Waypoint[] = [{ x: sourceX, y: sourceY }, ...pinnedWaypoints, { x: targetX, y: targetY }];

    // ─── Path computation (SVG math unchanged) ────────────────────────────

    let edgePath = '', labelX = (sourceX + targetX) / 2, labelY = (sourceY + targetY) / 2;

    if (isStepType) {
        edgePath = buildPolylinePath(allPts, data?.lineType === 'step' ? 0 : 12);
        if (allPts.length >= 2) {
            const mid = Math.floor(allPts.length / 2);
            labelX = (allPts[mid - 1].x + allPts[mid].x) / 2;
            labelY = (allPts[mid - 1].y + allPts[mid].y) / 2;
        }
    } else if (data?.lineType === 'straight') {
        [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
    } else if (data?.lineType === 'default') {
        [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
    } else {
        [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 15 });
    }

    // ─── Pointer-capture drag engine ──────────────────────────────────────

    const canEdit = data?.isSelected && isStepType;

    // Shared delta computation — reads only from dragState (ref, always current)
    // and getZoom (stable hook reference), so it never goes stale.
    const applyDelta = (ref: DragState, clientX: number, clientY: number): Waypoint[] => {
        const zoom = getZoom();
        const rawDelta = ref.isH
            ? (clientY - ref.startClientY) / zoom
            : (clientX - ref.startClientX) / zoom;
        let newCoord = ref.startCoord + rawDelta;
        if (ref.snapEnabled && ref.snapPixels) newCoord = Math.round(newCoord / ref.snapPixels) * ref.snapPixels;
        return ref.baseWaypoints.map((wp, i) =>
            i === ref.wp0Idx || i === ref.wp1Idx
                ? ref.isH ? { ...wp, y: newCoord } : { ...wp, x: newCoord }
                : wp
        );
    };

    // Not memoized: it closes over pinnedWaypoints (render-scope) and data snap settings,
    // both of which are intentionally captured fresh at the moment the user presses down.
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, segIdx: number, isH: boolean) => {
        e.stopPropagation();
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);

        const startWps = pinnedWaypoints; // capture visual truth at drag start
        dragState.current = {
            startClientX: e.clientX,
            startClientY: e.clientY,
            startCoord: isH ? startWps[segIdx - 1].y : startWps[segIdx - 1].x,
            wp0Idx: segIdx - 1,
            wp1Idx: segIdx,
            isH,
            baseWaypoints: startWps,
            snapEnabled: data?.snapEnabled ?? true,
            snapPixels: data?.snapPixels ?? 15,
            onWaypointsChange: data?.onWaypointsChange,
        };
        setLiveWaypoints(startWps);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragState.current) return;
        setLiveWaypoints(applyDelta(dragState.current, e.clientX, e.clientY));
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        const ref = dragState.current;
        if (!ref) return;
        e.currentTarget.releasePointerCapture(e.pointerId);
        ref.onWaypointsChange?.(applyDelta(ref, e.clientX, e.clientY));
        dragState.current = null;
        setLiveWaypoints(null);
    };

    // Cancel (e.g. Escape, touch interrupt) — revert without persisting
    const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragState.current) return;
        e.currentTarget.releasePointerCapture(e.pointerId);
        dragState.current = null;
        setLiveWaypoints(null);
    };

    // ─── Render ───────────────────────────────────────────────────────────

    const segHandlePts: Waypoint[] = [{ x: sourceX, y: sourceY }, ...pinnedWaypoints, { x: targetX, y: targetY }];

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, fill: 'none' }} />
            {label && showLabel && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            backgroundColor: 'var(--neutral-10)', padding: '2px 8px', borderRadius: '4px',
                            border: `1px solid var(--neutral-40)`, fontSize: '12px', fontWeight: 'bold',
                            color: style?.stroke || 'var(--neutral-90)', pointerEvents: 'none',
                        }}
                        className="nodrag nopan"
                    >
                        {label}
                    </div>
                </EdgeLabelRenderer>
            )}
            {canEdit && segHandlePts.length >= 4 && (
                <EdgeLabelRenderer>
                    {segHandlePts.slice(0, -1).map((pt, i) => {
                        const next = segHandlePts[i + 1];
                        if (i === 0 || i === segHandlePts.length - 2) return null;
                        const dx = Math.abs(next.x - pt.x);
                        const dy = Math.abs(next.y - pt.y);
                        if (dx + dy < 10) return null;
                        const isH = dx > dy;
                        const mx = (pt.x + next.x) / 2;
                        const my = (pt.y + next.y) / 2;
                        return (
                            <div
                                key={`seg-${i}`}
                                className="nodrag nopan"
                                onPointerDown={(e) => handlePointerDown(e, i, isH)}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerCancel}
                                title={isH ? 'Drag up/down' : 'Drag left/right'}
                                style={{
                                    position: 'absolute',
                                    transform: `translate(-50%, -50%) translate(${mx}px, ${my}px)`,
                                    width: isH ? '36px' : '14px',
                                    height: isH ? '14px' : '36px',
                                    borderRadius: '7px',
                                    backgroundColor: 'var(--callToAction)',
                                    opacity: 0.85,
                                    cursor: isH ? 'ns-resize' : 'ew-resize',
                                    zIndex: 10,
                                    pointerEvents: 'all',
                                    touchAction: 'none',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                                }}
                            />
                        );
                    })}
                </EdgeLabelRenderer>
            )}
        </>
    );
};

export const edgeTypes = { custom: CustomEdge };
