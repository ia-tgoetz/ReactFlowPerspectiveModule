package com.wargoetz.schema.common;

import com.inductiveautomation.ignition.common.jsonschema.JsonSchema;
import com.inductiveautomation.perspective.common.api.BrowserResource;
import com.inductiveautomation.perspective.common.api.ComponentDescriptor;
import com.inductiveautomation.perspective.common.api.ComponentDescriptorImpl;
import com.inductiveautomation.perspective.common.api.ComponentEventDescriptor;

import java.util.Set;

public class DatabaseSchemaMeta {

    //1. Matches your perspective-client.ts
    public static final String COMPONENT_ID = "com.wargoetz.reactFlow.databaseschema"; 
    
    //2. Matches your build.gradle.kts
    public static final String MODULE_ID = "com.wargoetz.reactFlow"; 

    //3. The "/res/" paths MUST use the new MODULE_ID to find the Webpack files!
    public static final BrowserResource JS_RESOURCE = new BrowserResource(
        "databaseschema-client-js",
        "/res/" + MODULE_ID + "/DatabaseSchemaClient.js", // Updated to inject the new MODULE_ID
        BrowserResource.ResourceType.JS
    );
    
    public static final BrowserResource CSS_RESOURCE = new BrowserResource(
        "databaseschema-client-css",
        "/res/" + MODULE_ID + "/DatabaseSchemaClient.css", // Updated to inject the new MODULE_ID
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