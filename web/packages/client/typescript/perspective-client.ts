import { ComponentMeta, ComponentRegistry } from '@inductiveautomation/perspective-client';
import { DatabaseSchema } from './components/DatabaseSchema/DatabaseSchema';
import { HierarchyChart } from './components/HierarchyChart/HierarchyChart';
import { JsonEditor } from './components/JsonEditor/JsonEditor';
import { ArchitectureBuilder } from './components/ArchitectureBuilder/ArchitectureBuilder'; // <-- 1. IMPORT

// 2. EXPORT (Crucial for Webpack!)
export { DatabaseSchema, HierarchyChart, JsonEditor, ArchitectureBuilder };

// --- DATABASE SCHEMA ---
export class DatabaseSchemaMeta implements ComponentMeta {
    getComponentType(): string {
        return 'com.wargoetz.reactflow.databaseschema'; 
    }
    getViewComponent(): any {
        return DatabaseSchema as any;
    }
    getDefaultSize(): any {
        return { width: 800, height: 600 };
    }
    getPropsReducer(tree: any): any {
        return {
            style: tree.read('style'), 
            tables: tree.read('tables'),
            relationships: tree.read('relationships')
        };
    }
}

// --- HIERARCHY CHART ---
export class HierarchyChartMeta implements ComponentMeta {
    getComponentType(): string {
        return 'com.wargoetz.reactflow.hierarchychart'; 
    }
    getViewComponent(): any {
        return HierarchyChart as any;
    }
    getDefaultSize(): any {
        return { width: 800, height: 600 };
    }
    getPropsReducer(tree: any): any {
        return {
            style: tree.read('style'),
            nodes: tree.read('nodes'),
            layoutDirection: tree.read('layoutDirection', 'TB'),
            lineType: tree.read('lineType', 'smoothstep')
        };
    }
}

// --- JSON EDITOR ---
export class JsonEditorMeta implements ComponentMeta {
    getComponentType(): string {
        return 'com.wargoetz.reactflow.jsoneditor'; 
    }
    getViewComponent(): any {
        return JsonEditor as any;
    }
    getDefaultSize(): any {
        return { width: 400, height: 400 };
    }
    getPropsReducer(tree: any): any {
        return {
            data: tree.read('data'),
            theme: tree.read('theme', 'monokai'),
            customTheme: tree.read('customTheme'), 
            editable: tree.read('editable', true),
            style: tree.read('style') 
        };
    }
}

// --- ARCHITECTURE BUILDER (NEW) ---
export class ArchitectureBuilderMeta implements ComponentMeta {
    getComponentType(): string {
        return 'com.wargoetz.reactflow.architecturebuilder'; 
    }
    getViewComponent(): any {
        return ArchitectureBuilder as any;
    }
    getDefaultSize(): any {
        return { width: 800, height: 600 };
    }
    getPropsReducer(tree: any): any {
        return {
            nodes: tree.read('nodes'),
            edges: tree.read('edges'),
            paletteItems: tree.read('paletteItems'),
            connectionTypes: tree.read('connectionTypes'),
            
            // These must exactly match the keys in your architecturebuilder.props.json
            snapEnabled: tree.read('snapEnabled', true),
            snapPixels: tree.read('snapPixels', 15),
            hideHandles: tree.read('hideHandles', false),
            
            style: tree.read('style')
        };
    }
}

// --- REGISTRATION ---
const registry = ComponentRegistry as any;
if (registry.registerComponent) {
    registry.registerComponent(new DatabaseSchemaMeta());
    registry.registerComponent(new HierarchyChartMeta());
    registry.registerComponent(new JsonEditorMeta());
    registry.registerComponent(new ArchitectureBuilderMeta()); // <-- 3. REGISTER
} else {
    registry.register(new DatabaseSchemaMeta());
    registry.register(new HierarchyChartMeta());
    registry.register(new JsonEditorMeta());
    registry.register(new ArchitectureBuilderMeta()); // <-- 3. REGISTER
}