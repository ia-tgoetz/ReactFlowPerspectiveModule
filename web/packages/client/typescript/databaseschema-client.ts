import { ComponentMeta, ComponentRegistry } from '@inductiveautomation/perspective-client';
import { DatabaseSchema } from './components/DatabaseSchema';

export class DatabaseSchemaMeta implements ComponentMeta {
    getComponentType(): string {
        return 'wargoetz.display.databaseschema';
    }

    getViewComponent(): any {
        return DatabaseSchema as any;
    }

    getDefaultSize(): any {
        return { width: 800, height: 600 };
    }

    // --- THIS IS THE MISSING DATA BRIDGE ---
    // Grabs the properties from the Ignition Designer and hands them to React Flow
    getPropsReducer(tree: any): any {
        return {
            tables: tree.read('tables'),
            relationships: tree.read('relationships')
        };
    }
}

// Safely registers the component
const registry = ComponentRegistry as any;
if (registry.registerComponent) {
    registry.registerComponent(new DatabaseSchemaMeta());
} else {
    registry.register(new DatabaseSchemaMeta());
}