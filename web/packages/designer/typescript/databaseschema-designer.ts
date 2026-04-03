import { DesignerComponentStore } from '@inductiveautomation/perspective-designer';
// Import the component directly from your client package library
import { DatabaseSchema } from '@wargoetz/databaseschema-client';

// Register it with the Designer workspace
(DesignerComponentStore as any).registerComponent({
    type: 'wargoetz.display.databaseschema',
    component: DatabaseSchema
});