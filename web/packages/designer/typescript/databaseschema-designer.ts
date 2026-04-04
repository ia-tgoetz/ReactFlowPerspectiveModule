import { ComponentDesignDelegate, InteractionRegistry } from '@inductiveautomation/perspective-designer';
import { DatabaseSchema } from '@wargoetz/databaseschema-client';

// 1. Create a delegate to tell the Designer how to render your component
const delegate: ComponentDesignDelegate = {
    // This MUST match your DatabaseSchemaMeta.COMPONENT_ID in Java exactly
    type: 'wargoetz.display.databaseschema',
    
    // Add "as any" right here to satisfy the PComponent strict typing!
    designerComponent: () => DatabaseSchema as any 
};

// 2. Register it with the Designer's Interaction Registry
InteractionRegistry.registerInteractionDelegates(delegate);