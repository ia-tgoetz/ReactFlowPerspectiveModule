# CLAUDE.md - Ignition Architecture Builder (React Flow Module)

## 🏗️ Ecosystem Overview
This repository is **Repo 3 of a 3-Repo Ecosystem** that powers the Ignition Architecture Builder platform.
* **Repo 1 (admin-manager):** Manages the central SQLite database and exposes WebDev APIs.
* **Repo 2 (public-facing-project):** The public-facing Perspective project.
* **Repo 3 (reactflow-module) [THIS REPO]:** A custom Ignition Perspective component module replacing the legacy view canvas with a React Flow implementation. It will be installed on the Gateway and used by Repo 2.

## 🛠️ Project Overview
- **Platform:** Inductive Automation Ignition
- **SDK Version:** 8.3.5
- **Runtime Environment:** Java 17 (Required for 8.3+)
- **Build System:** Gradle
- **Frontend Stack:** React 18, TypeScript, Styled Components, React Flow

## 🔗 Critical Reference Links
- **Official Documentation:** [Ignition 8.3 Online Manual](https://docs.inductiveautomation.com/display/DOC81/Ignition+8.3+Introduction)
- **SDK Javadocs:** [Ignition 8.3.5 API](https://files.inductiveautomation.com/sdk/javadoc/ignition83/8.3.5/index.html)
- **Module Guide:** [Official Ignition SDK Guide](https://github.com/inductiveautomation/ignition-sdk-guide)
- **Community Extensions:** [Ignition Extensions (Phil Turmel)](https://github.com/pturmel/ignition-extensions)
- **React Flow Docs:** [React Flow Developer Portal](https://reactflow.dev/learn)
- **React Flow API Reference:** [React Flow API Docs](https://reactflow.dev/api-reference)
- **React Flow v11 Migration:** [Migrating to v11](https://reactflow.dev/learn/troubleshooting/migrate-to-v11)
- **React Flow Edge Examples:** [Edge Types & Custom Edges](https://reactflow.dev/examples/edges)
- **React Flow What's New:** [2024-04-11 Editable Edges](https://reactflow.dev/whats-new/2024-04-11)

## 🎨 UI/UX & Legacy Reference
- **Legacy Tool:** [Ignition Architecture Builder Demo](https://m.youtube.com/watch?v=bjYgvSPyJYs)
- **Key Features to Replicate:** - Pan/Zoom infinite canvas.
    - Component grouping (Areas/Zones).
    - Anchor-point based connections (Database, Gateway, Device, etc.).
    - Automated Bill of Materials (BOM) generation based on canvas state.
    - Import/Export via JSON.

## ⚙️ Technical Constraints & Standards

### Backend (Java/Jython)
- **Java 17:** Use modern Java 17 syntax and features.
- **Jython 2.7:** For Gateway/Designer scripting, stick to Python 2.7 syntax. Avoid Python 3-only libraries.
- **Scoping:** Maintain strict separation between Gateway, Designer, and Client scopes.

### Frontend (Perspective)
- **React Version:** React 18.
- **React Flow:** Primary library for the node-based Architecture Builder replacement.
- **State Management:** Map Ignition Tag data from `this.props.props` into React Flow Nodes/Edges.
- **Component Communication:** Use the Perspective JavaScript SDK `emit` functions and `props.write()` to sync the canvas state (BOM, connections) back to the Ignition Gateway.

### ArchitectureBuilder Edge Routing Rules
These rules are non-negotiable — never break them when modifying edge logic:
1. **All segments must be strictly horizontal or vertical.** No diagonal segments ever.
2. **Edges must always exit/enter perpendicular to the handle's side.** A right/left handle exits horizontally; a top/bottom handle exits vertically.
3. **All step/smoothstep edges always render via `buildPolylinePath(pinnedWaypoints)`.** Do not introduce a `getSmoothStepPath` rendering branch — it produces a different path shape than the S-shape waypoint structure, causing handles to float off the visible segments.
4. **Waypoints are computed and stored at placement.** `onConnect` and `onEdgeUpdate` both call `getHandlePixelPos` + `computeAutoWaypoints` to write `waypoints[]` immediately. `buildPolylinePath` renders from the first frame with no deferred switch.
5. **Pin first/last waypoints every render.** `waypoints[0]`'s perpendicular axis is overridden with the live `sourceY`/`sourceX`; `waypoints[last]` with `targetY`/`targetX`. This keeps exits perpendicular even when nodes move after waypoints were stored.
6. **Never pass `selected` at the top level of a React Flow edge object.** It makes selection controlled and causes React Flow to abort endpoint drag mid-interaction. Put `isSelected` inside `data` only.
7. **Segment drag is axis-locked and snap-aware.** Horizontal segments drag vertically only; vertical segments drag horizontally only. Both adjacent waypoints update together. Snap values are captured into `dragRef` at drag start to avoid stale closures.
8. **`waypoints[]` is the only edge routing storage.** `offsetX`/`offsetY` are removed and must not be reintroduced.

## 🚀 Build & Deploy Commands
- **Build Module:** `./gradlew build`
- **Clean Project:** `./gradlew clean`
- **Fast Deploy:** `./gradlew installModule`

## 🛑 Claude Instruction Overrides
- **No Python 3:** Never suggest Python 3 features for internal Ignition scripts.
- **Industrial Context:** Prioritize reliability for MQTT and Sparkplug B protocols.
- **Environment Aware:** Always prefer `system.*` API over standard library alternatives.