import React from 'react';
import { ComponentDesignDelegate, InteractionRegistry } from '@inductiveautomation/perspective-designer';
import { DatabaseSchema, HierarchyChart, JsonEditor } from '@wargoetz/reactflow-client';

// 1. Delegate for Database Schema
const dbSchemaDelegate: ComponentDesignDelegate = {
    type: 'com.wargoetz.reactflow.databaseschema',
    // Pass the raw reference directly. NO arrow functions, NO JSX.
    designerComponent: DatabaseSchema as any 
};

// 2. Delegate for Hierarchy Chart
const hierarchyChartDelegate: ComponentDesignDelegate = {
    type: 'com.wargoetz.reactflow.hierarchychart',
    // Pass the raw reference directly. NO arrow functions, NO JSX.
    designerComponent: HierarchyChart as any 
};

// 3. Delegate for JSON Editor
const jsonEditorDelegate: ComponentDesignDelegate = {
    type: 'com.wargoetz.jsoneditor',
    // Pass the raw reference directly. NO arrow functions, NO JSX.
    designerComponent: JsonEditor as any 
};

// 4. Register all of them
InteractionRegistry.registerInteractionDelegates(dbSchemaDelegate);
InteractionRegistry.registerInteractionDelegates(hierarchyChartDelegate);
InteractionRegistry.registerInteractionDelegates(jsonEditorDelegate);