import { DesignerComponentStore } from '@inductiveautomation/perspective-designer';
import { DatabaseSchema } from '@wargoetz/databaseschema-client';

// In this version, the Store is the registry. 
// We use 'registerComponent' or 'register' depending on the exact build.
// If .register() fails, try .registerComponent()
(DesignerComponentStore as any).register({
    type: "wargoetz.display.databaseschema",
    component: DatabaseSchema
});