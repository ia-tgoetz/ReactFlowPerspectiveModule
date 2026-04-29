# Architecture Builder

A React Flow-based Perspective component for creating interactive system architecture diagrams. Nodes represent infrastructure components, edges represent connections between them, and containers group related components into logical zones.

---

## Table of Contents

1. [Overview](#overview)
2. [Props Schema](#props-schema)
3. [Nodes](#nodes)
4. [Edges](#edges)
5. [Containers](#containers)
6. [Palette & Sidebar](#palette--sidebar)
7. [Connections & Handles](#connections--handles)
8. [Hierarchy & Computed Data](#hierarchy--computed-data)
9. [Context Menu](#context-menu)
10. [Style Editor](#style-editor)
11. [Keyboard Shortcuts](#keyboard-shortcuts)
12. [Component Events](#component-events)
13. [Visual Behavior](#visual-behavior)

---

## Overview

The Architecture Builder renders a pan/zoom infinite canvas. Users drag palette items onto the canvas to place nodes, draw edges between them, group nodes inside container zones, and export the full state as structured JSON through Ignition's prop system.

The component is built on [React Flow v11](https://reactflow.dev) with `ConnectionMode.Loose`, meaning any handle can connect to any other handle regardless of source/target type.

---

## Props Schema

All props are defined in `architecturebuilder.props.json`.

| Prop | Type | Description |
|---|---|---|
| `enabled` | boolean | Enables/disables all editing interactions (drag, connect, delete, context menu). Read-only when false. |
| `enableOnClickEvents` | boolean | When true, node/edge/pane click events fire even if `enabled` is false (default true). Allows scripts to respond to clicks on a locked canvas. |
| `edgeWidth` | number | Global stroke width for edges in pixels (default 6). Hovered and selected edges render at `edgeWidth + 2`. |
| `hideHandles` | boolean | Globally hides connection handles on all nodes. |
| `handleCount` | number | Number of handles per side on each node (1–8, default 5). |
| `defaultConnectionType` | string | Connection type auto-selected when multiple valid types exist. |
| `snapEnabled` | boolean | Enables snap-to-grid when dragging nodes (default true). |
| `snapPixels` | number | Grid size in pixels (default 15). |
| `connectionTypes` | object | Map of connection type IDs to type definitions (see below). |
| `paletteItems` | array | List of palette items available in the sidebar (see below). |
| `nodes` | object | Map of node IDs to node data (see below). Written back by the component. |
| `edges` | object | Map of edge IDs to edge data (see below). Written back by the component. |
| `hierarchy` | object | Computed nested tree of containers/nodes. Written back by the component. |
| `style` | object | CSS styles applied to the outer wrapper. |

### Connection Type Definition

```json
{
  "myConnectionType": {
    "label": "Display Label",
    "color": "#FF8C00",
    "arrow": true,
    "multiple": true
  }
}
```

- `multiple: false` — only one edge of this type can exist between a given pair of nodes.

### Palette Item Definition

```json
{
  "id": "Gateway",
  "typeId": "gateway",
  "category": "Ignition",
  "label": "Gateway",
  "tooltip": "Ignition Gateway Server",
  "b64Image": "<svg>...</svg>",
  "supportedConnections": ["network", "db"],
  "defaultConfigs": {},
  "hideHandles": false,
  "style": {},
  "labelStyle": {},
  "swappableWith": ["EdgeGateway"]
}
```

Items with `id === "container"` are displayed at the top of the sidebar as container zones.

---

## Nodes

Node data is stored in `props.nodes` as a flat dictionary keyed by short hex IDs (e.g. `"I3f2a6e4d"`).

### Node Fields

| Field | Type | Description |
|---|---|---|
| `paletteId` | string | Palette item ID this node was created from. `"container"` for zones. |
| `typeId` | string | Semantic type identifier (e.g. `"gateway"`, `"database"`). |
| `label` | string | Display name shown in the node's label tab. |
| `b64Image` | string | SVG markup or base64 data URI for the node icon. |
| `tooltip` | string | Hover tooltip text. |
| `x` | number | Canvas X position. |
| `y` | number | Canvas Y position. |
| `style` | object | Visual overrides (backgroundColor, borderColor, etc.). |
| `labelStyle` | object | Label tab overrides (backgroundColor, color, fill, fontSize). |
| `textStyle` | object | Text content overrides for Note/Label nodes (color, fontSize). |
| `text` | string | Editable text content (Note and Label nodes only). |
| `configs` | object | Custom config object, passed through to events. |
| `supportedConnections` | string[] | Connection type IDs this node can participate in. |
| `hideHandles` | boolean | Per-node override to hide handles. |
| `inactive` | boolean | Renders node in grayscale and its edges as dashed. |
| `hierarchy` | string[] | **Computed.** IDs of all containing containers, outermost first. |
| `connections` | string[] | **Computed.** Sorted list of edge IDs this node participates in. |

`hierarchy` and `connections` are written back automatically by the component — do not set them manually.

For containers, the additional fields are:

| Field | Type | Description |
|---|---|---|
| `width` | number | Container width in pixels (default 300). |
| `height` | number | Container height in pixels (default 300). |
| `zIndex` | number | Stacking order (default -1, below all regular nodes). |
| `configs.unlinked` | boolean | When true, dragging the container does not move its children. |

---

## Edges

Edge data is stored in `props.edges` as a flat dictionary keyed by short hex IDs.

### Edge Fields

| Field | Type | Description |
|---|---|---|
| `source` | string | Source node ID. |
| `target` | string | Target node ID. |
| `sourceHandle` | string | Handle ID on the source node. |
| `targetHandle` | string | Handle ID on the target node. |
| `connectionType` | string | Connection type ID from `connectionTypes`. |
| `lineType` | string | `"smoothstep"` (default), `"step"`, `"straight"`, `"default"` (bezier). |
| `dashed` | boolean | Renders edge as a dashed line. |
| `arrow` | boolean | Shows arrowhead at target (default true). |
| `showLabel` | boolean | Displays the connection type label on the edge. |
| `waypoints` | array | `[{x, y}, ...]` defining the orthogonal path. Computed at placement; updated by segment drag. |

Stroke width is driven by the `edgeWidth` prop (default 6). Hovered and selected edges render at `edgeWidth + 2`. `waypoints[]` is the only routing storage — there are no offset fields.

New connections are created with `waypoints: []`. The edge routes automatically via live path computation until the user drags a segment, at which point the waypoints are persisted. Reconnecting an existing endpoint immediately recomputes a clean route.

---

## Containers

Containers are special nodes (`paletteId === "container"`) that act as resizable, labeled zones. They always render below regular nodes (`zIndex: -1` by default).

**Drag behavior:** Dragging a container moves all nodes fully enclosed within its bounds. Toggle this off per-container via `configs.unlinked` (right-click → Toggle Link).

**Resize behavior:** The resize handle appears when a container is selected. Resizing is disabled when `enabled` is false — the handle is hidden and `onResizeEnd` cannot fire.

**Stacking order:** Multiple overlapping containers can be reordered via right-click → Order submenu (Bring to Front, Bring Forward, Send Backward, Send to Back).

**Containment rule:** A node is "inside" a container only if its entire bounding box fits within the container's bounds, and its dimensions are strictly smaller than the container (prevents a container from being its own parent).

---

## Palette & Sidebar

The sidebar is collapsible (toggle button on its right edge). It groups palette items by `category`, with each category collapsible independently. Categories are expanded by default.

Container items appear above the category groups, separated by a divider.

**Drag to canvas:** Drag any palette item onto the ReactFlow canvas to place a node. A full-size (150×150 px) centered drag ghost image follows the cursor.

**Click:** Clicking a palette item fires the `onPaletteItemClick` component event without placing a node.

---

## Connections & Handles

### Handle Layout

Each node renders handles on all four sides (Top, Right, Bottom, Left). The number of handles per side is controlled by `handleCount` (global) or `hideHandles` (per-node). All handles use `type="source"` — `ConnectionMode.Loose` in the ReactFlow instance allows source-to-source connections.

Handle positions are evenly distributed along each side. For example, with `handleCount = 5`, handles appear at 10%, 30%, 50%, 70%, and 90% of the side length.

### Connection Validation

A connection is valid when `getValidIntersection(source, target)` returns at least one shared connection type in both nodes' `supportedConnections` arrays. For connection types with `multiple: false`, a connection is only valid if no edge of that type already exists between the pair.

### Handle Visual States

| State | Appearance |
|---|---|
| Default (hidden handles off) | 8×8 px, `var(--neutral-90)` background |
| Hover (no drag in progress) | Scales 1.5×, `var(--callToAction)` color |
| Source handle (drag in progress) | 14×14 px, blue (`#3b82f6`) |
| Valid target (hovering a compatible node) | 14×14 px, green (`#22c55e`), crosshair cursor |
| Invalid target (hovering an incompatible node) | 14×14 px, red (`#ef4444`), not-allowed cursor |

### ReactFlow CSS Class Behavior (v11)

ReactFlow v11 adds `.connecting` to **both** the source handle and the currently hovered target handle. It adds `.valid` to the hovered target only when `isValidConnection` returns true. It **never** adds `.invalid`.

The invalid target detection therefore uses:

```css
.arch-node-handle.connecting:not(.valid):hover { ... }
```

This requires `.connecting` (hovered target OR source), excludes `.valid` (valid targets), and uses `:hover` to distinguish the hovered target from the stationary source handle (which also has `.connecting` but is not `:hover`).

### Hit Area

Each handle has a transparent 30×30 px `::after` pseudo-element to expand the clickable area without changing the visual size.

### Cursor Context

| Action in progress | Cursor on handles |
|---|---|
| Creating new connection | `crosshair` |
| Moving existing edge endpoint | `grab` |
| Invalid target hovered | `not-allowed` |

The ReactFlow wrapper receives class `arch-creating-edge` or `arch-moving-edge` based on these states, driving the cursor CSS.

### In-progress Connection Line

The floating connection line during a drag is rendered at 6px stroke width in `#cccccc`.

---

## Hierarchy & Computed Data

The component automatically computes structural metadata whenever `nodes` or `edges` change and writes it back to props.

### Per-node: `hierarchy`

An ordered array of container IDs that enclose the node, sorted **outermost first** (largest area to smallest). Example:

```json
{
  "I3f2a6e4d": {
    "hierarchy": ["I1a72cc4e", "I8e9fd03e"]
  }
}
```

Here `I1a72cc4e` is the root container and `I8e9fd03e` is the innermost direct parent.

### Per-node: `connections`

A sorted array of edge IDs that connect to this node (as either source or target):

```json
{
  "I3f2a6e4d": {
    "connections": ["I84bdf5ab", "Ie37a7504"]
  }
}
```

### Root prop: `hierarchy`

The root `hierarchy` prop is a nested tree of the entire canvas structure. Each entry carries only `id`, `typeId`, and `label` — no connection data.

```json
{
  "areas": [
    {
      "id": "I1a72cc4e",
      "typeId": "container",
      "label": "Energy Transfer",
      "areas": [
        {
          "id": "I8e9fd03e",
          "typeId": "container",
          "label": "Houston, TX",
          "areas": [],
          "nodes": [
            { "id": "I0947173e", "typeId": "standard", "label": "Engine Gateway 1" }
          ]
        }
      ],
      "nodes": []
    }
  ],
  "nodes": [
    { "id": "I154a07b8", "typeId": "LoadBalancer", "label": "Load Balancer" }
  ]
}
```

Nodes at the top level of `nodes` (not inside any container) appear under root `nodes`. Containers with no parent appear under root `areas`.

### Infinite Loop Prevention

Writing enriched nodes back to `props.nodes` re-triggers the hierarchy effect. A serialization ref (`hierarchyWriteRef`) caches the last-written output — if the recomputed result is identical (same positions, same edges), the write is skipped.

---

## Context Menu

Right-click on a node, edge, or the canvas pane to open the context menu.

### Node Actions

| Action | Description |
|---|---|
| Config | Fires `onContextMenuAction` with `action: "config"`. |
| Edit Style | Opens the Style Editor modal. |
| Toggle Inactive | Toggles grayscale rendering and dashes all connected edges. |
| Swap Node | Replaces node type with a compatible palette item (from `swappableWith`). Removes edges incompatible with the new type. |
| Order (containers only) | Bring to Front / Bring Forward / Send Backward / Send to Back. |
| Toggle Link (containers only) | Toggles whether dragging the container moves its children. |
| Copy | Copies the node (or container + all its contents + internal edges) to the clipboard. |
| Delete | Removes the node and all its connected edges. |
| Delete with Contents (containers only) | Removes the container and all enclosed nodes and edges. |

### Edge Actions

| Action | Description |
|---|---|
| Config | Fires `onContextMenuAction` with `action: "config"`. |
| Line Type | Submenu: Smooth Step, Step, Straight, Bezier. |
| Connection Type | Submenu: all valid types for this source/target pair. |
| Toggle Arrow | Shows/hides the arrowhead. |
| Toggle Label | Shows/hides the connection type label on the edge. |
| Toggle Dashed | Switches between solid and dashed rendering. |
| Reverse Edge | Swaps source and target (and handles). Waypoints are reversed so the path geometry stays identical — only the arrowhead moves to the other end. |
| Delete | Removes the edge. |

### Pane Actions

| Action | Description |
|---|---|
| Paste | Pastes the clipboard content at the right-click position. |

---

## Style Editor

Opened via right-click → Edit Style on any node. Provides fields for:

- **Component:** background color, border color, border width, border style, border radius.
- **Label Tab:** background color, text color, icon/gear color, font size.
- **Text Content** (Note/Label nodes only): text color, font size.

The color picker supports a standard 63-color palette swatch grid and a custom tab with a native color input and alpha slider.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+C` / `Cmd+C` | Copy selected node (or container group). |
| `Ctrl+V` / `Cmd+V` | Paste clipboard offset by one snap-grid step. |
| `Delete` / `Backspace` | Delete selected node(s) or edge(s). |
| `Escape` | Close context menu or style editor. |

Shortcuts are disabled when focus is inside an `<input>` or `<textarea>`, and when `enabled` is false.

---

## Component Events

| Event | Payload |
|---|---|
| `onNodeClick` | `{ id, paletteId, typeId, type: "node" }` |
| `onEdgeClick` | `{ id, paletteId (connectionType), type: "edge" }` |
| `onGearClick` | `{ id, paletteId, typeId, type: "node", action: "config" }` |
| `onPaletteItemClick` | Full palette item fields. |
| `onContextMenuAction` | `{ id, paletteId, type, action }` where `action` is the menu action string (e.g. `"delete"`, `"lineType:step"`, `"swapNode:EdgeGateway"`). |

---

## Visual Behavior

### Gear Icon

Every node has a gear icon in its label tab. It spins 360° on hover and plays a reverse spin on click. Clicking the label tab (including the gear) fires `onGearClick`.

### Inactive State

Toggling a node inactive (`toggleGrayscale`) applies `filter: grayscale(100%)` and converts all its connected edges to dashed. Re-activating removes both effects (unless the other endpoint is also inactive).

### Node Text (Note / Label)

Nodes with `paletteId` of `"Note"` or `"Label"` render a `<textarea>` instead of an image. Text is editable in-place; changes are committed on blur.

### Custom SVG Images

Both `b64Image` and drag ghost images support raw SVG markup (detected by leading `<`) or `data:` URIs. Raw SVG is encoded as a `data:image/svg+xml,` URL.

### Snap to Grid

When `snapEnabled` is true, node drops and drags snap to a `snapPixels × snapPixels` grid. The ReactFlow `<Background>` dot grid matches this spacing.

### Connected Handle Highlight

When an edge is selected, the two handles it connects to are highlighted: they grow to 12 px and glow in `var(--callToAction)`. This makes it immediately clear which endpoints an edge spans, even when handles are normally hidden (`hideHandles: true`).

### Read-only Mode

`enabled` and `enableOnClickEvents` are independent flags:

| `enabled` | `enableOnClickEvents` | Editing | Click events |
|---|---|---|---|
| true | true | ✓ | ✓ |
| false | true | ✗ | ✓ |
| true | false | ✓ | ✗ |
| false | false | ✗ | ✗ |

When `enabled` is false: the sidebar is hidden; drag/drop, connect, delete, and context menus are suppressed; edge segment and endpoint drag handles are hidden; container resize handles are hidden. Pan and zoom remain active. When `enableOnClickEvents` is also false, `onNodeClick`, `onEdgeClick`, and `onPaneClick` component events are suppressed.
