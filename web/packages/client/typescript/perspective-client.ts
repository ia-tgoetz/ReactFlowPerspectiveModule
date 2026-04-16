import { ComponentMeta, ComponentRegistry } from '@inductiveautomation/perspective-client';
import { DatabaseSchema } from './components/DatabaseSchema/DatabaseSchema';
import { HierarchyChart } from './components/HierarchyChart/HierarchyChart';

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

// --- REGISTRATION ---
const registry = ComponentRegistry as any;
if (registry.registerComponent) {
    registry.registerComponent(new DatabaseSchemaMeta());
    registry.registerComponent(new HierarchyChartMeta());
} else {
    registry.register(new DatabaseSchemaMeta());
    registry.register(new HierarchyChartMeta());
}