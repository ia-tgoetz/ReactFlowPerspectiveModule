# Ignition Perspective Database Schema Component

A custom, highly interactive Perspective component for Inductive Automation's Ignition platform. Built with the Perspective Component SDK and [React Flow](https://reactflow.dev/), this module allows you to visualize and interact with database schemas, table relationships, and data flows natively inside an Ignition Perspective View.

## ✨ Features

* **Interactive Drag-and-Drop:** Move tables freely around the canvas.
* **Bidirectional Position Syncing:** Dragging a table automatically writes its new X/Y coordinates back to the Ignition Gateway. Coordinates are saved to the Designer's property tree in real-time.
* **Native Theme Awareness:** Built entirely on Ignition's Semantic CSS variables (`--neutral-10`, `--callToAction`, etc.). The component seamlessly transitions between Light and Dark modes without any manual property adjustments.
* **Smart Auto-Routing:** Connection lines automatically calculate the best path. If tables are vertically stacked, lines dynamically draw clean "C-shapes" on the right side to prevent messy, crisscrossing lines.
* **Visual Relationship Indicators:** Select relationship types (`one-to-many`, `many-to-one`, etc.) from a dropdown to instantly apply directional arrows and flowing data animations.
* **Per-Table Styling:** Apply custom CSS to specific table headers or rows using the native Perspective Style Editor paintbrush.

## 📦 Installation

1. Download the latest `.modl` file from the [Releases] page (or build from source).
2. Navigate to your Ignition Gateway Webpage > **Config** > **Modules**.
3. Click **Install or Upgrade a Module**.
4. Upload the `.modl` file and accept the certificate.
5. Open the Ignition Designer. You will find the **Database Schema** component in the Perspective Component Palette.

## 🛠️ Usage & Property Configuration

Drag the component onto a Perspective View. By default, it populates with a visual representation of the Ignition SQL Tag Historian tables to act as a template.

### Tables (`props.tables`)
Each object in the tables array represents a distinct node on the canvas.
* `id` (String): Unique identifier for the table (used for relationship mapping).
* `name` (String): The display name in the table header.
* `columns` (Array of Strings): List of column names. Fields ending in `id` will automatically get a 🔑 icon; others get a 📄 icon.
* `position` (Object): `{x, y}` coordinates. **Updates automatically when dragged in a running session or Preview Mode.**
* `headerStyle` / `rowStyle` (Object): Standard Perspective style objects to override the CSS theme for a specific table.

### Relationships (`props.relationships`)
Defines the connection lines drawn between tables.
* `source` / `target` (String): The `id` of the tables to connect.
* `sourceColumn` / `targetColumn` (String, Optional): Connect to a specific row/column instead of the table globally.
* `type` (Enum): Controls the visual flow without cluttering the screen with text.
  * `one-to-many`: Arrow points to target, data flows to target.
  * `many-to-one`: Arrow points to source, data flows to target.
  * `one-to-one`: Solid line, arrows on both ends, no animation.
  * `none`: Clean, solid line with no arrows or animation.
* `lineColor` (String): Accepts Hex, RGB, or Ignition variables (e.g., `var(--callToAction)`).
* `lineWidth` (Number): Line thickness.

## ⚠️ Designer "Gotchas"

* **Bidirectional Dragging:** If you are testing the drag-and-drop position saving inside the Ignition Designer, you **must** be in **Preview Mode** (the Play button at the top). Ignition blocks deep property write-backs in standard Design Mode to prevent accidental data pollution.
* **Caching:** If you update the module `.modl` file while the Designer is open, close the View tab, click the green "Update Available" banner at the top of the Designer, and reopen the View to ensure the cached React component is cleared.

## 🏗️ Building from Source

To build this module from the source code, you need Java, Node.js, and Gradle installed.

1. Clone the repository.
2. Open a terminal at the root of the project.
3. Install the frontend dependencies:
   ```bash
   cd web/packages/client
   npm install reactflow
   cd ../../../ ```
4. Build the Ignition Module:
    ```bash
    ./gradlew clean build```
5. The compiled `.modl` file will be located in the `build/` directory.