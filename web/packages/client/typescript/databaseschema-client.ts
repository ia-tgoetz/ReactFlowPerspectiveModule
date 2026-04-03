import { ComponentRegistry } from '@inductiveautomation/perspective-client';
import { DatabaseSchema } from './components/DatabaseSchema';

// 1. EXPORT it here so the @wargoetz/databaseschema-designer package can access it!
export * from './components/DatabaseSchema';

// 2. Register it with the Perspective Client using the exact ID from your Java code
(ComponentRegistry as any).register({
    type: 'wargoetz.display.databaseschema',
    component: DatabaseSchema,
    componentType: 'react'
});