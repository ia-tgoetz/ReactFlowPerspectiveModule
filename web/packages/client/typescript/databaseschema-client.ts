import { ComponentMeta, ComponentRegistry } from '@inductiveautomation/perspective-client';
import { DatabaseSchema } from './components/DatabaseSchema';

export class DatabaseSchemaMeta implements ComponentMeta {
    // 1. Identification
    get type(): string {
        return "wargoetz.display.databaseschema";
    }

    // 2. The React Component (using 'any' here solves the "not assignable" error)
    getViewComponent(): any {
        return DatabaseSchema;
    }

    // 3. Mandatory method from the error: getComponentType
    getComponentType(): string {
        return "wargoetz.display.databaseschema";
    }

    // 4. Mandatory method from the error: getDefaultSize
    getDefaultSize(): { width: number; height: number } {
        return {
            width: 400,
            height: 300
        };
    }

    // 5. Initial state of the component
    getDefaultProps(): any {
        return {
            tables: [],
            relationships: []
        };
    }
}

// Register the class instance
ComponentRegistry.register(new DatabaseSchemaMeta());

export { DatabaseSchema };