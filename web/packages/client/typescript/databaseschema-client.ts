import { ComponentMeta, ComponentRegistry } from '@inductiveautomation/perspective-client';
import { DatabaseSchema } from './components/DatabaseSchema';

// 1. Keep the wildcard export so the designer package can access it
export * from './components/DatabaseSchema';

// 2. Build the Meta class exactly how Ignition expects it
export class DatabaseSchemaMeta implements ComponentMeta {
    
    // Ignition calls this to know the ID
    getComponentType(): string {
        return 'wargoetz.display.databaseschema';
    }

    // Ignition calls this to get your React component
    getViewComponent(): any {
        return DatabaseSchema;
    }

    // Ignition calls this when you drag it onto the screen
    getDefaultSize(): any {
        return {
            width: 600,
            height: 600
        };
    }
}

// 3. Register a new instance of our class
ComponentRegistry.register(new DatabaseSchemaMeta());