# Ignition 8.3.5 Module Development Context

## Project Overview
- **Platform:** Inductive Automation Ignition
- **SDK Version:** 8.3.5
- **Runtime Environment:** Java 17 (Required for 8.3+)
- **Build System:** Gradle
- **Frontend Stack:** React 18, TypeScript, Styled Components

## Critical Reference Links
- **Official Documentation:** [Ignition 8.3 Online Manual](https://docs.inductiveautomation.com/display/DOC81/Ignition+8.3+Introduction)
- **SDK Javadocs:** [Ignition 8.3.5 API](https://files.inductiveautomation.com/sdk/javadoc/ignition83/8.3.5/index.html)
- **Module Guide:** [Official Ignition SDK Guide](https://github.com/inductiveautomation/ignition-sdk-guide)
- **Community Extensions:** [Ignition Extensions (Phil Turmel)](https://github.com/pturmel/ignition-extensions)
- **React Flow Docs:** [React Flow Developer Portal](https://reactflow.dev/learn)

## UI/UX & Legacy Reference
- **Legacy Tool:** [Ignition Architecture Builder Demo](https://m.youtube.com/watch?v=bjYgvSPyJYs)
- **Key Features to Replicate:** - Pan/Zoom infinite canvas.
    - Component grouping (Areas).
    - Anchor-point based connections (Database, Gateway, Device, etc.).
    - Automated Bill of Materials (BOM) generation based on canvas state.
    - Import/Export via JSON.

## Technical Constraints & Standards
### Backend (Java/Jython)
- **Java 17:** Use modern Java 17 syntax and features.
- **Jython 2.7:** For Gateway/Designer scripting, stick to Python 2.7 syntax. Avoid Python 3-only libraries.
- **Scoping:** Maintain strict separation between Gateway, Designer, and Client scopes.

### Frontend (Perspective)
- **React Version:** React 18.
- **React Flow:** Primary library for the node-based Architecture Builder replacement.
- **State Management:** Map Ignition Tag data from `this.props.props` into React Flow Nodes/Edges.
- **Component Communication:** Use the Perspective JavaScript SDK `emit` functions for Gateway syncing.

## Build & Deploy Commands
- **Build Module:** `./gradlew build`
- **Clean Project:** `./gradlew clean`
- **Fast Deploy:** `./gradlew installModule`

## Claude Instruction Overrides
- **No Python 3:** Never suggest Python 3 features for internal Ignition scripts.
- **Industrial Context:** Prioritize reliability for MQTT and Sparkplug B protocols.
- **Environment Aware:** Always prefer `system.*` API over standard library alternatives.