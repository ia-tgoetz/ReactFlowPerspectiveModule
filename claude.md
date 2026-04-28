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
- **`getPropsReducer` is the gateway for ALL props.** In `perspective-client.ts`, `ArchitectureBuilderMeta.getPropsReducer(tree)` must call `tree.read('propName', defaultValue)` for every property in `architecturebuilder.props.json`. If a prop is missing from `getPropsReducer`, it will NEVER appear in `props.props` inside the component — no amount of `extractDeep` or MobX tracking will help. Adding a prop to the schema AND the component code without also adding it to `getPropsReducer` is a silent failure.

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

## 🤖 Claude Code Automation

### Slash Commands (`.claude/commands/`)
Invoke these from the Claude Code prompt with `/`:

| Command | What it does |
|---|---|
| `/build` | Runs `./gradlew build`, reports errors with fix suggestions |
| `/install` | Runs `./gradlew installModule`, deploys to local test gateway |
| `/clean` | Runs `./gradlew clean`, use before a full rebuild |
| `/validate-edges` | Full 8-rule audit of edge routing code with PASS/FAIL/WARN table |
| `/sync-tools` | Re-syncs all automation files from CLAUDE.md (run after editing rules) |

### Subagents (`.claude/agents/`)
Long-running, read-only audits that don't consume main conversation context:

| Agent | How to invoke | Purpose |
|---|---|---|
| `edge-validator` | "Use the edge-validator agent to check my changes" | Deep audit of CustomEdge, EdgeUtils, and useArchitectureFlowHandlers against all 8 routing rules. Returns a PASS/FAIL/WARN table with file:line references. |
| `props-wiring` | "Use the props-wiring agent to audit my prop changes" | Verifies that every property in `architecturebuilder.props.json` has a matching `tree.read()` in `getPropsReducer` (perspective-client.ts), and that every `props.props.*` access in the component is actually wired. Catches silent missing-prop failures before they reach the Designer. |

### Hooks (`.claude/settings.json`)
Two hooks fire automatically on every `Edit` or `Write`:

- **`check-edge-rules.js`** — reads patterns from `.claude/edge-rules.json` and scans edge files for violations. Exit 2 blocks the edit immediately. Currently checks Rules 3, 6, and 8.
- **`notify-claude-md-change.js`** — when `CLAUDE.md` is edited, writes a reminder to stdout telling Claude to run `/sync-tools`.

### Auto-update pipeline
Rules live in one place (CLAUDE.md). When you change them:
1. The `notify-claude-md-change.js` hook fires and prompts Claude to run `/sync-tools`
2. `/sync-tools` updates `.claude/edge-rules.json`, `validate-edges.md`, and `edge-validator/agent.md` to match
3. The hook script picks up new patterns from `edge-rules.json` on its next run — no restart needed

`.claude/edge-rules.json` is the machine-readable single source of truth for static pattern checks.

### When to use each tool
- **Daily workflow:** `/build` and `/install` for the compile-deploy loop
- **After edge changes:** hook fires automatically; run `/validate-edges` for the full 8-rule report before committing
- **Deep audit:** spawn `edge-validator` when making structural changes to CustomEdge or EdgeUtils
- **After adding/renaming a prop:** spawn `props-wiring` to verify schema ↔ getPropsReducer ↔ component usage are all consistent
- **After editing CLAUDE.md rules:** run `/sync-tools` (or let the hook remind you)

## 🛑 Claude Instruction Overrides
- **No Python 3:** Never suggest Python 3 features for internal Ignition scripts.
- **Industrial Context:** Prioritize reliability for MQTT and Sparkplug B protocols.
- **Environment Aware:** Always prefer `system.*` API over standard library alternatives.