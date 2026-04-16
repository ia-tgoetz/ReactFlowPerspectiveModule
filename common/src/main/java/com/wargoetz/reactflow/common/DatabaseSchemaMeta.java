package com.wargoetz.reactflow.common;

import com.inductiveautomation.ignition.common.jsonschema.JsonSchema;
import com.inductiveautomation.perspective.common.api.BrowserResource;
import com.inductiveautomation.perspective.common.api.ComponentDescriptor;
import com.inductiveautomation.perspective.common.api.ComponentDescriptorImpl;
import com.inductiveautomation.perspective.common.api.ComponentEventDescriptor;

import java.util.Set;

public class DatabaseSchemaMeta {
    // Synchronize to all lowercase "reactflow"
    public static final String COMPONENT_ID = "com.wargoetz.reactflow.databaseschema"; 
    public static final String MODULE_ID = "com.wargoetz.reactflow"; 

    public static final BrowserResource JS_RESOURCE = new BrowserResource(
        "databaseschema-js", 
        "/res/" + MODULE_ID + "/DatabaseSchemaClient.js", 
        BrowserResource.ResourceType.JS
    );
    
    public static final BrowserResource CSS_RESOURCE = new BrowserResource(
        "databaseschema-css",
        "/res/" + MODULE_ID + "/DatabaseSchemaClient.css", 
        BrowserResource.ResourceType.CSS
    );

    public static final ComponentDescriptor DESCRIPTOR = ComponentDescriptorImpl.ComponentBuilder.newBuilder()
            .setId(COMPONENT_ID)
            .setModuleId(MODULE_ID)
            .setPaletteCategory("WARGoetz") 
            .setName("Database Schema")
            .addPaletteEntry("", "Database Schema", "Visualizes SQL Historian schemas.", null, null)
            .setDefaultMetaName("dbSchema")
            .setResources(Set.of(JS_RESOURCE, CSS_RESOURCE))
            .setEvents(Set.of(
                new ComponentEventDescriptor(
                    "onRowClick", 
                    "Fired when a user clicks on a specific column row in a table.", 
                    null
                )
            ))
            .setSchema(JsonSchema.parse(DatabaseSchemaMeta.class.getResourceAsStream("/databaseschema.props.json")))
            .build();
}