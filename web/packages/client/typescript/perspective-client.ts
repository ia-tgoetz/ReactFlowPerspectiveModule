import { ComponentMeta, ComponentRegistry } from '@inductiveautomation/perspective-client';
import { DatabaseSchema } from './components/DatabaseSchema/DatabaseSchema';
import { HierarchyChart } from './components/HierarchyChart/HierarchyChart';
import { JsonEditor } from './components/JsonEditor/JsonEditor';

// --- CRITICAL ADDITION ---
// You MUST export the components so the Designer bundle can import them 
// via the '@wargoetz/databaseschema-client' external mapping.
export { DatabaseSchema, HierarchyChart, JsonEditor };

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
            // CRITICAL ADDITIONS: Without these, the TSX won't receive your custom colors or styles!
            customTheme: tree.read('customTheme'), 
            editable: tree.read('editable', true),
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
} else {
    registry.register(new DatabaseSchemaMeta());
    registry.register(new HierarchyChartMeta());
    registry.register(new JsonEditorMeta());
}